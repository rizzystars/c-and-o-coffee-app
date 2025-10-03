// Runtime: Netlify Functions (legacy) — named export `handler`
import { createClient } from '@supabase/supabase-js';
console.log('coupon-validate VERSION v4-ilike-schema-safe');

type CouponRow = {
  id: string;
  code: string;
  discount_type: 'amount' | 'percent';
  discount_value: number; // cents for 'amount'; 0-100 for 'percent'

  // Expiration variants
  expires_at?: string | null;
  expires_on?: string | null;
  expiration?: string | null;
  valid_until?: string | null;
  valid_to?: string | null;

  // Redemption variants
  redeemed_at?: string | null;
  redeemed?: boolean | null;
  is_redeemed?: boolean | null;
  status?: string | null;

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

type Err = { ok: false; code?: string; message: string; hint?: string };

const JSON_HEADERS = { 'content-type': 'application/json', 'cache-control': 'no-store' };

function allowOrigin(event?: any) {
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

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`Supabase call timed out after ${ms}ms`)), ms);
  });
  const res = await Promise.race([p, timeout]);
  clearTimeout(t);
  return res;
}

// Helpers to tolerate schema differences
function pickExpiry(row: CouponRow): { field?: string; value?: string | null } {
  const fields = ['expires_at', 'expires_on', 'expiration', 'valid_until', 'valid_to'] as const;
  for (const f of fields) {
    const v = (row as any)[f];
    if (v != null) return { field: f, value: v as any };
  }
  return {};
}

function isExpired(row: CouponRow): boolean {
  const { value } = pickExpiry(row);
  if (!value) return false; // No expiry column → treat as not expired
  const v = String(value);
  const d = v.length <= 10 ? new Date(v + 'T23:59:59.999Z') : new Date(v);
  return Number.isFinite(+d) && d < new Date();
}

function isRedeemed(row: CouponRow): boolean {
  if (row.redeemed_at) return true;
  if (row.redeemed === true) return true;
  if (row.is_redeemed === true) return true;
  if (row.status && row.status.toLowerCase() === 'redeemed') return true;
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

  const rawCode = String(body?.code ?? '').trim(); // ← no uppercasing
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
    const selectCols =
      'id, code, discount_type, discount_value, expires_at, expires_on, expiration, valid_until, valid_to, redeemed_at, redeemed, is_redeemed, status, metadata';

    // Case-insensitive exact match
    const query = supabase
      .from('pending_rewards')
      .select(selectCols)
      .ilike('code', rawCode)
      .limit(1);

    console.log('Supabase query starting:', { table: 'pending_rewards', select: selectCols, where: { code: rawCode } });

    const { data, error } = await withTimeout(query, 10_000);

    console.log('Supabase query result meta:', {
      error: error ? { message: (error as any).message, details: (error as any).details } : null,
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

    console.log('Row inspection:', {
      id: row.id,
      code: row.code,
      hasRedeemedAt: !!row.redeemed_at,
      redeemed: row.redeemed ?? null,
      is_redeemed: row.is_redeemed ?? null,
      status: row.status ?? null,
      expiryField: (() => {
        const p = pickExpiry(row);
        return p.field || '(none)';
      })(),
      expiryValue: (() => {
        const p = pickExpiry(row);
        return p.value || '(none)';
      })(),
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

    const ok: Ok = {
      ok: true,
      code: row.code,
      discount_type: row.discount_type,
      discount_value: row.discount_value,
      message: 'Coupon valid',
      row: {
        id: row.id,
        expires_at: row.expires_at ?? row.expires_on ?? row.expiration ?? row.valid_until ?? row.valid_to ?? null,
        metadata: row.metadata ?? null,
      },
    };

    console.log('Coupon validated:', {
      id: row.id,
      code: row.code,
      discount_type: row.discount_type,
      discount_value: row.discount_value,
    });

    return { statusCode: 200, headers: { ...JSON_HEADERS, ...allowOrigin(event) }, body: JSON.stringify(ok) };
  } catch (err: any) {
    console.error('Unhandled error during validation:', {
      name: err?.name,
      message: err?.message,
      details: (err as any)?.details,
      hint: (err as any)?.hint,
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
