import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  getServerSessionId,
  trackServerFunnelEvent,
} from "@/lib/funnel-events";
import { getStripe } from "@/lib/stripe";
import { planToPriceId } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";

export async function getOrCreateStripeCustomer(
  supabase: SupabaseClient,
  user: User
): Promise<string> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: profile?.email ?? user.email ?? undefined,
    metadata: { supabase_uid: user.id },
  });

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return customer.id;
}

export async function createStripeCheckoutSession(args: {
  supabase: SupabaseClient;
  user: User;
  plan: Plan;
  appUrl: string;
}): Promise<{ url: string }> {
  const { supabase, user, plan, appUrl } = args;

  const priceId = planToPriceId(plan);
  if (!priceId) {
    throw new Error(
      `Stripe price for plan "${plan}" is not configured. Add STRIPE_${plan.toUpperCase()}_PRICE_ID in Vercel.`
    );
  }

  const customerId = await getOrCreateStripeCustomer(supabase, user);
  const stripe = getStripe();
  const sessionId = await getServerSessionId();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/dashboard`,
    allow_promotion_codes: true,
    metadata: {
      supabase_uid: user.id,
      ...(sessionId ? { te_session_id: sessionId } : {}),
    },
    subscription_data: {
      metadata: {
        supabase_uid: user.id,
        plan,
        ...(sessionId ? { te_session_id: sessionId } : {}),
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  await trackServerFunnelEvent({
    eventType: "checkout_started",
    userId: user.id,
    sessionId,
    metadata: {
      plan,
      stripe_checkout_session_id: session.id,
    },
  });

  return { url: session.url };
}

export async function createStripePortalSession(args: {
  supabase: SupabaseClient;
  userId: string;
  appUrl: string;
}): Promise<{ url: string }> {
  const { supabase, userId, appUrl } = args;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    throw new Error("No billing account found. Subscribe to a plan first.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a portal URL.");
  }

  return { url: session.url };
}
