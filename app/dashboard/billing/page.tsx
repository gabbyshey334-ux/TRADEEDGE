import { requireAuthUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { parsePlan } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";
import { BillingClient } from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, sub_status, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const plan: Plan = parsePlan(profile?.plan) ?? "starter";
  const subStatus = profile?.sub_status ?? "trialing";
  const hasStripeBilling = Boolean(profile?.stripe_customer_id);

  return (
    <BillingClient
      plan={plan}
      subStatus={subStatus}
      hasStripeBilling={hasStripeBilling}
    />
  );
}
