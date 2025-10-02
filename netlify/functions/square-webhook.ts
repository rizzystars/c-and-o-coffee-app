// netlify/functions/square-webhook.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Client, Environment } from "square";
import crypto from "crypto";

// --- helpers ---------------------------------------------------------------

/** Build the exact URL that Square used to compute the signature. */
function buildWebhookUrl(event: any): string {
  const fixedPath = "/.netlify/functions/square-webhook";
  const fromEnv = process.env.SITE_URL;
  if (fromEnv && fromEnv.startsWith("http")) return `${fromEnv}${fixedPath}`;

  const scheme =
    (event.headers?.["x-forwarded-proto"] as string) ||
    (event.headers?.["X-Forwarded-Proto"] as string) ||
    "https";
  const host =
    (event.headers?.["host"] as string) ||
    (event.headers?.["Host"] as string) ||
    "";
  return `${scheme}://${host}${fixedPath}`;
}

/** Verify Square Webhook HMAC (url + rawBody, base64) */
function verifySquareSig(event: any, bodyRaw: string): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";
  const sigHeader =
    (event.headers?.["x-square-hmacsha256-signature"] as string) ||
    (event.headers?.["X-Square-Hmacsha256-Signature"] as string) ||
    "";
  if (!key || !sigHeader) return false;

  const url = buildWebhookUrl(event);
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(url + bodyRaw);
  const expected = hmac.digest("base64");
  return expected === sigHeader;
}

const earnPoints = (cents: number) => Math.floor(cents / 100); // 1 pt per $1

// --- handler ---------------------------------------------------------------

export const handler = async (event: any) => {
  try {
    const raw = event.body || "";

    // 1) HMAC verification
    if (!verifySquareSig(event, raw)) {
      return { statusCode: 401, body: "bad signature" };
    }

    // 2) Parse only payment.updated → COMPLETED
    const payload = JSON.parse(raw);
    if (payload?.type !== "payment.updated") {
      return { statusCode: 200, body: "ignored" };
    }
    const payment = payload?.data?.object?.payment;
    if (!payment || payment.status !== "COMPLETED") {
      return { statusCode: 200, body: "ignored" };
    }
    const orderId: string | undefined = payment.order_id;
    if (!orderId) return { statusCode: 200, body: "no order_id on payment" };

    // 3) Square SDK client (uses a single ACCESS_TOKEN name you’ve set)
    const env =
      (process.env.SQUARE_ENV ?? "sandbox") === "production"
        ? Environment.Production
        : Environment.Sandbox;

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    if (!accessToken) {
      return { statusCode: 500, body: "Missing SQUARE_ACCESS_TOKEN" };
    }

    const sq = new Client({ accessToken, environment: env });

    // 4) Fetch full order via SDK
    const { result } = await sq.ordersApi.retrieveOrder(orderId);
    const order = result.order;
    const subtotalCents = order?.netAmounts?.subtotalMoney?.amount ?? 0;

    // 5) Supabase (service role) for awarding points + marking rewards used
    const supabase = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 6) Map Square customer → your customers.id (create if missing)
    const squareCustomerId: string | null = payment.customer_id || null;
    let customerId: string | null = null;

    if (squareCustomerId) {
      const { data: found, error: findErr } = await supabase
        .from("customers")
        .select("id")
        .eq("square_customer_id", squareCustomerId)
        .maybeSingle();

      if (findErr) console.error("customers lookup error:", findErr);

      if (found?.id) {
        customerId = found.id;
      } else {
        const { data: created, error: insertErr } = await supabase
          .from("customers")
          .insert({ square_customer_id: squareCustomerId })
          .select("id")
          .single();
        if (insertErr) console.error("customers insert error:", insertErr);
        customerId = created?.id ?? null;
      }
    }

    // 7) Award points based on subtotal (if we have a customer)
    const pts = earnPoints(subtotalCents);
    if (pts > 0 && customerId) {
      const { error: ptsErr } = await supabase.from("points_ledger").insert({
        customer_id: customerId,
        delta: pts,
        reason: "Earn: payment webhook",
        square_order_id: orderId,
        square_payment_id: payment.id,
      });
      if (ptsErr) console.error("points_ledger insert error:", ptsErr);
    }

    // 8) Try to auto-mark a pending reward code as USED
    //    Candidates from: order.metadata.loyalty_code, order.referenceId, discounts[].name
    const candidateCodes = new Set<string>();

    const meta = order?.metadata || {};
    if (meta && typeof meta === "object") {
      const possible = (meta as Record<string, string>)["loyalty_code"];
      if (possible && typeof possible === "string") candidateCodes.add(possible.trim());
    }

    if (order?.referenceId && typeof order.referenceId === "string") {
      candidateCodes.add(order.referenceId.trim());
    }

    const discountsArr: any[] = Array.isArray(order?.discounts) ? order!.discounts! : [];
    for (const d of discountsArr) {
      if (d?.name && typeof d.name === "string") {
        candidateCodes.add(String(d.name).trim());
      }
    }

    if (candidateCodes.size > 0) {
      let marked = false;
      for (const code of candidateCodes) {
        const { data: row, error: selErr } = await supabase
          .from("pending_rewards")
          .select("id, status, code, expires_at")
          .eq("code", code)
          .eq("status", "PENDING")
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();

        if (selErr) {
          console.error("pending_rewards select error:", selErr);
          continue;
        }
        if (!row?.id) continue;

        const { error: updErr } = await supabase
          .from("pending_rewards")
          .update({
            status: "USED",
            used_at: new Date().toISOString(),
            square_payment_id: payment.id,
            square_order_id: orderId,
          })
          .eq("id", row.id);

        if (updErr) {
          console.error("pending_rewards update error:", updErr);
          continue;
        }
        marked = true;
        break;
      }

      if (!marked) {
        console.log(
          "No matching PENDING pending_rewards row found for codes:",
          Array.from(candidateCodes)
        );
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (e: any) {
    console.error("square-webhook error:", e);
    return { statusCode: 500, body: e?.message || "error" };
  }
};

export default handler;
