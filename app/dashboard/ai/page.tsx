import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";
import { AiCoachClient } from "./AiCoachClient";

export const dynamic = "force-dynamic";

function parsePlan(value: unknown): Plan {
  if (value === "pro" || value === "elite" || value === "starter") {
    return value;
  }
  return "starter";
}

export default async function AiCoachPage() {
  const user = await requireAuthUser();

  let tradeCount = 0;
  let plan: Plan = "starter";
  let reportsThisMonth = 0;
  let monthlyLimit: number | null = 0;

  try {
    if (!user?.id) {
      return (
        <AiCoachClient
          tradeCount={0}
          plan="starter"
          reportsThisMonth={0}
          monthlyLimit={0}
        />
      );
    }

    const trades = await getTradesForUser(user.id);
    tradeCount = Array.isArray(trades) ? trades.length : 0;

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profile != null) {
      plan = parsePlan(profile.plan);
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: usageError } = await supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if (!usageError) {
      reportsThisMonth = count ?? 0;
    }

    const limit = PLAN_LIMITS[plan].maxMonthlyAiReports;
    monthlyLimit = Number.isFinite(limit) ? limit : null;
  } catch (err) {
    console.error("[AiCoachPage] Failed to load AI Coach data:", err);
  }

  return (
    <AiCoachClient
      tradeCount={tradeCount}
      plan={plan}
      reportsThisMonth={reportsThisMonth}
      monthlyLimit={monthlyLimit}
    />
  );
}
