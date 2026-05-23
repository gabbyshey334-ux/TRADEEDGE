import { syncUserPlanFromStripe } from "@/lib/billing/sync-plan";
import { getServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/auth/admin";

/**
 * Sync plan from Stripe when the user has a billing account.
 * Skips admin accounts (they get Elite via ensureAdminAccess).
 */
export async function syncSubscriptionIfNeeded(
  userId: string,
  email?: string | null
): Promise<void> {
  if (isAdminEmail(email)) {
    return;
  }
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return;
  }

  try {
    const supabase = getServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return;
    }

    await syncUserPlanFromStripe(userId);
  } catch (err) {
    console.error("[syncSubscriptionIfNeeded]", err);
  }
}
