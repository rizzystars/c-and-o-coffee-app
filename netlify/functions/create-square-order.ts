import type { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";

// --- Helpers ---
const toCents = (n: unknown) => Math.round(Number(n) || 0);
const SQUARE_API_VERSION = "2024-05-15"; // Use a recent API version

// --- Config Resolution (No change) ---
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
  return { env, accessToken, locationId };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "GET") {
    return { statusCode: 200, body: JSON.stringify({ ok: true, impl: "FETCH_V1" }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { env, accessToken, locationId } = resolveSquareConfig();
    if (!accessToken || !locationId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing required Square configuration." }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const idempotencyKey = body.idempotencyKey || randomUUID();

    // --- Build the Order Payload for Square API ---
    const orderPayload = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: locationId,
        line_items: (body.items || []).map((item: any) => ({
          name: item.menuItem?.name || "Item",
          quantity: String(item.quantity || 1),
          base_price_money: {
            amount: toCents(item.menuItem?.price || 0),
            currency: "USD",
          },
        })),
        source: { name: "C&O Coffee Checkout" },
      },
    };

    // --- Direct API Call using fetch ---
    const response = await fetch(`https://connect.squareup.com/v2/orders`, {
      method: "POST",
      headers: {
        "Square-Version": SQUARE_API_VERSION,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Forward the error from Square
      return { statusCode: response.status, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        env,
        order: data.order,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Server error" }),
    };
  }
};

