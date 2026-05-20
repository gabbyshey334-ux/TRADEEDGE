/**
 * Supabase URL + anon/publishable key for browser and middleware.
 * Returns null when env is missing (e.g. Vercel env not configured yet).
 */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anonKey) return null;
  return { url, anonKey };
}
