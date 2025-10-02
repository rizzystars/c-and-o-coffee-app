import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { code, email } = JSON.parse(event.body || "{}");
    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ valid: false, error: "Missing code" }) };
    }

    // Look up coupon in Supabase
    const { data, error } = await supabase
      .from("pending_rewards")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error || !data) {
      return { statusCode: 200, body: JSON.stringify({ valid: false, error: "Not found" }) };
    }

    // Check expiration or status
    if (data.status !== "PENDING") {
      return { statusCode: 200, body: JSON.stringify({ valid: false, error: "Already used" }) };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { statusCode: 200, body: JSON.stringify({ valid: false, error: "Expired" }) };
    }

    // Map reward type → discount amount
    let discountCents = 0;
    let label = "Reward";

    if (data.reward_type === "ESPRESSO_2OZ") {
      discountCents = 200;
      label = "Free 2oz Espresso";
    } else if (data.reward_type === "AMERICANO") {
      discountCents = 150;
      label = "Free Americano";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        code,
        label,
        discount: { amountCents: discountCents }
      }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ valid: false, error: err.message }) };
  }
};
