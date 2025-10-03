// file: netlify/functions/coupon-validate.ts
// Runtime: Netlify Functions (legacy) — named export `handler`
import { createClient } from '@supabase/supabase-js';
console.log('coupon-validate VERSION v11-FIXED-ESPRESSO-PRICE'); // Updated version tag

// --- START: MODIFIED TYPE DEFINITIONS ---
type CouponRow = {
  id: string;
  code: any; // tolerate non-text columns
  reward_type: string; // <-- Correct column name
  points_cost: number; 

  // Expiration variants: ONLY includes 'expires_at' now
  expires_at?: string | null;

  // Redemption variants: NOW ONLY RELIES ON 'status' FIELD
  status?: string | null;

  // We keep these for completeness but they are only selected if they exist
  consumed_payment_id?: string | null; 
  applied_order_id?: string | null;

  // metadata?: Record<string, any> | null; // <-- REMOVED
};

// --- HELPER FUNCTION: Maps the reward code to the discount parameters ---
function getDiscountDetails(rewardType: string) {
  // 🛑 YOU MUST CUSTOMIZE THIS MAPPING BASED ON YOUR LOYALTY RULES 🛑
  // The frontend expects 'amount' (in cents) or 'percent' (0-100).
  
  const type = rewardType.toLowerCase().includes('off') ? 'percent' : 'amount';

  switch (rewardType) {
    case 'ESPRESSO_2OZ': 
      // FIX APPLIED: Changed discount_value from 350 ($3.50) to 200 ($2.00) 
      // to match the price of the single espresso item.
      return { discount_type: 'amount' as const, discount_value: 200 }; 
    case 'LOYALTY_DISC_ID_LATTE': 
      // Assuming this is a percentage discount (e.g., 20% off)
      return { discount_type: 'percent' as const, discount_value: 20 };
    case 'LOYALTY_DISC_ID_MERCH_15_OFF':
      return { discount_type: 'percent' as const, discount_value: 15 };
    default:
      // Fallback or unknown reward type
      return { discount_type: 'amount' as const, discount_value: 100 }; // Default to $1.00 off
  }
}
// --- END: MODIFIED TYPE DEFINITIONS ---


type Ok = {
  ok: true;
  code: string;
  discount_type: 'amount' | 'percent'; 
  discount_value: number; 
  message: string;
  row: Partial<CouponRow>;
};
type Err = { ok: false; code?: string; message: string; hint?: string; debug?: any };

const JSON_HEADERS = { 'content-type': 'application/json', 'cache-control': 'no-store' };
const DEBUG = process.env.DEBUG_COUPON === '1';

function allowOrigin(event: any) {
  const origin = process.env.SITE_URL || (event?.headers?.origin ? String(event.headers.origin) : '*');
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-credentials': 'true',
    vary: 'Origin',
  };
}

function logHeader(title: string) {
  console.log(`\n=== ${title} @ ${new Date().toISOString()} ===`);
}
function safeKeyPreview(key?: string | null) {
  if (!key) return 'MISSING';
  return `present (len=${key.length}, starts:${key.slice(0, 4)})`;
}

// FIXED: Only checks for the existing 'expires_at' column
function pickExpiry(row: CouponRow): { field?: string; value?: string | null } {
  const fields = ['expires_at'] as const; 
  for (const f of fields) {
    const v = (row as any)[f];
    if (v != null) return { field: f, value: v as any };
  }
  return {};
}
function isExpired(row: CouponRow): boolean {
  const { value } = pickExpiry(row);
  if (!value) return false;
  const v = String(value);
  // Corrected timezone logic for date strings without time (e.g., '2025-10-03')
  const d = v.length <= 10 ? new Date(v + 'T23:59:59.999Z') : new Date(v); 
  return Number.isFinite(+d) && d < new Date();
}

// FIXED: Now relies on the 'status' column only (PENDING means NOT redeemed)
function isRedeemed(row: CouponRow): boolean {
  if (row.status && row.status.toLowerCase() === 'pending') {
    return false; // Not redeemed if status is PENDING
  }
  // Assume any other status (REDEEMED, USED, EXPIRED, etc.) means it cannot be applied.
  if (row.status && row.status.toLowerCase() !== 'pending') {
    return true; 
  }
  // Fallback check if the table somehow has another column that indicates usage
  // Checking 'consumed_payment_id' and 'applied_order_id' (if they were selected)
  if (row.consumed_payment_id || row.applied_order_id) { 
    return true; 
  }
  
  return false;
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...allowOrigin(event) }, body: '' };
  }

  logHeader('coupon-validate START');

  if (event.httpMethod !== 'POST') {
    console.log(`Bad method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({ ok: false, message: 'Method not allowed' }),
    };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Env check:', {
    SUPABASE_URL_present: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: safeKeyPreview(SUPABASE_SERVICE_ROLE_KEY),
    node: process.version,
    runtime: 'netlify:legacy',
  });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required Supabase env vars.');
    return {
      statusCode: 500,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({
        ok: false,
        message: 'Server misconfiguration',
        hint: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing on Netlify',
      }),
    };
  }

  // Parse body
  let body: any = {};
  try {
    if (event.body) body = JSON.parse(event.body);
  } catch (e) {
    console.error('Bad JSON body:', e);
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({ ok: false, message: 'Invalid JSON body' }),
    };
  }

  const rawCode = String(body?.code ?? '').trim();
  console.log('Incoming payload:', { method: event.httpMethod, code_received: rawCode || '(empty)' });

  if (!rawCode) {
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({ ok: false, message: 'Coupon code is required' }),
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // --- FINAL FIX: Only selects existing columns to prevent the crash ---
    // REMOVED 'metadata' from selectCols
    const selectCols =
      'id, code, reward_type, points_cost, expires_at, status, consumed_payment_id, applied_order_id';

    // === eq-only lookup (safe for non-text columns) ===
    let data: any[] | null = null;
    let error: any = null;

    // A) exact raw - Removed withTimeout wrapper
    console.log('Supabase query A (eq raw):', { code: rawCode });
    ({ data, error } = await supabase.from('pending_rewards').select(selectCols).eq('code', rawCode).limit(1));

    // B) UPPER (if not found or if error) - Removed withTimeout wrapper
    if ((!error && (!data || data.length === 0)) || error) {
      const up = rawCode.toUpperCase();
      console.log('Supabase query B (eq upper):', { code: up, prevErr: error?.message });
      ({ data, error } = await supabase.from('pending_rewards').select(selectCols).eq('code', up).limit(1));
    }

    // C) lower (if still not found or error) - Removed withTimeout wrapper
    if ((!error && (!data || data.length === 0)) || error) {
      const lo = rawCode.toLowerCase();
      console.log('Supabase query C (eq lower):', { code: lo, prevErr: error?.message });
      ({ data, error } = await supabase.from('pending_rewards').select(selectCols).eq('code', lo).limit(1));
    }

    console.log('Supabase query result:', {
      error: error ? { message: error?.message, details: error?.details } : null,
      rows: data?.length || 0,
      sampleKeys: data?.length ? Object.keys(data[0] || {}) : null,
    });

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('No coupon row found for code:', rawCode);
      return {
        statusCode: 404,
        headers: { ...JSON_HEADERS, ...allowOrigin(event) },
        body: JSON.stringify<Err>({ ok: false, code: rawCode, message: 'Invalid coupon' }),
      };
    }

    const row = data[0] as CouponRow;
    
    // --- DEBUG STATUS CHECKS START ---
    console.log('--- DEBUG STATUS CHECKS ---');
    console.log('Reward Type:', row.reward_type);
    console.log('Status:', row.status);
    console.log('isRedeemed(row) result:', isRedeemed(row));
    console.log('isExpired(row) result:', isExpired(row));
    console.log('Current Time (for context):', new Date().toISOString());
    console.log('---------------------------');
    // --- DEBUG STATUS CHECKS END ---


    console.log('Row inspection:', {
      id: row.id,
      code: String(row.code),
      reward_type: row.reward_type,
      status: row.status ?? null,
      expiryField: (() => pickExpiry(row).field || '(none)')(),
      expiryValue: (() => pickExpiry(row).value || '(none)')(),
    });

    if (isRedeemed(row)) {
      console.warn('Coupon already redeemed:', { id: row.id, code: row.code });
      return {
        statusCode: 409,
        headers: { ...JSON_HEADERS, ...allowOrigin(event) },
        body: JSON.stringify<Err>({ ok: false, code: rawCode, message: 'Coupon already redeemed' }),
      };
    }

    if (isExpired(row)) {
      const { field, value } = pickExpiry(row);
      console.warn('Coupon expired:', { id: row.id, field, value });
      return {
        statusCode: 410,
        headers: { ...JSON_HEADERS, ...allowOrigin(event) },
        body: JSON.stringify<Err>({ ok: false, code: rawCode, message: 'Coupon expired' }),
      };
    }
    
    // --- Get the required discount details from the reward_type ---
    const { discount_type, discount_value } = getDiscountDetails(row.reward_type);

    const ok: Ok = {
      ok: true,
      code: String(row.code),
      discount_type: discount_type, // Now using inferred type
      discount_value: discount_value, // Now using inferred value
      message: 'Coupon valid',
      row: {
        id: row.id,
        expires_at: row.expires_at, // Only using the confirmed column
        // metadata: row.metadata ?? null, // <-- REMOVED
      },
    };

    console.log('Coupon validated:', {
      id: row.id,
      code: String(row.code),
      reward_type: row.reward_type,
      discount_type: discount_type,
      discount_value: discount_value,
    });

    return { statusCode: 200, headers: { ...JSON_HEADERS, ...allowOrigin(event) }, body: JSON.stringify(ok) };
  } catch (err: any) {
    const dbg = {
      name: err?.name,
      message: err?.message,
      details: (err as any)?.details,
      hint: (err as any)?.hint,
      stack: err?.stack?.split('\n').slice(0, 5).join(' | '),
    };
    console.error('Unhandled error during validation:', dbg);
    return {
      statusCode: 500,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({
        ok: false,
        message: 'Server error validating coupon',
        debug: DEBUG ? dbg : undefined,
      }),
    };
  } finally {
    logHeader('coupon-validate END');
  }
};
