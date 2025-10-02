# Loyalty Add-on (Square + Netlify Functions + Supabase)

Endpoints:
- POST `/.netlify/functions/loyalty-get-balance` { phone|email } -> { points }
- POST `/.netlify/functions/loyalty-redeem` { phone|email, orderId, pointsToSpend } -> { applied, pointsSpent }
- POST `/.netlify/functions/order-get` { orderId } -> { subtotalCents, totalCents, ... }
- POST `/.netlify/functions/loyalty-send-otp` { phone } -> { ok, sent, demoCode? }
- POST `/.netlify/functions/loyalty-verify-otp` { phone, code } -> { ok: true }
- POST `/.netlify/functions/square-webhook` (Square -> you) payment.updated

SQL: run `supabase_loyalty_otp.sql` once.

Env (Netlify):
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- SQUARE_ACCESS_TOKEN, SQUARE_ENV, SQUARE_LOCATION_ID, SITE_URL
- SQUARE_WEBHOOK_SIGNATURE_KEY (for webhooks)
- (optional) TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM

Flow:
1) User enters phone → send OTP → verify
2) Get balance → optionally redeem (adds Square order discount)
3) Pay → earn points (via webhook or in pay function)

Redeem math:
- 1 point = $0.05 (100 pts = $5). Change in `loyalty-redeem.ts`: VALUE_PER_POINT_CENTS.
- Earn math: 1 pt / $1 (pre-tax). Webhook and pay function use floor(subtotalCents/100).
