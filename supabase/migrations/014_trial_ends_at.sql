-- Ensure trial_ends_at exists (already present in 001; idempotent)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trial_ends_at
  TIMESTAMPTZ;

-- Explicit 14-day trial on signup (also keeps email_sequence enqueue)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW() + INTERVAL '14 days'
  );

  INSERT INTO public.email_sequence (user_id, email)
  VALUES (NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
