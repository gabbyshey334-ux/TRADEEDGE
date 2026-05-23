import { syncUserPlanFromStripe } from "@/lib/billing/sync-plan";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Sync plan from Stripe when the user has a billing account.
 * Safe to call on each dashboard load — no-ops without stripe_customer_id.
 */
export async function syncSubscriptionIfNeeded(userId: string): Promise<void> {
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
