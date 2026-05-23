import type Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/service";
import { parsePlan, priceIdToPlan } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";

export function toIsoOrNull(
  unixSeconds: number | null | undefined
): string | null {
  if (!unixSeconds || Number.isNaN(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

export const ACTIVE_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

const DOWNGRADED_STATUSES = new Set([
  "canceled",
  "incomplete_expired",
  "unpaid",
]);

export function resolvePlanFromSubscription(
  subscription: Stripe.Subscription
): Plan | null {
  const priceId = subscription.items.data[0]?.price.id;
  const fromPrice = priceIdToPlan(priceId);
  if (fromPrice) return fromPrice;

  const metadataPlan = parsePlan(
    (subscription.metadata as Record<string, string> | undefined)?.plan
  );
  if (metadataPlan) return metadataPlan;

  const priceMetaPlan = parsePlan(
    subscription.items.data[0]?.price.metadata?.plan
  );
  if (priceMetaPlan) return priceMetaPlan;

  return null;
}

export function effectivePlanForStatus(
  subscription: Stripe.Subscription,
  plan: Plan
): Plan {
  if (DOWNGRADED_STATUSES.has(subscription.status)) return "starter";
  if (ACTIVE_STATUSES.has(subscription.status)) return plan;
  return "starter";
}

export async function upsertSubscriptionRow(args: {
  userId: string;
  subscription: Stripe.Subscription;
  plan: Plan;
}) {
  const { userId, subscription, plan } = args;
  const supabase = getServiceClient();

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      plan,
      plan_status: subscription.status,
      current_period_end: toIsoOrNull(subscription.current_period_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`subscriptions upsert failed: ${error.message}`);
  }
}

export async function updateProfilePlan(args: {
  userId: string;
  patch: Partial<{
    plan: Plan;
    stripe_customer_id: string;
    stripe_sub_id: string | null;
    sub_status: string;
  }>;
}) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update(args.patch)
    .eq("id", args.userId);
  if (error) {
    throw new Error(`profiles update failed: ${error.message}`);
  }
}

export async function applySubscriptionToUser(args: {
  userId: string;
  subscription: Stripe.Subscription;
}) {
  const { userId, subscription } = args;
  const plan = resolvePlanFromSubscription(subscription);
  if (!plan) {
    const priceId = subscription.items.data[0]?.price.id;
    throw new Error(
      `Unknown price id "${priceId}" on subscription ${subscription.id}`
    );
  }

  const effectivePlan = effectivePlanForStatus(subscription, plan);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await upsertSubscriptionRow({ userId, subscription, plan: effectivePlan });
  await updateProfilePlan({
    userId,
    patch: {
      plan: effectivePlan,
      stripe_customer_id: customerId,
      stripe_sub_id: ACTIVE_STATUSES.has(subscription.status)
        ? subscription.id
        : null,
      sub_status: subscription.status,
    },
  });

  return effectivePlan;
}
