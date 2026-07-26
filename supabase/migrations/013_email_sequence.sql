-- Trial onboarding email sequence tracking
CREATE TABLE IF NOT EXISTS email_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id)
    ON DELETE CASCADE,
  email TEXT NOT NULL,
  day_1_sent_at TIMESTAMPTZ,
  day_3_sent_at TIMESTAMPTZ,
  day_7_sent_at TIMESTAMPTZ,
  day_12_sent_at TIMESTAMPTZ,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_email_sequence_user
  ON email_sequence(user_id);

-- Enqueue email sequence when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.email_sequence (user_id, email)
  VALUES (NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
