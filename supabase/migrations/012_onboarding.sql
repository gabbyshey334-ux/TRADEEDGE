ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed
  BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_step
  INTEGER NOT NULL DEFAULT 0;

-- Existing traders skip onboarding permanently
UPDATE profiles
SET onboarding_completed = true
WHERE id IN (SELECT DISTINCT user_id FROM trades WHERE user_id IS NOT NULL);
