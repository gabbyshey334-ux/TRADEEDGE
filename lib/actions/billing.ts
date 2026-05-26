"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveAppUrl } from "@/lib/app-url";
import {
  createStripeCheckoutSession,
  createStripePortalSession,
} from "@/lib/stripe-billing";
import {
  MANUAL_PLAN_BILLING_MESSAGE,
  PAYMENT_NOT_CONFIGURED_ERROR,
} from "@/lib/billing-messages";
import { syncUserPlanFromStripe } from "@/lib/billing/sync-plan";
import type { Plan } from "@/lib/types";

export type BillingActionResult =
  | { ok: true; url: string }
  | {
      ok: false;
      error: string;
      code?: "not_configured" | "no_customer" | "auth" | "unknown";
    };

export type SyncPlanResult =
  | { ok: true; plan: Plan }
  | { ok: false; error: string };

function notConfigured(): BillingActionResult {
  return {
    ok: false,
    error: PAYMENT_NOT_CONFIGURED_ERROR,
    code: "not_configured",
  };
}

export async function createCheckoutSession(
  plan: Plan
): Promise<BillingActionResult> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return notConfigured();
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { ok: false, error: authError.message, code: "auth" };
    }
    if (!user) {
      return {
        ok: false,
        error: "Please sign in to upgrade your plan.",
        code: "auth",
      };
    }

    const appUrl = await resolveAppUrl();
    const { url } = await createStripeCheckoutSession({
      supabase,
      user,
      plan,
      appUrl,
    });
    return { ok: true, url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    return { ok: false, error: message, code: "unknown" };
  }
}

/** Reconcile profiles.plan with Stripe (post-checkout fallback). */
export async function syncSubscriptionFromStripe(): Promise<SyncPlanResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { ok: false, error: authError.message };
    }
    if (!user) {
      return { ok: false, error: "Please sign in." };
    }

    const plan = await syncUserPlanFromStripe(user.id);
    return { ok: true, plan: plan ?? "starter" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sync subscription.";
    return { ok: false, error: message };
  }
}

export async function createPortalSession(): Promise<BillingActionResult> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return notConfigured();
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { ok: false, error: authError.message, code: "auth" };
    }
    if (!user) {
      return {
        ok: false,
        error: "Please sign in to manage billing.",
        code: "auth",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return { ok: false, error: profileError.message, code: "unknown" };
    }

    if (!profile?.stripe_customer_id) {
      return {
        ok: false,
        error: MANUAL_PLAN_BILLING_MESSAGE,
        code: "no_customer",
      };
    }

    const appUrl = await resolveAppUrl();
    const { url } = await createStripePortalSession({
      supabase,
      userId: user.id,
      appUrl,
    });
    return { ok: true, url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to open billing portal.";
    return { ok: false, error: message, code: "unknown" };
  }
}
