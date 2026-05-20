import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Plan } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/** Deduped per request — layout + pages share one auth round-trip. */
export const getAuthUser = cache(async () => {
  if (!getSupabaseEnv()) {
    return { user: null, error: null };
  }
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
});

export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, plan")
    .eq("id", userId)
    .maybeSingle();
  return data;
});

export async function requireAuthUser(): Promise<User> {
  const { user } = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

export interface SidebarUserData {
  name: string;
  email: string;
  plan: Plan;
}

export async function getSidebarUser(): Promise<SidebarUserData> {
  if (!getSupabaseEnv()) {
    return { name: "Trader", email: "", plan: "starter" };
  }
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);

  return {
    name:
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Trader",
    email: profile?.email || user.email || "",
    plan: ((profile?.plan as Plan | undefined) ?? "starter") as Plan,
  };
}
