"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/server";
import type { NewTrade, Trade } from "@/lib/types";

function revalidateDashboardPages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journal");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/ai");
}

export type TradeActionResult =
  | { data: Trade; error: null }
  | { data: null; error: string };

export type TradeListResult =
  | { data: Trade[]; error: null }
  | { data: null; error: string };

export async function getTrades(): Promise<TradeListResult> {
  const { user } = await getAuthUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as Trade[], error: null };
}

export async function createTrade(input: NewTrade): Promise<TradeActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const supabase = await createClient();
  const payload = { ...input, user_id: user.id };

  const { data, error } = await supabase
    .from("trades")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  revalidateDashboardPages();
  return { data: data as Trade, error: null };
}

export async function updateTrade(
  id: string,
  input: Partial<NewTrade>
): Promise<TradeActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Trade not found." };
  revalidateDashboardPages();
  return { data: data as Trade, error: null };
}

export async function deleteTrade(
  id: string
): Promise<{ error: string | null }> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidateDashboardPages();
  return { error: null };
}
