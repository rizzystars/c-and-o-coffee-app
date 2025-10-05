// netlify/functions/reward-mark-used.js
// Marks a reward code as USED for a user. Supports dry-run via header "X-Dry-Run: 1".
// Requires server env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional: CORS_ORIGIN (defaults to "*")

const { createClient } = require("@supabase/supabase-js");

const ORIGIN = process.env.CORS_ORIGIN || "*";

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Dry-Run",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    // CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": ORIGIN,
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,X-Dry-Run",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method Not Allowed" });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let parsed;
    try {
      parsed = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const rawCode = (parsed.code || "").toString();
    const userId = (parsed.userId || "").toString();
    const note = parsed.note ? String(parsed.note) : null;

    // Make code matching forgiving (trim), DB match will be case-insensitive (ilike)
    const code = rawCode.trim();

    if (!code || !userId) {
      return json(400, { error: "code and userId are required" });
    }

    const dryRun =
      event.headers["x-dry-run"] === "1" || event.headers["X-Dry-Run"] === "1";

    if (dryRun) {
      return json(200, {
        ok: true,
        dryRun: true,
        wouldUpdate: {
          table: "pending_rewards",
          where: { customer_id: userId, codeIlike: code, status: "PENDING" },
          set: { status: "USED", used_at: "(now)", note: note },
        },
        message: "Dry run only. No DB changes performed.",
      });
    }

    // 1) Find the specific pending reward row (case-insensitive code match)
    const { data: rows, error: findErr } = await supabase
      .from("pending_rewards")
      .select("id, code, status")
      .eq("customer_id", userId)
      .ilike("code", code) // case-insensitive match
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(1);

    if (findErr) return json(400, { error: findErr.message });

    if (!rows || rows.length === 0) {
      return json(404, { error: "No matching pending reward found" });
    }

    const targetId = rows[0].id;

    // 2) Update by id (ensures only that single row changes)
    const { data: updated, error: updErr } = await supabase
      .from("pending_rewards")
      .update({
        status: "USED",
        used_at: new Date().toISOString(),
        note: note,
      })
      .eq("id", targetId)
      .select("id, code, status, used_at")
      .single();

    if (updErr) return json(400, { error: updErr.message });

    return json(200, { ok: true, updated });
  } catch (e) {
    console.error("reward-mark-used error:", e);
    return json(500, { error: e?.message || "Unknown server error" });
  }
};
