// netlify/functions/pay-square-order.ts
import type { Handler } from "@netlify/functions";
import { Client, Environment } from "square";

// Small helper
const toBigInt = (n: number) => BigInt(Math.max(0, Math.trunc(Number(n) || 0)));

function resolveSquareConfig() {
  const env = (process.env.SQUARE_ENV || "sandbox").toLowerCase();

  // Prefer unified vars, fall back to env-specific
  const accessToken =
    process.env.SQUARE_ACCESS_TOKEN ||
    (env === "production"
      ? process.env.SQUARE_PROD_ACCESS_TOKEN
      : process.env.SQUARE_SANDBOX_ACCESS_TOKEN);

  const locationId =
    process.env.SQUARE_LOCATION_ID ||
    (env === "production"
      ? process.env.SQUARE_PROD_LOCATION_ID
      : process.env.SQUARE_SANDBOX_LOCATION_ID);

  const environment = env === "production" ? Environment.Production : Environment.Sandbox;

  return { env, accessToken, locationId, environment };
}

// Simple GET to confirm function is deployed + which code path this is
export const handler: Handler = async (event) => {
  if (event.httpMethod === "GET") {
    return { statusCode: 200, body: JSON.stringify({ ok: true, impl: "SDK_V1" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { env, accessToken, locationId, environment } = resolveSquareConfig();

    if (!accessToken || !locationId) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing required Square configuration.",
          details: {
            SQUARE_ENV: env,
            has_ACCESS_TOKEN: !!accessToken,
            has_LOCATION_ID: !!locationId,
          },
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const orderId: string | undefined = body.orderId;
    const idempotencyKey: string | undefined = body.idempotencyKey;
    const amount: number | undefined = typeof body.amount === "number" ? body.amount : undefined;
    const sourceId: string | undefined = body.sourceId;

    if (!orderId || !idempotencyKey || typeof amount !== "number") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing sourceId, orderId, idempotencyKey or amount." }),
      };
    }

    // Zero-dollar branch (e.g., fully comped by rewards)
    if (amount === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          payment: {
            id: `ZERO_DOLLAR_${orderId}`,
            status: "COMPLETED",
            amountMoney: { amount: 0, currency: "USD" },
            orderId,
          },
        }),
      };
    }

    // Non-zero -> must have a token from the Web Payments SDK
    if (!sourceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing sourceId for non-zero payment." }),
      };
    }

    // ---- Square SDK v3 client ----
    const client = new Client({ accessToken, environment });

    // Ensure paymentsApi exists (guards against version/import mismatch)
    if (!client.paymentsApi || typeof client.paymentsApi.createPayment !== "function") {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Square payments API not available on client (createPayment missing).",
          details: { hasPaymentsApi: !!client.paymentsApi },
        }),
      };
    }

    const req = {
      sourceId,
      idempotencyKey,
      locationId,
      orderId,
      amountMoney: { amount: toBigInt(amount), currency: "USD" as const },
      // Optional: autocomplete: true
    };

    const payResp = await client.paymentsApi.createPayment(req as any);

    return {
      statusCode: 200,
      body: JSON.stringify({ payment: payResp.result.payment }),
    };
  } catch (err: any) {
    const sq = err?.result?.errors || err?.errors;
    console.error("pay-square-order error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "Server error",
        squareErrors: sq,
      }),
    };
  }
};

export default handler;
