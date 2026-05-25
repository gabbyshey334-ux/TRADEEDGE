"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/server";
import {
  isChallengePhase,
  type NewPropFirmAccount,
  type PropFirmAccount,
} from "@/lib/prop-firms";

export type PropFirmListResult =
  | { data: PropFirmAccount[]; error: null }
  | { data: null; error: string };

export type PropFirmActionResult =
  | { data: PropFirmAccount; error: null }
  | { data: null; error: string };

function revalidate() {
  revalidatePath("/dashboard/prop-firm-tracker");
}

function sanitize(input: Partial<NewPropFirmAccount>) {
  const out: Partial<NewPropFirmAccount> = {};

  if (typeof input.firm_name === "string") {
    out.firm_name = input.firm_name.trim();
  }
  if (typeof input.account_size === "number" && Number.isFinite(input.account_size)) {
    out.account_size = input.account_size;
  }
  if (isChallengePhase(input.challenge_phase)) {
    out.challenge_phase = input.challenge_phase;
  }
  if (input.profit_target === null) out.profit_target = null;
  else if (
    typeof input.profit_target === "number" &&
    Number.isFinite(input.profit_target)
  )
    out.profit_target = input.profit_target;

  if (input.max_drawdown === null) out.max_drawdown = null;
  else if (
    typeof input.max_drawdown === "number" &&
    Number.isFinite(input.max_drawdown)
  )
    out.max_drawdown = input.max_drawdown;

  if (input.daily_drawdown === null) out.daily_drawdown = null;
  else if (
    typeof input.daily_drawdown === "number" &&
    Number.isFinite(input.daily_drawdown)
  )
    out.daily_drawdown = input.daily_drawdown;

  if (input.current_balance === null) out.current_balance = null;
  else if (
    typeof input.current_balance === "number" &&
    Number.isFinite(input.current_balance)
  )
    out.current_balance = input.current_balance;

  if (input.start_date === null) out.start_date = null;
  else if (typeof input.start_date === "string" && input.start_date.trim())
    out.start_date = input.start_date.slice(0, 10);

  if (input.notes === null) out.notes = null;
  else if (typeof input.notes === "string") out.notes = input.notes.trim() || null;

  return out;
}

export async function getPropFirmAccounts(): Promise<PropFirmListResult> {
  const { user } = await getAuthUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prop_firm_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as PropFirmAccount[], error: null };
}

export async function createPropFirmAccount(
  input: NewPropFirmAccount
): Promise<PropFirmActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const clean = sanitize(input);
  if (!clean.firm_name) return { data: null, error: "Firm name is required." };
  if (typeof clean.account_size !== "number")
    return { data: null, error: "Account size is required." };
  if (!clean.challenge_phase)
    return { data: null, error: "Challenge phase is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prop_firm_accounts")
    .insert({
      user_id: user.id,
      firm_name: clean.firm_name,
      account_size: clean.account_size,
      challenge_phase: clean.challenge_phase,
      profit_target: clean.profit_target ?? null,
      max_drawdown: clean.max_drawdown ?? null,
      daily_drawdown: clean.daily_drawdown ?? null,
      current_balance: clean.current_balance ?? null,
      start_date: clean.start_date ?? null,
      notes: clean.notes ?? null,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  revalidate();
  return { data: data as PropFirmAccount, error: null };
}

export async function updatePropFirmAccount(
  id: string,
  input: Partial<NewPropFirmAccount>
): Promise<PropFirmActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const clean = sanitize(input);
  if (Object.keys(clean).length === 0) {
    return { data: null, error: "No valid fields to update." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prop_firm_accounts")
    .update(clean)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Account not found." };
  revalidate();
  return { data: data as PropFirmAccount, error: null };
}

export async function deletePropFirmAccount(
  id: string
): Promise<{ error: string | null }> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("prop_firm_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}
