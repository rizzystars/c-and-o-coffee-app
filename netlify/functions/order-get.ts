// netlify/functions/order-get.ts
export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
    const { orderId } = JSON.parse(event.body || "{}");
    if (!orderId) return { statusCode: 400, body: "orderId required" };

    const base = process.env.SQUARE_ENV === "production"
      ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
    const headers = {
      "Square-Version": "2023-10-18",
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${base}/v2/orders/${orderId}`, { headers });
    const data = await res.json();
    if (!res.ok || data.errors) return { statusCode: 500, body: JSON.stringify(data.errors || data) };

    const o = data.order;
    return {
      statusCode: 200, headers: {"content-type":"application/json"},
      body: JSON.stringify({
        id: o.id,
        subtotalCents: o?.net_amounts?.subtotal_money?.amount ?? 0,
        totalCents: o?.total_money?.amount ?? 0,
        discounts: o?.discounts ?? [],
        lineItems: o?.line_items ?? [],
      }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "error" };
  }
};
