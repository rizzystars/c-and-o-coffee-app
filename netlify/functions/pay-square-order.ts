import type { Handler } from "@netlify/functions";

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
    const { orderId, idempotencyKey, amount, sourceId } = body;
    
    // Handle zero-dollar orders immediately
    if (amount === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          payment: {
            id: `ZERO_DOLLAR_${orderId}`,
            status: "COMPLETED",
            amount_money: { amount: 0, currency: "USD" },
            order_id: orderId,
          },
        }),
      };
    }

    if (!orderId || !idempotencyKey || typeof amount !== 'number' || !sourceId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing required payment fields." })};
    }

    // --- Build the Payment Payload for Square API ---
    const paymentPayload = {
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      amount_money: {
        amount: Math.max(0, Math.trunc(amount || 0)),
        currency: "USD",
      },
      order_id: orderId,
      location_id: locationId,
    };

    // --- Direct API Call using fetch ---
    const response = await fetch(`https://connect.squareup.com/v2/payments`, {
        method: "POST",
        headers: {
          "Square-Version": "2024-05-15",
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // Forward the error from Square
        return { statusCode: response.status, body: JSON.stringify(data) };
      }

    return {
      statusCode: 200,
      body: JSON.stringify({ payment: data.payment }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Server error" }),
    };
  }
};

