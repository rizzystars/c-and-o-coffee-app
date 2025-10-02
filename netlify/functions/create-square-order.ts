// netlify/functions/create-square-order.ts
import type { Handler } from "@netlify/functions";
import { Client, Environment } from "square"; // ⬅️ explicit named imports
import { randomUUID } from "crypto";

/** Helpers */
const toCents = (n: unknown) => {
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(x) : 0;
};
const toBigInt = (cents: number) => BigInt(Math.max(0, cents));

/** Resolve env + pick Environment */
function resolveSquareConfig() {
  const env = (process.env.SQUARE_ENV || "sandbox").toLowerCase();

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

  const environment =
    env === "production" ? Environment.Production : Environment.Sandbox;

  return { env, accessToken, locationId, environment };
}

export const handler: Handler = async (event) => {
  // Tiny GET probe to help you verify deploys
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

    const client = new Client({ accessToken, environment });

    const body = JSON.parse(event.body || "{}");
    const items: any[] = body.items || [];
    const tip: number = Number(body.tip || 0);
    const idempotencyKey: string = body.idempotencyKey || randomUUID();
    const couponCode: string | undefined = body.couponCode;

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items in order." }) };
    }

    const lineItems = items.map((item) => ({
      name: item.menuItem?.name || "Item",
      quantity: String(item.quantity || 1),
      basePriceMoney: {
        amount: toBigInt(toCents(item.menuItem?.price || 0)),
        currency: "USD",
      },
      modifiers: (item.selectedModifiers || []).map((mod: any) => ({
        name: mod.name,
        basePriceMoney: {
          amount: toBigInt(toCents(mod.price || 0)),
          currency: "USD",
        },
      })),
    }));

    const order: any = {
      locationId,
      lineItems,
      // Optional note so you can see orders originate from this app
      source: { name: "C&O Coffee Checkout" },
    };

    if (tip > 0) {
      order.serviceCharges = [
        {
          name: "Tip",
          amountMoney: { amount: toBigInt(toCents(tip)), currency: "USD" },
        },
      ];
    }

    // Add a client-supplied ref if present (e.g., loyalty code)
    const createReq: any = {
      idempotencyKey,
      order,
    };
    if (couponCode) {
      createReq.order.referenceId = couponCode;
    }

    const result = await client.ordersApi.createOrder(createReq);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        env,
        order: result.result.order,
      }),
    };
  } catch (err: any) {
    const squareErrors = err?.result?.errors || err?.errors;
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "Server error",
        squareErrors,
      }),
    };
  }
};

export default handler;
