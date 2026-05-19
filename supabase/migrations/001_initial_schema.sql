-- =========================================================================
-- TradeEdge AI — Initial Schema
-- Run this in the Supabase SQL editor exactly as written.
-- =========================================================================

-- PROFILES ----------------------------------------------------------------
CREATE TABLE profiles (
  id                  UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email               TEXT NOT NULL,
  full_name           TEXT,
  plan                TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','elite')),
  stripe_customer_id  TEXT UNIQUE,
  stripe_sub_id       TEXT,
  sub_status          TEXT DEFAULT 'trialing',
  trial_ends_at       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Lock down the SECURITY DEFINER function so only the trigger can use it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TRADES ------------------------------------------------------------------
CREATE TABLE trades (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date           DATE NOT NULL,
  market         TEXT NOT NULL CHECK (market IN ('Forex','Futures')),
  symbol         TEXT NOT NULL,
  direction      TEXT NOT NULL CHECK (direction IN ('Long','Short')),
  entry          NUMERIC(12,5) NOT NULL,
  exit_price     NUMERIC(12,5),
  size           NUMERIC(10,4),
  pnl            NUMERIC(12,2) NOT NULL,
  rr             NUMERIC(6,2),
  emotion        TEXT,
  setup          TEXT,
  session        TEXT,
  notes          TEXT,
  screenshot_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON trades FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX trades_user_date ON trades(user_id, date DESC);

-- SUBSCRIPTIONS -----------------------------------------------------------
CREATE TABLE subscriptions (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_status            TEXT DEFAULT 'trialing',
  plan                   TEXT DEFAULT 'starter',
  current_period_end     TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON subscriptions FOR DELETE USING (auth.uid() = user_id);

-- AI USAGE ----------------------------------------------------------------
CREATE TABLE ai_usage (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  report_type  TEXT NOT NULL CHECK (report_type IN ('session','psychology','edge')),
  content      TEXT NOT NULL,
  tokens_used  INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON ai_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON ai_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON ai_usage FOR DELETE USING (auth.uid() = user_id);
