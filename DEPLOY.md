# Deploy TradeEdge AI on Vercel

## Quick deploy (GitHub → Vercel)

1. Push `main` to https://github.com/gabbyshey334-ux/TRADEEDGE
2. [vercel.com/new](https://vercel.com/new) → Import **TRADEEDGE** → Root Directory: **`.`** (repo root is the Next.js app)
3. Add **Environment Variables** (Production + Preview). **Required before first deploy** — missing values cause `MIDDLEWARE_INVOCATION_FAILED` (500 on every page):

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — Stripe webhook |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (update after first deploy) |
| `ANTHROPIC_API_KEY` | AI coach |
| `STRIPE_SECRET_KEY` | Billing |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint |
| `STRIPE_STARTER_PRICE_ID` | Stripe price IDs |
| `STRIPE_PRO_PRICE_ID` | |
| `STRIPE_ELITE_PRICE_ID` | |

4. Deploy. Then set **Supabase** → Authentication → URL Configuration:
   - Site URL: your Vercel production URL
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`, `https://your-app.vercel.app/auth/reset-password`

5. **Stripe** webhook: `https://your-app.vercel.app/api/stripe/webhook`

## CLI deploy

```bash
cd tradeedge-ai
vercel login
vercel link
vercel env pull .env.vercel.local   # optional
vercel --prod
```

After first deploy, set `NEXT_PUBLIC_APP_URL` in Vercel to the production URL and redeploy.

## Custom domain migration

Purchase the domain and add it in **Vercel** → Project → Settings → Domains (dashboard only, not in code).

`lib/app-url.ts` already uses `NEXT_PUBLIC_APP_URL` as the canonical origin (Stripe checkout/portal redirects). Fallback order: env → `VERCEL_URL` → request host. No code change needed if that file is unchanged.

### Checklist (update placeholders with your domain)

Replace `https://your-domain.com` below. **Keep old Vercel/Supabase URLs in place until the new domain is verified.**

1. **Vercel** → Environment Variables → Production:
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.com`
2. **Supabase** → Authentication → URL Configuration:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: add `https://your-domain.com/auth/callback` (keep existing URLs during transition)
3. **Google Cloud Console** → Credentials → OAuth client → Authorized redirect URIs:
   - Add `https://your-domain.com/auth/v1/callback`
   - Keep the Supabase project URL (`https://<project>.supabase.co/auth/v1/callback`) until Google OAuth works on the new domain
4. **Stripe** → Developers → Webhooks:
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Copy the new signing secret (`whsec_…`) → Vercel `STRIPE_WEBHOOK_SECRET`
5. **Redeploy** on Vercel after env changes.

### Verify before removing old URIs

- Sign in with email/password on `https://your-domain.com`
- Sign in with Google OAuth on the new domain
- Upgrade / billing portal redirect returns to the new domain
- Stripe test webhook delivers successfully (Stripe CLI or dashboard “Send test webhook”)
