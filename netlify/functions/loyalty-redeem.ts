// netlify/functions/loyalty-redeem.ts
import { createClient } from "@supabase/supabase-js";
import type { Handler } from "@netlify/functions";

// Define the shape of Square API objects for better type safety
type SquareMoney = { amount: number; currency: string };
type SquareOrder = {
  id: string;
  version: number;
  location_id: string;
  net_amounts?: { subtotal_money?: SquareMoney };
  total_money?: SquareMoney;
};

const VALUE_PER_POINT_CENTS = 5; // 1 point = 5 cents, so 100 points = $5.00
const MAX_PERCENT_OFF = 100;     // Allows redeeming points up to 100% of the subtotal

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed. Please use POST." };
    }
    
    const { phone, email, orderId, pointsToSpend } = JSON.parse(event.body || "{}");
    if (!orderId || !pointsToSpend || (!phone && !email)) {
      return { statusCode: 400, body: "orderId, pointsToSpend, and a customer identifier (phone or email) are required." };
    }

    // --- Set up API clients ---
    const squareApiBase = process.env.SQUARE_ENV === "production"
      ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
    
    const squareHeaders: Record<string,string> = {
      "Square-Version": "2024-05-15", // Using a recent API version
      "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // --- Get customer and point balance from Supabase ---
    const { data: customer, error: custErr } = await supabase
      .from("customers").upsert({ phone, email }, { onConflict: "phone,email" })
      .select("id").single();
    if (custErr) throw custErr;

    const { data: balance, error: balErr } = await supabase
      .from("v_customer_points").select("points")
      .eq("customer_id", customer.id).single();
    if (balErr) throw balErr;
    
    const availablePoints = balance?.points ?? 0;
    if (pointsToSpend > availablePoints) {
        return { statusCode: 400, body: `Insufficient points. You have ${availablePoints}, but tried to spend ${pointsToSpend}.` };
    }

    // --- Fetch the Square order to get its current state and subtotal ---
    const orderRes = await fetch(`${squareApiBase}/v2/orders/${orderId}`, { headers: squareHeaders });
    const orderJson = (await orderRes.json()) as { order: SquareOrder; errors?: any[] };
    if (!orderRes.ok || orderJson.errors) {
        return { statusCode: orderRes.status, body: JSON.stringify(orderJson.errors || { error: "Failed to fetch Square order." }) };
    }

    const order = orderJson.order;
    const subtotalCents = order?.net_amounts?.subtotal_money?.amount ?? order?.total_money?.amount ?? 0;

    // --- Calculate the actual discount amount in cents ---
    const requestedDiscount = pointsToSpend * VALUE_PER_POINT_CENTS;
    const maxDiscountByPercentage = Math.floor((subtotalCents * MAX_PERCENT_OFF) / 100);
    const actualDiscountCents = Math.min(requestedDiscount, maxDiscountByPercentage, subtotalCents);

    if (actualDiscountCents <= 0) {
      return { statusCode: 200, body: JSON.stringify({ applied: 0, pointsSpent: 0, message: "No discount applied." }) };
    }
    
    // --- Apply the discount to the Square order ---
    const updateRes = await fetch(`${squareApiBase}/v2/orders/${orderId}`, {
      method: "PUT", 
      headers: squareHeaders,
      body: JSON.stringify({
        order: {
          location_id: order.location_id, // Use location_id from the fetched order
          discounts: [{
            name: "Loyalty Points Redemption",
            scope: "ORDER",
            type: "FIXED_AMOUNT",
            amount_money: { amount: actualDiscountCents, currency: "USD" },
          }],
          version: order.version, // The order version is required for updates
        },
        idempotency_key: randomUUID(),
      }),
    });

    const updateJson = await updateRes.json();
    if (!updateRes.ok || updateJson.errors) {
        return { statusCode: updateRes.status, body: JSON.stringify(updateJson.errors || { error: "Failed to apply discount to Square order."}) };
    }

    // --- Deduct points from the customer's balance in Supabase ---
    const pointsActuallySpent = Math.ceil(actualDiscountCents / VALUE_PER_POINT_CENTS);
    const { error: ledgerErr } = await supabase.from("points_ledger").insert({
      customer_id: customer.id, 
      delta: -pointsActuallySpent,
      reason: "Redeemed points for order discount", 
      square_order_id: orderId,
    });
    if (ledgerErr) {
        // Log the error, but don't fail the request since the discount was already applied.
        console.error("CRITICAL: Failed to deduct points after applying discount.", ledgerErr);
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
          applied: actualDiscountCents, 
          pointsSpent: pointsActuallySpent, 
          currency: "USD",
          order: updateJson.order // Return the updated order from Square
      }) 
    };

  } catch (e: any) {
    console.error("An unexpected error occurred in loyalty-redeem:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "An internal server error occurred." }) };
  }
};

