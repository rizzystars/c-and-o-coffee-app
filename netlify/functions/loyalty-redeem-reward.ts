// netlify/functions/loyalty-redeem-reward.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Redeem loyalty points safely against *ledger* tables.
 * - Primary path (preferred): userId -> read from loyalty_balances (VIEW), write to loyalty_ledger (TABLE).
 * - Legacy fallback: phone/email -> read from v_customer_points (VIEW), write to points_ledger (TABLE).
 * - Never attempts to UPDATE a materialized view.
 */
export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:false, error:"Use POST" }) };
    }
    const { userId, phone, email, pointsCost, rewardName } = JSON.parse(event.body || "{}");
    if ((!userId && (!phone && !email)) || !pointsCost || !rewardName) {
      return { statusCode: 400, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:false, error:"userId (or phone/email), pointsCost, and rewardName are required" }) };
    }
    const cost = Math.abs(Number(pointsCost || 0));
    if (!cost) {
      return { statusCode: 400, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:false, error:"Invalid pointsCost" }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // -------- Primary path: userId + app schema (balances view + ledger table) --------
    if (userId) {
      // READ balance from VIEW
      const { data: balRow, error: balErr } = await supabase
        .from("loyalty_balances").select("points").eq("user_id", userId).maybeSingle();
      if (balErr) throw balErr;

      const current = balRow?.points ?? 0;
      if (current < cost) {
        return { statusCode: 400, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:false, error:`Not enough points (need ${cost}, you have ${current})` }) };
      }

      // WRITE to ledger TABLE (negative delta)
      const { error: ledgerErr } = await supabase.from("loyalty_ledger").insert({
        user_id: userId,
        delta: -cost,
        reason: `Redeem: ${rewardName}`,
      });
      if (ledgerErr) throw ledgerErr;

      // RE-READ computed balance from VIEW
      const { data: after, error: afterErr } = await supabase
        .from("loyalty_balances").select("points").eq("user_id", userId).single();
      if (afterErr) throw afterErr;

      return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:true, rewardName, newBalance: after.points ?? (current - cost) }) };
    }

    // -------- Legacy fallback: phone/email schema (customers + v_customer_points + points_ledger) --------
    const { data: cust, error: cErr } = await supabase
      .from("customers").select("id").or(`phone.eq.${phone || ""},email.eq.${email || ""}`).maybeSingle();
    if (cErr) throw cErr;
    if (!cust) {
      return { statusCode: 404, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:false, error:"Customer not found" }) };
    }

    // READ balance (VIEW)
    const { data: bal, error: bErr } = await supabase
      .from("v_customer_points").select("points").eq("customer_id", cust.id).single();
    if (bErr) throw bErr;
    const legacyCurrent = bal?.points ?? 0;
    if (legacyCurrent < cost) {
      return { statusCode: 400, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:false, error:`Not enough points (need ${cost}, you have ${legacyCurrent})` }) };
    }

    // WRITE to ledger TABLE
    const { error: legacyLedgerErr } = await supabase.from("points_ledger").insert({
      customer_id: cust.id,
      delta: -cost,
      reason: `Redeem: ${rewardName}`,
    });
    if (legacyLedgerErr) throw legacyLedgerErr;

    // RE-READ balance (VIEW)
    const { data: bal2, error: bErr2 } = await supabase
      .from("v_customer_points").select("points").eq("customer_id", cust.id).single();
    if (bErr2) throw bErr2;

    return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:true, rewardName, newBalance: bal2?.points ?? (legacyCurrent - cost) }) };
  } catch (e: any) {
    return { statusCode: 500, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:false, error: e?.message || "Server error" }) };
  }
};

// touch for redeploy
