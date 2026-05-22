"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/server";
import type { Plan } from "@/lib/types";

const DEV_EMAIL = "sheywebstudio@gmail.com";
const VALID_PLANS: Plan[] = ["starter", "pro", "elite"];

function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && VALID_PLANS.includes(value as Plan);
}

/**
 * Testing-only: set the authenticated user's plan in profiles and subscriptions.
 * Restricted to the developer account. Not exposed in UI.
 */
export async function setTestPlan(
  plan: Plan
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isPlan(plan)) {
    return { ok: false, error: "Invalid plan. Must be starter, pro, or elite." };
  }

  const { user } = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Not authenticated." };
  }

  const email = user.email?.trim().toLowerCase();
  if (email !== DEV_EMAIL) {
    return { ok: false, error: "Unauthorized." };
  }

  if (!user.id) {
    return { ok: false, error: "Missing user id." };
  }

  try {
    const supabase = await createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan })
      .eq("id", user.id);

    if (profileError) {
      return { ok: false, error: profileError.message };
    }

    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan,
        plan_status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subError) {
      return { ok: false, error: subError.message };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update test plan.";
    return { ok: false, error: message };
  }
}
