import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Trade } from "@/lib/types";

/** Deduped per request when multiple server components need trades. */
export const getTradesForUser = cache(async (userId: string): Promise<Trade[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as Trade[];
});

export const getTradesForMonth = cache(
  async (userId: string, startIso: string, endIso: string): Promise<Trade[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startIso)
      .lte("date", endIso)
      .order("date", { ascending: false });

    if (error) return [];
    return (data ?? []) as Trade[];
  }
);
