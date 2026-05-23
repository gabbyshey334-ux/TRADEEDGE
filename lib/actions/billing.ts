"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveAppUrl } from "@/lib/app-url";
import {
  createStripeCheckoutSession,
  createStripePortalSession,
} from "@/lib/stripe-billing";
import { PAYMENT_NOT_CONFIGURED_ERROR } from "@/lib/billing-messages";
import { syncUserPlanFromStripe } from "@/lib/billing/sync-plan";
import type { Plan } from "@/lib/types";

function assertStripeConfigured(): void {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    throw new Error(PAYMENT_NOT_CONFIGURED_ERROR);
  }
}

export async function createCheckoutSession(
  plan: Plan
): Promise<{ url: string }> {
  try {
    assertStripeConfigured();

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }
    if (!user) {
      throw new Error("Please sign in to upgrade your plan.");
    }

    const appUrl = await resolveAppUrl();
    return await createStripeCheckoutSession({
      supabase,
      user,
      plan,
      appUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    throw new Error(message);
  }
}

/** Reconcile profiles.plan with Stripe (post-checkout fallback). */
export async function syncSubscriptionFromStripe(): Promise<{ plan: Plan }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }
  if (!user) {
    throw new Error("Please sign in.");
  }

  const plan = await syncUserPlanFromStripe(user.id);
  return { plan: plan ?? "starter" };
}

export async function createPortalSession(): Promise<{ url: string }> {
  try {
    assertStripeConfigured();

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }
    if (!user) {
      throw new Error("Please sign in to manage billing.");
    }

    const appUrl = await resolveAppUrl();
    return await createStripePortalSession({
      supabase,
      userId: user.id,
      appUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to open billing portal.";
    throw new Error(message);
  }
}
