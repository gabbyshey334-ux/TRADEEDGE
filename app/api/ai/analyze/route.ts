// =============================================================================
// AI Coach rate limiting — VERIFIED 2026-05-24 (Milestone 3 QA)
// -----------------------------------------------------------------------------
// Starter : PLAN_LIMITS.starter.maxMonthlyAiReports = 0
//           canRunAiReport returns false on the first attempt -> 403 with the
//           "AI Coach is available on Pro and Elite plans" upgrade message.
// Pro     : PLAN_LIMITS.pro.maxMonthlyAiReports = 10
//           Counts rows in ai_usage created since the 1st of the current month
//           and blocks once the count reaches 10 -> 403 with the Elite-upgrade
//           message.
// Elite   : PLAN_LIMITS.elite.maxMonthlyAiReports = Infinity
//           canRunAiReport always returns true; unlimited reports.
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTradeSummary } from "@/lib/utils";
import { canRunAiReport } from "@/lib/plan-limits";
import type { Trade, AiCoachReportType, Plan } from "@/lib/types";

export const runtime = "nodejs";

const VALID_MODES: AiCoachReportType[] = ["session", "psychology", "edge"];

function isValidMode(value: unknown): value is AiCoachReportType {
  return typeof value === "string" && (VALID_MODES as string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan: Plan = ((profile?.plan as Plan | undefined) ?? "starter") as Plan;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: reportsThisMonth } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  if (!canRunAiReport(plan, reportsThisMonth ?? 0)) {
    return NextResponse.json(
      {
        error:
          plan === "starter"
            ? "AI Coach is available on Pro and Elite plans. Upgrade to unlock."
            : "You have used all 10 AI reports for this month. Upgrade to Elite for unlimited reports.",
      },
      { status: 403 }
    );
  }

  let body: { mode?: unknown; tradeSummary?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mode: AiCoachReportType = isValidMode(body.mode) ? body.mode : "session";

  let tradeSummary: string;
  if (typeof body.tradeSummary === "string" && body.tradeSummary.trim()) {
    tradeSummary = body.tradeSummary;
  } else {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    tradeSummary = buildTradeSummary((data ?? []) as Trade[]);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI provider is not configured." },
      { status: 500 }
    );
  }

  const prompts: Record<AiCoachReportType, string> = {
    session: `Analyze my recent trading session data and provide a detailed debrief:\n\n${tradeSummary}`,
    psychology: `As a trading psychology coach, deeply analyze the emotional patterns in my trading:\n\n${tradeSummary}`,
    edge: `Analyze my trading data to quantify and define my statistical edge:\n\n${tradeSummary}`,
  };

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompts[mode] }],
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Network error." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return NextResponse.json(
      { error: `Anthropic error: ${response.status} ${text || response.statusText}` },
      { status: 502 }
    );
  }

  const data: {
    content?: Array<{ text?: string }>;
    usage?: { output_tokens?: number };
  } = await response.json();
  const content =
    data.content?.map((b) => b.text ?? "").join("").trim() || "No response.";

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    report_type: mode,
    content,
    tokens_used: data.usage?.output_tokens ?? null,
  });

  return NextResponse.json({ content });
}
