-- =========================================================================
-- TradeEdge AI — Prop Firm Tracker
-- Per-user prop firm challenge & funded accounts with RLS isolation.
-- =========================================================================

CREATE TABLE prop_firm_accounts (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  firm_name        TEXT NOT NULL,
  account_size     NUMERIC(12,2) NOT NULL,
  challenge_phase  TEXT NOT NULL CHECK (
    challenge_phase IN ('Evaluation','Phase 1','Phase 2','Funded','Failed','Passed')
  ),
  profit_target    NUMERIC(5,2),
  max_drawdown     NUMERIC(5,2),
  daily_drawdown   NUMERIC(5,2),
  current_balance  NUMERIC(12,2),
  start_date       DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prop_firm_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own"
  ON prop_firm_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own"
  ON prop_firm_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own"
  ON prop_firm_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "delete_own"
  ON prop_firm_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX prop_firm_accounts_user_created_idx
  ON prop_firm_accounts (user_id, created_at DESC);
