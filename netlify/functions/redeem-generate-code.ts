// netlify/functions/redeem-generate-code.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// --- ENV ---
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Reward key -> points, env var with Square Discount Catalog ID, and ledger reason
const REWARD_MAP: Record<string, { points: number; envVar: string; reason: string }> = {
  // 50
  ESPRESSO_2OZ:     { points: 50,  envVar: 'LOYALTY_DISC_ID_ESPRESSO_2OZ',       reason: 'Redeem: 2oz Espresso' },
  // 100
  BREWED_COFFEE:    { points: 100, envVar: 'LOYALTY_DISC_ID_BREW',                reason: 'Redeem: Brewed Coffee' },
  // 150
  BAKERY:           { points: 150, envVar: 'LOYALTY_DISC_ID_BAKERY',              reason: 'Redeem: Bakery Item' },
  // 200
  LATTE:            { points: 200, envVar: 'LOYALTY_CATALOG_DISCOUNT_ID_LATTE',   reason: 'Redeem: Latte/Specialty' },
  // 250
  SAMPLER_2_5OZ:    { points: 250, envVar: 'LOYALTY_DISC_ID_SAMPLER_2_5OZ',       reason: 'Redeem: 2.5oz Sampler' },
  // 300
  COFFEE_BAGEL:     { points: 300, envVar: 'LOYALTY_DISC_ID_COFFEE_BAKERY',       reason: 'Redeem: Coffee + Bagel' },
  // 350
  DOUBLE_SHOT:      { points: 350, envVar: 'LOYALTY_DISC_ID_DOUBLESHOT',          reason: 'Redeem: Double Shot Bonus' },
  // 400
  DRINK_PASTRY:     { points: 400, envVar: 'LOYALTY_DISC_ID_DRINK_PASTRY',        reason: 'Redeem: Drink + Pastry Combo' },
  // 450  (10oz beans)
  BEANS_10OZ:       { points: 450, envVar: 'LOYALTY_DISC_ID_BEANS_10OZ',          reason: 'Redeem: 10oz Beans' },
  // 500
  BUNDLE_BIGFOOT:   { points: 500, envVar: 'LOYALTY_DISC_ID_BUNDLE_BIGFOOT',      reason: 'Redeem: Bigfoot Bundle' },
  // 550
  STICKER_PACK:     { points: 550, envVar: 'LOYALTY_DISC_ID_STICKER_PACK',        reason: 'Redeem: Sticker Pack' },
  // 600
  MUG:              { points: 600, envVar: 'LOYALTY_DISC_ID_MUG',                 reason: 'Redeem: C&O Mug' },
  // 650
  UPGRADE_WEEK:     { points: 650, envVar: 'LOYALTY_DISC_ID_UPGRADE_WEEK',        reason: 'Redeem: Upgrade Week' },
  // 700
  MERCH_15_OFF:     { points: 700, envVar: 'LOYALTY_DISC_ID_MERCH_15_OFF',        reason: 'Redeem: $10 Off Merch' },
  // 750  (10oz beans + brewed)
  BEANS_PLUS_BREW:  { points: 750, envVar: 'LOYALTY_DISC_ID_BEANS_PLUS_BREW',     reason: 'Redeem: 10oz Beans & Brew' },
  // 800  (2x latte)
  ULTIMATE_LATTE:   { points: 800, envVar: 'LOYALTY_DISC_ID_LATTE_2X',            reason: 'Redeem: Free Latte (Ultimate)' },
};

const genCode = (len = 10) => randomBytes(len).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, len);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { customerId, userId, rewardKey } = JSON.parse(event.body || '{}') as {
      customerId?: string; // UUID from your customers/profiles (same as auth.uid)
      userId?: string;     // some callers send userId instead; we accept either
      rewardKey?: string;  // one of the keys in REWARD_MAP
    };

    const customer = customerId || userId;
    if (!customer || !rewardKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing customerId/userId or rewardKey' }) };
    }

    const meta = REWARD_MAP[rewardKey];
    if (!meta) return { statusCode: 400, body: JSON.stringify({ error: `Unknown rewardKey: ${rewardKey}` }) };

    const discountCatalogId = process.env[meta.envVar] || null;
    if (!discountCatalogId) {
      return { statusCode: 500, body: JSON.stringify({ error: `Missing env var: ${meta.envVar}` }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Idempotency guard: reuse a very recent pending reward of the same type
    const { data: recent } = await supabase
      .from('pending_rewards')
      .select('id, code, status, created_at')
      .eq('customer_id', customer)
      .eq('reward_type', rewardKey)
      .eq('status', 'PENDING')
      .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recent?.code) {
      return { statusCode: 200, body: JSON.stringify({
        code: recent.code,
        rewardKey,
        discountCatalogId,
        message: 'Reused pending reward',
      })};
    }

    // Compute balance
    const { data: rows, error: balErr } = await supabase
      .from('loyalty_ledger')
      .select('points')
      .eq('user_id', customer);

    if (balErr) throw balErr;
    const balance = (rows || []).reduce((a, r: any) => a + (r.points ?? 0), 0);
    if (balance < meta.points) {
      return { statusCode: 400, body: JSON.stringify({ error: `Not enough points. Need ${meta.points}, have ${balance}` }) };
    }

    // Create code + expiry (14 days)
    const code = genCode(10);
    const expires_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Insert pending reward first
    const { data: pr, error: prErr } = await supabase
      .from('pending_rewards')
      .insert([{
        customer_id: customer,
        reward_type: rewardKey,     // <-- matches your schema
        points_cost: meta.points,   // <-- you’ve been storing this
        status: 'PENDING',
        code,
        expires_at,
      }])
      .select('id')
      .single();

    if (prErr) throw prErr;

    // Then ledger entry (so triggers / mirrors keep totals correct)
    const { error: ledErr } = await supabase
      .from('loyalty_ledger')
      .insert([{
        user_id: customer,
        points: -meta.points,
        reason: meta.reason,
        source: 'redeem',
      }]);

    if (ledErr) {
      // rollback the pending reward if ledger insert fails
      await supabase.from('pending_rewards').delete().eq('id', pr.id);
      throw ledErr;
    }

    // Return code + the Square Discount Catalog ID for client checkout
    return {
      statusCode: 200,
      body: JSON.stringify({ code, rewardKey, discountCatalogId, expires_at }),
    };
  } catch (e: any) {
    console.error('redeem-generate-code error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'Server error' }) };
  }
};

export default handler;
