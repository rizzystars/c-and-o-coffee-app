// netlify/functions/coupon-validate.ts
import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Example: 2oz Espresso reward key → $2 discount
// You can extend this map as you add new reward types.
const REWARD_DISCOUNTS: Record<string, { amountCents: number; label: string }> = {
  ESPRESSO_2OZ: { amountCents: 200, label: "Free 2oz Espresso Shot" },
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { code } = JSON.parse(event.body || "{}") as { code?: string };
    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Missing code" }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Look for this code in pending_rewards
    const { data, error } = await supabase
      .from("pending_rewards")
      .select("id, reward_type, status, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { statusCode: 404, body: JSON.stringify({ ok: false, error: "Code not found" }) };
    }

    if (data.status !== "PENDING") {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Code already used" }) };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Code expired" }) };
    }

    const rewardMeta = REWARD_DISCOUNTS[data.reward_type];
    if (!rewardMeta) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Unsupported reward type" }) };
    }

    // ✅ Success: return discount info
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        code,
        rewardType: data.reward_type,
        discountCents: rewardMeta.amountCents,
        label: rewardMeta.label,
      }),
    };
  } catch (e: any) {
    console.error("coupon-validate error:", e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || "Server error" }) };
  }
};
