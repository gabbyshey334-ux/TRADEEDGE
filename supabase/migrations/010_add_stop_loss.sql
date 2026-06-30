ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS stop_loss NUMERIC;

-- No backfill needed, existing rows default to NULL
-- which the app already handles by showing "—" for R:R
