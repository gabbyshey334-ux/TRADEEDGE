# TradeEdge AI

Forex & Futures trading journal SaaS — Next.js 14 (App Router), TypeScript, Supabase, Tailwind, deployable to Vercel.

## Stack

- Next.js 14 App Router + Server Actions
- TypeScript (strict)
- Supabase (Postgres, Auth, RLS)
- Tailwind CSS
- Anthropic Claude (proxied through `/api/ai/analyze`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-your-key
```

`ANTHROPIC_API_KEY` is **server-only** — it is never sent to the browser. All Anthropic calls go through `/api/ai/analyze`.

### 3. Run the Supabase migration

Open the Supabase SQL editor for your project and run the contents of `supabase/migrations/001_initial_schema.sql`. This creates the `profiles`, `trades`, `subscriptions`, and `ai_usage` tables with full RLS policies and a `handle_new_user` trigger that auto-creates a profile row when a user signs up.

### 4. Configure Auth providers

In the Supabase dashboard:

- **Authentication → Providers → Email**: enable email/password.
- **Authentication → Providers → Google**: enable Google OAuth. Add `http://localhost:3000/auth/callback` (and your production URL) to the redirect URLs.
- **Authentication → URL Configuration**: set Site URL to `http://localhost:3000` for dev, your production URL for prod. Add `/auth/callback` and `/auth/reset-password` to the allowed redirect URLs.

### 5. Run the app

```bash
npm run dev
```

Visit http://localhost:3000.

## Routes

| Route                          | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `/`                            | Redirects to `/dashboard` or `/login` |
| `/login`                       | Email/password + Google OAuth sign in |
| `/signup`                      | Account creation                      |
| `/forgot-password`             | Sends password reset link             |
| `/auth/callback`               | OAuth + email link callback           |
| `/auth/reset-password`         | Set a new password                    |
| `/dashboard`                   | Overview: stats, equity curve, recent trades |
| `/dashboard/journal`           | Full CRUD trade journal               |
| `/dashboard/analytics`         | Setup / emotion / session / market breakdowns |
| `/dashboard/risk`              | Forex + Futures position sizing       |
| `/dashboard/calendar`          | P&L heatmap by day                    |
| `/dashboard/ai`                | AI Coach (session, psychology, edge)  |

## Security model

- Every Supabase table has RLS enabled with `auth.uid()` scoped policies for SELECT / INSERT / UPDATE / DELETE.
- The `middleware.ts` redirects unauthenticated users away from `/dashboard/**` and signed-in users away from `/login` and `/signup`.
- Server actions in `lib/actions/*` always re-derive `user.id` from `supabase.auth.getUser()` and pass it into every query.
- The Anthropic API key is never imported in any client component.

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run type-check   # TypeScript only
npm run lint         # Next.js ESLint
```
