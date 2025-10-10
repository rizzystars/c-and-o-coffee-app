# C&O Coffee Ordering — Square Catalog + Loyalty (Supabase)

This project bundles your Square Catalog ordering app with the Loyalty add-on.

## What's included
- Netlify Functions (Square Orders/Payments + Loyalty endpoints)
- Frontend (Vite React app)
- Supabase SQL (docs/supabase_loyalty_otp.sql)

## Netlify environment (server)
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- SQUARE_ACCESS_TOKEN, SQUARE_ENV, SQUARE_LOCATION_ID, SITE_URL
- SQUARE_WEBHOOK_SIGNATURE_KEY (for webhooks)
- (optional) TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM

## Client (Vite)
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- VITE_SQUARE_APPLICATION_ID, VITE_SQUARE_LOCATION_ID, VITE_SQUARE_ENV

## Deploy
npm install
npm run build
netlify deploy --dir=dist --prod
