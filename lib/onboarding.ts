import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Marks onboarding complete only when all three checklist steps are done.
 * Call after a trade insert, AI report save, or prop-firm account insert.
 */
export async function maybeCompleteOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const [
    { count: tradeCount },
    { count: aiCount },
    { count: propCount },
  ] = await Promise.all([
    supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("prop_firm_accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (
    (tradeCount ?? 0) > 0 &&
    (aiCount ?? 0) > 0 &&
    (propCount ?? 0) > 0
  ) {
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId);
  }
}

/**
 * Stops the trial email sequence when a user upgrades off starter.
 * Fail-soft: never throws.
 */
export async function stopEmailSequenceForUpgradedUser(
  userId: string
): Promise<void> {
  try {
    const service = getServiceClient();
    await service
      .from("email_sequence")
      .update({ unsubscribed: true })
      .eq("user_id", userId)
      .eq("unsubscribed", false);
  } catch {
    // Fail soft, upgrade path must not fail because of email sequence
  }
}
