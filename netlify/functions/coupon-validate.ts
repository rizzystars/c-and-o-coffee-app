// file: netlify/functions/coupon-validate.ts
// Runtime: Netlify Functions (legacy) — named export `handler`

import { createClient } from '@supabase/supabase-js';

// 👇 Easy marker to confirm the correct build is running in Netlify logs
console.log('coupon-validate VERSION v2-handler');

type CouponRow = {
  id: string;
  code: string;
  discount_type: 'amount' | 'percent';
  discount_value: number; // cents for 'amount'; 0-100 for 'percent'
  expires_at: string | null;
  redeemed_at: string | null;
  metadata?: Record<string, any> | null;
};

type Ok = {
  ok: true;
  code: string;
  discount_type: CouponRow['discount_type'];
  discount_value: number;
  message: string;
  row: Partial<CouponRow>;
};

type Err = {
  ok: false;
  code?: string;
  message: string;
  hint?: string;
};

const JSON_HEADERS = {
  'content-type': 'application/json',
  'cache-control': 'no-store',
};

function allowOrigin(event?: any) {
  // If you want to be stricter, replace "*" with your site origin or infer from SITE_URL.
  const origin =
    process.env.SITE_URL ||
    (event?.headers?.origin ? String(event.headers.origin) : '*');

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

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`Supabase call timed out after ${ms}ms`)), ms);
  });
  const res = await Promise.race([p, timeout]);
  clearTimeout(t);
  return res;
}

export const handler = async (event: any) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...allowOrigin(event) }, body: '' };
  }

  logHeader('coupon-validate START');

  // Method check
  if (event.httpMethod !== 'POST') {
    console.log(`Bad method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({ ok: false, message: 'Method not allowed' }),
    };
  }

  // Env check (do NOT create the client at top-level)
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

  // Parse body (guard against empty body)
  let body: any = {};
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    console.error('Bad JSON body:', e);
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({ ok: false, message: 'Invalid JSON body' }),
    };
  }

  const rawCode = String(body?.code || '').trim().toUpperCase();
  console.log('Incoming payload:', {
    method: event.httpMethod,
    code_received: rawCode || '(empty)',
  });

  if (!rawCode) {
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({ ok: false, message: 'Coupon code is required' }),
    };
  }

  // ✅ Create Supabase client *inside* the handler after env validation
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Query pending_rewards for a matching, unredeemed, unexpired code
    const nowIso = new Date().toISOString();
    console.log('Supabase query starting:', {
      table: 'pending_rewards',
      filters: { code: rawCode, redeemed_at: 'IS NULL', expires_at: `>= ${nowIso} OR NULL` },
    });

    const query = supabase
      .from('pending_rewards')
      .select('*')
      .eq('code', rawCode)
      .is('redeemed_at', null)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .limit(1);

    const { data, error } = await withTimeout(query, 10_000);

    console.log('Supabase query result meta:', {
      error: error ? { message: (error as any).message, details: (error as any).details } : null,
      rows: data?.length || 0,
      sample: data?.length ? { id: (data as any)[0].id, code: (data as any)[0].code } : null,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn('No valid coupon row found for code:', rawCode);
      return {
        statusCode: 404,
        headers: { ...JSON_HEADERS, ...allowOrigin(event) },
        body: JSON.stringify<Err>({ ok: false, code: rawCode, message: 'Invalid or expired coupon' }),
      };
    }

    const row = (data as any)[0] as CouponRow;

    // Additional sanity
    if (row.redeemed_at) {
      console.warn('Coupon already redeemed:', { id: row.id, code: row.code });
      return {
        statusCode: 409,
        headers: { ...JSON_HEADERS, ...allowOrigin(event) },
        body: JSON.stringify<Err>({ ok: false, code: rawCode, message: 'Coupon already redeemed' }),
      };
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      console.warn('Coupon expired:', { id: row.id, expires_at: row.expires_at });
      return {
        statusCode: 410,
        headers: { ...JSON_HEADERS, ...allowOrigin(event) },
        body: JSON.stringify<Err>({ ok: false, code: rawCode, message: 'Coupon expired' }),
      };
    }

    // Success — DO NOT mark redeemed here; do that after successful Square payment.
    const ok: Ok = {
      ok: true,
      code: row.code,
      discount_type: row.discount_type,
      discount_value: row.discount_value,
      message: 'Coupon valid',
      row: {
        id: row.id,
        expires_at: row.expires_at,
        metadata: row.metadata ?? null,
      },
    };

    console.log('Coupon validated:', {
      id: row.id,
      code: row.code,
      discount_type: row.discount_type,
      discount_value: row.discount_value,
    });

    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify(ok),
    };
  } catch (err: any) {
    console.error('Unhandled error during validation:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack?.split('\n').slice(0, 5).join(' | '),
    });
    return {
      statusCode: 500,
      headers: { ...JSON_HEADERS, ...allowOrigin(event) },
      body: JSON.stringify<Err>({ ok: false, message: 'Server error validating coupon' }),
    };
  } finally {
    logHeader('coupon-validate END');
  }
};
