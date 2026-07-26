-- Extend trial email sequence with day-14 and day-15 send markers
ALTER TABLE email_sequence
  ADD COLUMN IF NOT EXISTS day_14_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS day_15_sent_at TIMESTAMPTZ;
