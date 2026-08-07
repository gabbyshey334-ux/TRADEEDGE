import { createClient } from "@/lib/supabase/client";

export type AuthClientResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

function redirectUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${path}`;
}

/** Map Supabase Auth errors to clearer copy (esp. email rate limits). */
function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("email rate limit exceeded") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Too many auth emails were sent recently. Please wait about an hour and try again — or ask support if you need access sooner.";
  }
  return message;
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  full_name: string;
}): Promise<AuthClientResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { full_name: input.full_name.trim() },
      emailRedirectTo: redirectUrl("/auth/callback"),
    },
  });

  if (error) return { ok: false, error: mapAuthError(error.message) };
  return { ok: true, needsEmailConfirmation: !data.session };
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthClientResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error) return { ok: false, error: mapAuthError(error.message) };
  return { ok: true, needsEmailConfirmation: false };
}

export async function signInWithGoogle(): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl("/auth/callback") },
  });

  if (error) return { ok: false, error: mapAuthError(error.message) };
  if (!data.url) return { ok: false, error: "Could not start Google sign-in." };
  return { ok: true, url: data.url };
}

export async function signOutClient(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function resetPasswordForEmail(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectUrl("/auth/reset-password"),
  });
  if (error) return { ok: false, error: mapAuthError(error.message) };
  return { ok: true };
}

export async function updatePassword(
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: mapAuthError(error.message) };
  return { ok: true };
}
