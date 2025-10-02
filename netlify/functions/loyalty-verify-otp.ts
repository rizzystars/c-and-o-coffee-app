// netlify/functions/loyalty-verify-otp.ts
import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
    const { phone, code } = JSON.parse(event.body || "{}");
    if (!phone || !code) return { statusCode: 400, body: "phone and code required" };

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: rows, error } = await supabase
      .from("otp_codes")
      .select("*").eq("phone", phone)
      .order("created_at", { ascending: false }).limit(1);
    if (error) throw error;

    const row = rows?.[0];
    if (!row) return { statusCode: 400, body: "no code issued" };

    if (new Date(row.expires_at) < new Date()) return { statusCode: 400, body: "code expired" };

    if (row.code !== code) {
      await supabase.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return { statusCode: 400, body: "invalid code" };
    }

    return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok: true }) };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "error" };
  }
};
