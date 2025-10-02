// netlify/functions/loyalty-redeem.ts
import { createClient } from "@supabase/supabase-js";

type SquareMoney = { amount: number; currency: string };
type SquareOrder = {
  id: string;
  location_id: string;
  net_amounts?: { subtotal_money?: SquareMoney };
  total_money?: SquareMoney;
};

const VALUE_PER_POINT_CENTS = 5; // 100 pts = $5
const MAX_PERCENT_OFF = 100;     // cap redemption by % of subtotal

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
    const { phone, email, orderId, pointsToSpend } = JSON.parse(event.body || "{}");
    if (!orderId || !pointsToSpend || (!phone && !email)) {
      return { statusCode: 400, body: "orderId, pointsToSpend, and phone or email are required" };
    }

    const base = process.env.SQUARE_ENV === "production"
      ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
    const headers: Record<string,string> = {
      "Square-Version": "2023-10-18",
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: customer, error: custErr } = await supabase
      .from("customers").upsert({ phone, email }, { onConflict: "phone,email" })
      .select("id").single();
    if (custErr) throw custErr;

    const { data: bal, error: balErr } = await supabase
      .from("v_customer_points").select("points")
      .eq("customer_id", customer.id).single();
    if (balErr) throw balErr;
    const available = bal?.points ?? 0;
    if (pointsToSpend > available) return { statusCode: 400, body: `Insufficient points. Available: ${available}` };

    const orderRes = await fetch(`${base}/v2/orders/${orderId}`, { headers });
    const orderJson = (await orderRes.json()) as { order: SquareOrder; errors?: any };
    if (!orderRes.ok || orderJson.errors) return { statusCode: 500, body: JSON.stringify(orderJson.errors || orderJson) };

    const order = orderJson.order;
    const subtotalCents = order?.net_amounts?.subtotal_money?.amount ?? order?.total_money?.amount ?? 0;

    const maxByPercent = Math.floor((subtotalCents * MAX_PERCENT_OFF) / 100);
    const requestedDiscount = pointsToSpend * VALUE_PER_POINT_CENTS;
    const discountCents = Math.min(requestedDiscount, maxByPercent, subtotalCents);
    if (discountCents <= 0) {
      return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ applied: 0, pointsSpent: 0 }) };
    }

    const updateRes = await fetch(`${base}/v2/orders/batch-update`, {
      method: "POST", headers,
      body: JSON.stringify({
        orders: [{
          id: orderId,
          location_id: process.env.SQUARE_LOCATION_ID,
          discounts: [{
            name: "Loyalty Redemption",
            scope: "ORDER",
            type: "FIXED_AMOUNT",
            amount_money: { amount: discountCents, currency: "USD" },
          }],
        }],
      }),
    });
    const updateJson = await updateRes.json();
    if (!updateRes.ok || updateJson.errors) return { statusCode: 500, body: JSON.stringify(updateJson.errors || updateJson) };

    const pointsSpent = Math.floor(discountCents / VALUE_PER_POINT_CENTS);
    const { error: ledgerErr } = await supabase.from("points_ledger").insert({
      customer_id: customer.id, delta: -pointsSpent,
      reason: "Redeem: applied discount to order", square_order_id: orderId,
    });
    if (ledgerErr) throw ledgerErr;

    return { statusCode: 200, headers: {"content-type":"application/json"},
      body: JSON.stringify({ applied: discountCents, pointsSpent, currency: "USD" }) };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "error" };
  }
};
