import { stripe } from "@/lib/stripe";
import { getServiceClient } from "@/lib/supabase/service";
import {
  ACTIVE_STATUSES,
  applySubscriptionToUser,
  resolvePlanFromSubscription,
  updateProfilePlan,
  upsertSubscriptionRow,
} from "@/lib/billing/subscription-sync";
import type { Plan } from "@/lib/types";

/**
 * Pull the user's active Stripe subscription and mirror it to profiles + subscriptions.
 * Used after checkout redirect and when webhooks are delayed or misconfigured.
 */
export async function syncUserPlanFromStripe(
  userId: string
): Promise<Plan | null> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return null;
  }

  const supabase = getServiceClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id, stripe_sub_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile?.stripe_customer_id) {
    return profile?.plan ? (profile.plan as Plan) : null;
  }

  const currentPlan = (profile.plan as Plan) ?? "starter";

  // Manual or admin Elite grant — keep unless Stripe has an active Elite subscription.
  if (currentPlan === "elite") {
    const listed = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id as string,
      status: "all",
      limit: 20,
    });
    const eliteSub = listed.data.find(
      (s) =>
        ACTIVE_STATUSES.has(s.status) &&
        resolvePlanFromSubscription(s) === "elite"
    );
    if (eliteSub) {
      return await applySubscriptionToUser({ userId, subscription: eliteSub });
    }
    return "elite";
  }

  const customerId = profile.stripe_customer_id as string;

  if (profile.stripe_sub_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        profile.stripe_sub_id as string
      );
      if (ACTIVE_STATUSES.has(subscription.status)) {
        return await applySubscriptionToUser({ userId, subscription });
      }
    } catch {
      /* fall through to list */
    }
  }

  const listed = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  const subscription =
    listed.data.find((s) => ACTIVE_STATUSES.has(s.status)) ??
    listed.data[0];

  if (!subscription) {
    return (profile.plan as Plan) ?? "starter";
  }

  if (ACTIVE_STATUSES.has(subscription.status)) {
    return await applySubscriptionToUser({ userId, subscription });
  }

  await upsertSubscriptionRow({
    userId,
    subscription,
    plan: "starter",
  });
  await updateProfilePlan({
    userId,
    patch: {
      plan: "starter",
      stripe_customer_id: customerId,
      stripe_sub_id: null,
      sub_status: subscription.status,
    },
  });
  return "starter";
}
