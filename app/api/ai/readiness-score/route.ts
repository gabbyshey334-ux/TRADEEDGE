import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aggregatePnl, calcStats, groupBy } from "@/lib/utils";
import type { Plan, Trade } from "@/lib/types";

export const runtime = "nodejs";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are an elite prop firm trading coach. Generate a Readiness Score from 0 to 100 specifically assessing whether this trader is ready for the exact challenge rules provided. Every bullet must reference journal stats or a specific challenge rule.

Return ONLY valid JSON:
{
  "score": 78,
  "grade": "C+",
  "summary": "2-3 sentences on readiness for this specific firm/challenge — balanced and direct",
  "strengths": [
    "Excellent 70% win rate shows disciplined trade selection",
    "Profit factor of 1.89 indicates positive expectancy",
    "Daily drawdown avg stays well under the 5% firm limit"
  ],
  "watch": [
    "RR of 1:1.5 is suboptimal for this challenge's profit target",
    "Large single loss suggests inconsistent position sizing",
    "Revenge trading pattern after losses increases rule-break risk"
  ],
  "ruleAnalysis": [
    {
      "rule": "Daily Loss Limit 5%",
      "traderStat": "Avg daily loss 1.8%",
      "assessment": "SAFE",
      "note": "Specific insight about this rule"
    }
  ],
  "recommendation": "One specific coaching action tied to their journal patterns and this challenge"
}

Provide exactly 3 strengths and 3 watch items. For ruleAnalysis assessment use exactly one of: SAFE, AT RISK, DANGER. Include one ruleAnalysis row per challenge rule (profit target, daily loss, max drawdown, min trading days).`;

export interface RuleAnalysisItem {
  rule: string;
  traderStat: string;
  assessment: "SAFE" | "AT RISK" | "DANGER";
  note: string;
}

export interface ReadinessScoreResult {
  score: number;
  grade: string;
  summary: string;
  strengths: string[];
  watch: string[];
  ruleAnalysis: RuleAnalysisItem[];
  recommendation: string;
  cached_at?: string;
}

interface ReadinessScoreRequest {
  accountId: string;
  firmName: string;
  challengeType: string;
  profitTarget: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  minTradingDays: number;
  accountSize: number;
  refresh?: boolean;
}

function tradeDay(trade: Trade): string {
  return trade.date.split("T")[0] ?? trade.date;
}

function buildReportType(accountId: string): string {
  return `readiness_score_${accountId}`;
}

function topByFrequency(
  trades: Trade[],
  field: "emotion" | "session"
): string {
  const groups = groupBy(trades, (t) => t[field] ?? null);
  const entries = Object.entries(groups);
  if (!entries.length) return "N/A";

  if (field === "emotion") {
    return entries.sort((a, b) => b[1].length - a[1].length)[0][0];
  }

  return entries
    .map(([key, list]) => ({ key, pnl: aggregatePnl(list) }))
    .sort((a, b) => b.pnl - a.pnl)[0].key;
}

function computeDailyMetrics(trades: Trade[], accountSize: number) {
  const byDay = groupBy(trades, (t) => tradeDay(t));
  const dailyPnls = Object.values(byDay).map((list) => aggregatePnl(list));

  if (!dailyPnls.length || accountSize <= 0) {
    return {
      avgDailyPnl: 0,
      avgDailyDrawdown: 0,
      worstDayLoss: 0,
    };
  }

  const avgDailyPnl =
    dailyPnls.reduce((sum, pnl) => sum + pnl, 0) / dailyPnls.length;

  const dailyLossPcts = dailyPnls.map((pnl) =>
    pnl < 0 ? (Math.abs(pnl) / accountSize) * 100 : 0
  );
  const avgDailyDrawdown =
    dailyLossPcts.reduce((sum, pct) => sum + pct, 0) / dailyLossPcts.length;

  const losingDayPcts = dailyPnls
    .filter((pnl) => pnl < 0)
    .map((pnl) => (Math.abs(pnl) / accountSize) * 100);
  const worstDayLoss = losingDayPcts.length
    ? Math.max(...losingDayPcts)
    : 0;

  return { avgDailyPnl, avgDailyDrawdown, worstDayLoss };
}

function estimateDaysToTarget(
  avgDailyPnl: number,
  accountSize: number,
  profitTarget: number
): string {
  if (avgDailyPnl <= 0) return "Unlikely at current pace";
  const targetAmount = accountSize * (profitTarget / 100);
  return String(Math.ceil(targetAmount / avgDailyPnl));
}

function buildUserMessage(
  trades: Trade[],
  body: ReadinessScoreRequest
): string {
  const stats = calcStats(trades);
  const {
    firmName,
    challengeType,
    profitTarget,
    dailyDrawdown,
    maxDrawdown,
    minTradingDays,
    accountSize,
  } = body;

  const profitTargetAmount = accountSize * (profitTarget / 100);
  const dailyLossLimit = accountSize * (dailyDrawdown / 100);
  const maxDrawdownAmount = accountSize * (maxDrawdown / 100);
  const { avgDailyPnl, avgDailyDrawdown, worstDayLoss } = computeDailyMetrics(
    trades,
    accountSize
  );
  const estimatedDays = estimateDaysToTarget(
    avgDailyPnl,
    accountSize,
    profitTarget
  );

  return `You are analyzing a trader's readiness for a specific prop firm challenge.

CHALLENGE DETAILS:
Firm: ${firmName}
Challenge: ${challengeType}
Account Size: $${accountSize.toLocaleString()}
Profit Target: ${profitTarget}% ($${profitTargetAmount.toLocaleString()})
Daily Loss Limit: ${dailyDrawdown}% ($${dailyLossLimit.toLocaleString()})
Max Drawdown: ${maxDrawdown}% ($${maxDrawdownAmount.toLocaleString()})
Minimum Trading Days: ${minTradingDays === 0 ? "None" : `${minTradingDays} days`}

TRADER'S RECENT PERFORMANCE (last 30 trades):
Total trades: ${stats.tradeCount}
Win rate: ${stats.winRate.toFixed(1)}%
Average R:R: ${stats.avgRR.toFixed(2)}
Average daily P&L: $${avgDailyPnl.toFixed(2)}
Average daily drawdown: ${avgDailyDrawdown.toFixed(2)}%
Worst single day loss: ${worstDayLoss.toFixed(2)}%
Most common emotion: ${topByFrequency(trades, "emotion")}
Best performing session: ${topByFrequency(trades, "session")}
Estimated days to hit profit target at current pace: ${estimatedDays}

Generate a Readiness Score specifically for this ${firmName} ${challengeType} challenge.`;
}

function normalizeAssessment(value: string): RuleAnalysisItem["assessment"] {
  const upper = value.toUpperCase().trim();
  if (upper.includes("DANGER")) return "DANGER";
  if (upper.includes("RISK")) return "AT RISK";
  return "SAFE";
}

function parseRuleAnalysis(value: unknown): RuleAnalysisItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<RuleAnalysisItem>;
  if (
    typeof item.rule !== "string" ||
    typeof item.traderStat !== "string" ||
    typeof item.assessment !== "string" ||
    typeof item.note !== "string"
  ) {
    return null;
  }
  return {
    rule: item.rule,
    traderStat: item.traderStat,
    assessment: normalizeAssessment(item.assessment),
    note: item.note,
  };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

function deriveStrengthsAndWatch(
  parsed: Partial<
    ReadinessScoreResult & {
      biggestRisk?: string;
      estimatedPassDays?: number;
    }
  >,
  ruleAnalysis: RuleAnalysisItem[]
): { strengths: string[]; watch: string[] } {
  let strengths = parseStringArray(parsed.strengths);
  let watch = parseStringArray(parsed.watch);

  if (!strengths.length && ruleAnalysis.length) {
    strengths = ruleAnalysis
      .filter((item) => item.assessment === "SAFE")
      .map((item) => item.note || `${item.rule}: ${item.traderStat}`);
  }

  if (!watch.length && ruleAnalysis.length) {
    watch = ruleAnalysis
      .filter((item) => item.assessment !== "SAFE")
      .map((item) => item.note || `${item.rule}: ${item.traderStat}`);
  }

  if (!watch.length && typeof parsed.biggestRisk === "string") {
    watch = [parsed.biggestRisk];
  }

  if (!strengths.length) {
    strengths = ["Journal patterns show areas of consistency for this challenge."];
  }

  if (!watch.length) {
    watch = ["Monitor daily loss and max drawdown limits closely."];
  }

  return { strengths: strengths.slice(0, 4), watch: watch.slice(0, 4) };
}

function parseScorePayload(text: string): ReadinessScoreResult | null {
  const trimmed = text.trim();
  let parsed: Partial<ReadinessScoreResult> & {
    ruleAnalysis?: unknown[];
    biggestRisk?: string;
    estimatedPassDays?: number;
  };

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  if (
    typeof parsed.score !== "number" ||
    typeof parsed.grade !== "string" ||
    typeof parsed.summary !== "string" ||
    typeof parsed.recommendation !== "string"
  ) {
    return null;
  }

  const ruleAnalysis = Array.isArray(parsed.ruleAnalysis)
    ? parsed.ruleAnalysis
        .map(parseRuleAnalysis)
        .filter((item): item is RuleAnalysisItem => item !== null)
    : [];

  const { strengths, watch } = deriveStrengthsAndWatch(parsed, ruleAnalysis);

  return {
    score: parsed.score,
    grade: parsed.grade,
    summary: parsed.summary,
    strengths,
    watch,
    ruleAnalysis,
    recommendation: parsed.recommendation,
  };
}

function parseRequestBody(body: unknown): ReadinessScoreRequest | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Partial<ReadinessScoreRequest>;
  if (
    typeof input.accountId !== "string" ||
    !input.accountId.trim() ||
    typeof input.firmName !== "string" ||
    !input.firmName.trim() ||
    typeof input.challengeType !== "string" ||
    !input.challengeType.trim() ||
    typeof input.profitTarget !== "number" ||
    typeof input.dailyDrawdown !== "number" ||
    typeof input.maxDrawdown !== "number" ||
    typeof input.minTradingDays !== "number" ||
    typeof input.accountSize !== "number"
  ) {
    return null;
  }
  return {
    accountId: input.accountId.trim(),
    firmName: input.firmName.trim(),
    challengeType: input.challengeType.trim(),
    profitTarget: input.profitTarget,
    dailyDrawdown: input.dailyDrawdown,
    maxDrawdown: input.maxDrawdown,
    minTradingDays: input.minTradingDays,
    accountSize: input.accountSize,
    refresh: input.refresh === true,
  };
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

  if (plan !== "elite") {
    return NextResponse.json(
      { error: "AI Readiness Score is available on the Elite plan." },
      { status: 403 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const body = parseRequestBody(rawBody);
  if (!body) {
    return NextResponse.json(
      { error: "Missing or invalid firm/challenge fields." },
      { status: 400 }
    );
  }

  const reportType = buildReportType(body.accountId);

  const { data: ownedAccount } = await supabase
    .from("prop_firm_accounts")
    .select("id")
    .eq("id", body.accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownedAccount) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (!body.refresh) {
    const { data: cached } = await supabase
      .from("ai_usage")
      .select("content, created_at")
      .eq("user_id", user.id)
      .eq("report_type", reportType)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.created_at) {
      const age = Date.now() - new Date(cached.created_at).getTime();
      if (age < CACHE_TTL_MS) {
        const parsed = parseScorePayload(cached.content);
        if (parsed) {
          return NextResponse.json({
            ...parsed,
            cached_at: cached.created_at,
          });
        }
      }
    }
  }

  const { data: tradesData, error: tradesError } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(30);

  if (tradesError) {
    return NextResponse.json({ error: tradesError.message }, { status: 500 });
  }

  const trades = (tradesData ?? []) as Trade[];

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI provider is not configured." },
      { status: 500 }
    );
  }

  const userMessage = buildUserMessage(trades, body);

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
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
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
      {
        error: `Anthropic error: ${response.status} ${text || response.statusText}`,
      },
      { status: 502 }
    );
  }

  const data: {
    content?: Array<{ text?: string }>;
    usage?: { output_tokens?: number };
  } = await response.json();

  const rawContent =
    data.content?.map((b) => b.text ?? "").join("").trim() ?? "";

  const result = parseScorePayload(rawContent);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to parse AI readiness score response." },
      { status: 502 }
    );
  }

  const cachedAt = new Date().toISOString();

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    report_type: reportType,
    content: JSON.stringify(result),
    tokens_used: data.usage?.output_tokens ?? null,
  });

  return NextResponse.json({ ...result, cached_at: cachedAt });
}
