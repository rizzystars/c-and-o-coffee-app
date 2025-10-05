// netlify/functions/pay-square-order.js
// Charges a card using Square's Payments API (REST, no SDK).
// Defaults to PRODUCTION if SQUARE_ENV is unset. Requires SQUARE_ACCESS_TOKEN in Netlify env.
// Optional envs: SQUARE_ENV ("production" or "sandbox"), SQUARE_LOCATION_ID

const crypto = require("crypto");

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const {
      sourceId,           // required: token from card.tokenize()
      amount,             // required: integer cents
      currency = "USD",   // optional
      orderId,            // optional
      customerId,         // optional
      note,               // optional
    } = JSON.parse(event.body || "{}");

    if (!sourceId) {
      return json(400, { error: "Missing sourceId" });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return json(400, { error: "Invalid amount (cents required)" });
    }

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    if (!accessToken) {
      return json(500, { error: "Server missing SQUARE_ACCESS_TOKEN" });
    }

    const env = (process.env.SQUARE_ENV || "production").toLowerCase();
    const baseUrl =
      env === "sandbox"
        ? "https://connect.squareupsandbox.com"
        : "https://connect.squareup.com";

    const locationId =
      process.env.SQUARE_LOCATION_ID && process.env.SQUARE_LOCATION_ID.trim().length > 0
        ? process.env.SQUARE_LOCATION_ID.trim()
        : undefined; // If you want to force a specific location, set this in Netlify env.

    // Optional: simple server-side guardrails for live testing
    if (env === "production" && amount > 50000) {
      // $500.00 cap for safety; adjust/omit as you like
      return json(400, { error: "Amount exceeds temporary server cap" });
    }

    const idempotencyKey = crypto.randomUUID();

    const payload = {
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      amount_money: { amount, currency },
      ...(locationId ? { location_id: locationId } : {}),
      ...(orderId ? { order_id: orderId } : {}),
      ...(customerId ? { customer_id: customerId } : {}),
      ...(note ? { note } : {}),
    };

    const resp = await fetch(`${baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-09-18",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Square /v2/payments error:", data);
      return json(resp.status, { error: data.errors || data });
    }

    return json(200, data);
  } catch (err) {
    console.error("pay-square-order fatal:", err);
    return json(500, { error: err.message || "Unknown server error" });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
