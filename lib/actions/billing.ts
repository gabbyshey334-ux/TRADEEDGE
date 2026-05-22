"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveAppUrl } from "@/lib/app-url";
import {
  createStripeCheckoutSession,
  createStripePortalSession,
} from "@/lib/stripe-billing";
import type { Plan } from "@/lib/types";

export async function createCheckoutSession(
  plan: Plan
): Promise<{ url: string }> {
  try {
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

export async function createPortalSession(): Promise<{ url: string }> {
  try {
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
