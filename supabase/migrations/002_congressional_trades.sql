-- =========================================================================
-- TradeEdge AI — Congressional Trades cache
-- Stores STOCK Act disclosures from Quiver Quantitative so the dashboard
-- can fall back to cached data when the upstream API is unavailable.
-- =========================================================================

CREATE TABLE congressional_trades (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_name     TEXT NOT NULL,
  party           TEXT,
  state           TEXT,
  ticker          TEXT NOT NULL,
  trade_type      TEXT NOT NULL,
  amount_range    TEXT,
  trade_date      DATE,
  disclosure_date DATE,
  description     TEXT,
  cached_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE congressional_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read congressional trades"
  ON congressional_trades FOR SELECT
  USING (true);

-- Helpful read index for the dashboard (newest disclosures first).
CREATE INDEX congressional_trades_disclosure_idx
  ON congressional_trades (disclosure_date DESC, cached_at DESC);

-- De-dupe upstream rows on (member, ticker, trade_date, trade_type, amount_range).
-- The Quiver feed can re-report the same fill across refreshes.
CREATE UNIQUE INDEX congressional_trades_unique_idx
  ON congressional_trades (
    member_name,
    ticker,
    COALESCE(trade_date, DATE '1970-01-01'),
    trade_type,
    COALESCE(amount_range, '')
  );
