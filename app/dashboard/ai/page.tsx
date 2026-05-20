import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";
import { AiCoachClient } from "./AiCoachClient";

export const dynamic = "force-dynamic";

export default async function AiCoachPage() {
  const user = await requireAuthUser();
  const trades = await getTradesForUser(user.id);

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const plan: Plan = ((profile?.plan as Plan | undefined) ?? "starter") as Plan;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const reportsThisMonth = count ?? 0;
  const monthlyLimit = PLAN_LIMITS[plan].maxMonthlyAiReports;

  return (
    <AiCoachClient
      tradeCount={trades.length}
      plan={plan}
      reportsThisMonth={reportsThisMonth}
      monthlyLimit={Number.isFinite(monthlyLimit) ? monthlyLimit : null}
    />
  );
}
