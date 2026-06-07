"use server";

import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function generateApiKey(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "elite") {
    return { ok: false as const, error: "API access is an Elite feature." };
  }

  const { count } = await supabase
    .from("api_keys")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 3) {
    return { ok: false as const, error: "Maximum of 3 API keys allowed." };
  }

  const rawKey = "te_live_" + randomBytes(16).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 15) + "...";

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    name: name.trim() || "Default Key",
    key_prefix: keyPrefix,
    key_hash: keyHash,
  });

  if (error) return { ok: false as const, error: error.message };

  return { ok: true as const, key: rawKey, prefix: keyPrefix };
}

export async function deleteApiKey(keyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export type ApiKeyListItem = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

export async function listApiKeys() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, keys: [] as ApiKeyListItem[] };

  const { data } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { ok: true as const, keys: (data ?? []) as ApiKeyListItem[] };
}
