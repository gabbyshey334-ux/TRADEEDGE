"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import type { Plan } from "@/lib/types";

const VALID_PLANS: Plan[] = ["starter", "pro", "elite"];

function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && VALID_PLANS.includes(value as Plan);
}

async function upsertElitePlan(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ plan: "elite" })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "elite",
      plan_status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (subError) {
    throw new Error(subError.message);
  }
}

/**
 * Ensures admin accounts always have Elite access on each dashboard session.
 */
export async function ensureAdminAccess(): Promise<void> {
  try {
    const { user } = await getAuthUser();
    if (!user?.id || !isAdminEmail(user.email)) {
      return;
    }
    await upsertElitePlan(user.id);
  } catch (err) {
    console.error("[ensureAdminAccess] Failed to upsert admin plan:", err);
  }
}

/**
 * Testing-only: restricted to admin emails; always sets Elite for admins.
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

  if (!isAdminEmail(user.email)) {
    return { ok: false, error: "Unauthorized." };
  }

  if (!user.id) {
    return { ok: false, error: "Missing user id." };
  }

  try {
    await upsertElitePlan(user.id);
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update test plan.";
    return { ok: false, error: message };
  }
}
