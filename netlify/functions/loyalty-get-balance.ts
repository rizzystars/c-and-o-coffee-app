// netlify/functions/loyalty-get-balance.ts
import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
    const { phone, email } = JSON.parse(event.body || "{}");
    if (!phone && !email) return { statusCode: 400, body: "phone or email required" };

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: cust, error: cErr } = await supabase
      .from("customers").select("id")
      .or(`phone.eq.${phone || ""},email.eq.${email || ""}`).maybeSingle();
    if (cErr) throw cErr;

    if (!cust) return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ points: 0 }) };

    const { data: bal, error: bErr } = await supabase
      .from("v_customer_points").select("points")
      .eq("customer_id", cust.id).single();
    if (bErr) throw bErr;

    return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ points: bal?.points ?? 0 }) };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "error" };
  }
};
