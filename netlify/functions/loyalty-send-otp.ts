// netlify/functions/loyalty-send-otp.ts
import { createClient } from "@supabase/supabase-js";

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
  if (!sid || !tok || !from) return { sent: false };
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const creds = Buffer.from(`${sid}:${tok}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  return { sent: res.ok };
}

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
    const { phone } = JSON.parse(event.body || "{}");
    if (!phone) return { statusCode: 400, body: "phone required" };

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await supabase.from("otp_codes").insert({ phone, code, expires_at: expires });
    if (error) throw error;

    const msg = `Your C&O Coffee code is ${code}. Expires in 5 minutes.`;
    const result = await sendSms(phone, msg);

    const body = { ok: true, sent: !!result.sent, demoCode: result.sent ? undefined : code };
    return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify(body) };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "error" };
  }
};
