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
