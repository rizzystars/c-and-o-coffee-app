
# C&O Coffee Ordering (with Loyalty + Sign Up) — Source Package

This package contains the editable **source code** for your React/Vite/Tailwind app with Supabase Auth (sign up / login) and Netlify Functions for loyalty + Square integration.

## What this ZIP is
- Full **source** (so you can edit pages/components).
- Includes **Netlify Functions** under `netlify/functions/` (loyalty endpoints, webhook, etc.).
- Netlify config: `netlify.toml` (builds `dist`, bundles functions).

## What this ZIP is not
- It is **not** a prebuilt `/dist` ready for drag‑and‑drop. Since drag‑and‑drop does not run a build, use the CLI steps below or connect to Git so Netlify builds it for you.

---

## Environment Variables (required)
Set these in Netlify **Site settings → Build & deploy → Environment** (or locally in a `.env.local` file when running `npm run dev`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SQUARE_APPLICATION_ID`
- `SQUARE_ACCESS_TOKEN` (server side, for functions)
- `SQUARE_ENV` (`sandbox` or `production`)
- `SQUARE_LOCATION_ID`
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `JWT_SECRET` (used by functions if applicable)
- `SITE_URL` (your site URL)
- `VITE_ALLOW_TIPS` (`true`/`false`)
- Any others you already had configured previously

> For local dev, create a `.env.local` at the project root and paste your `VITE_*` values there. Non‑VITE secrets are used by serverless functions at deploy time.

---

## Option A — Build & Deploy with Netlify CLI (recommended)
1. Open **PowerShell** in this folder (after unzipping).
2. Install deps (Node 18+ is recommended):
   ```powershell
   npm install
   ```
3. Build the site:
   ```powershell
   npm run build
   ```
4. Deploy using Netlify CLI (draft deploy):
   ```powershell
   netlify deploy --dir dist
   ```
   If you haven't linked the folder yet:
   ```powershell
   netlify link
   ```
   then repeat the deploy command.
5. When it looks good, push it live:
   ```powershell
   netlify deploy --dir dist --prod
   ```

## Option B — One‑click build script (Windows PowerShell)
Run:
```powershell
.\build-and-deploy.ps1
```
This will install deps, build, and prompt you to deploy (draft and/or prod).

## Option C — Connect to Git (Netlify UI)
- Push this folder to GitHub (or GitLab/Bitbucket).
- In Netlify → **Add new site** → **Import from Git**.
- Build command: `npm run build`
- Publish dir: `dist`
- Functions dir: `netlify/functions`
- Add environment variables in Netlify.
- Netlify will build and publish automatically on each push.

---

## Where is Sign Up / Login?
- Pages: `pages/LoginPage.tsx`, `pages/AccountPage.tsx`
- Store: `hooks/useAuthStore.ts`
- Supabase client: `lib/supabaseClient.ts`

The login page supports **Sign Up** and **Login** flows using Supabase Auth. Make sure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly.

## Loyalty Endpoints (Netlify Functions)
- `/.netlify/functions/loyalty-get-balance`
- `/.netlify/functions/loyalty-redeem`
- `/.netlify/functions/order-get`
- `/.netlify/functions/loyalty-send-otp`
- `/.netlify/functions/loyalty-verify-otp`
- `/.netlify/functions/square-webhook`

These functions read your Square + Supabase secrets from environment variables at deploy time.

---

## PowerShell convenience scripts
- `build-and-zip.ps1` → installs deps, builds, and creates `dist.zip` (for drag‑and‑drop if you like).
- `build-and-deploy.ps1` → guided build and deploy via Netlify CLI.

---

## Troubleshooting
- If Netlify CLI complains about `netlify.toml`, ensure paths use forward slashes (`netlify/functions`) and that you’re running commands from the project root.
- If auth fails, verify Supabase URL/Anon Key and that **Auth → Email** provider is enabled in Supabase.
- If loyalty endpoints 401/403, verify your Square tokens and webhook key.


## Background Image
A fixed background image has been added via `index.css` using `/coffee_elves_2.png` (placed in `public/`). The image stays static while all page content scrolls.
