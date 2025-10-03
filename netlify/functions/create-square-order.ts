import type { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";

const toCents = (n: unknown) => Math.round(Number(n) || 0);
const SQUARE_API_VERSION = "2024-05-15";

// --- Config Resolution ---
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
    return { statusCode: 200, body: JSON.stringify({ ok: true, impl: "ORDER+PAYMENT" }) };
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

    // NOTE: We receive amountCents from frontend, but we will use the definitive order total
    const { sourceId, items = [], discount, notes, pickupTime, amountCents } = body;

    if (!sourceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing sourceId (card token)." }) };
    }

    // --- Build the Order (No Changes) ---
    const order: any = {
      location_id: locationId,
      line_items: items.map((item: any) => ({
        name: item.menuItem?.name || "Item",
        quantity: String(item.quantity || 1),
        base_price_money: {
          amount: toCents(item.menuItem?.price || 0),
          currency: "USD",
        },
      })),
      source: { name: "C&O Coffee Checkout" },
      note: `${notes || ""}${pickupTime ? ` | Pickup: ${pickupTime}` : ""}`,
    };

    // Add discount if provided (No Changes)
    if (discount) {
      order.discounts = [
        {
          name: discount.label || discount.code || "Discount",
          amount_money: {
            amount: toCents(discount.amountCents || 0),
            currency: "USD",
          },
          scope: "ORDER",
        },
      ];
    }

    // --- Create Order ---
    const orderResp = await fetch(`https://connect.squareup.com/v2/orders`, {
      method: "POST",
      headers: {
        "Square-Version": SQUARE_API_VERSION,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        order,
      }),
    });

    const orderData = await orderResp.json();
    if (!orderResp.ok) {
      console.error("Square Order Creation Failed:", orderData);
      return { statusCode: orderResp.status, body: JSON.stringify(orderData) };
    }
    
    // --- FIX 1: Safely retrieve the calculated order total ---
    const orderId = orderData.order?.id;
    const finalAmountMoney = orderData.order?.total_money; // The total calculated by Square, including tax/discounts
    
    if (!orderId || !finalAmountMoney?.amount) {
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to create Square order or total amount missing." }) };
    }

    // --- FIX 2: Log the final charge amount for debugging ---
    console.log("Square Calculated Order Total (Cents):", finalAmountMoney.amount);
    
    // --- Create Payment ---
    const paymentResp = await fetch(`https://connect.squareup.com/v2/payments`, {
      method: "POST",
      headers: {
        "Square-Version": SQUARE_API_VERSION,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        source_id: sourceId,
        amount_money: {
          amount: finalAmountMoney.amount, // <-- NOW USE THE AMOUNT CALCULATED BY SQUARE
          currency: "USD",
        },
        order_id: orderId,
        location_id: locationId,
      }),
    });

    const paymentData = await paymentResp.json();
    if (!paymentResp.ok) {
      console.error("Square Payment Failed:", paymentData);
      return { statusCode: paymentResp.status, body: JSON.stringify(paymentData) };
    }

    // --- FIX 3: Ensure the returned data is correctly formatted ---
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        env,
        order: orderData.order,
        payment: paymentData.payment,
      }),
    };
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Server error" }),
    };
  }
};
