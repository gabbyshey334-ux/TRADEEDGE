import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aggregatePnl, groupBy } from "@/lib/utils";
import type { Plan, Trade } from "@/lib/types";

export const runtime = "nodejs";

const REPORT_TYPE = "rule_break_prediction" as const;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a trading psychology expert analyzing behavioral patterns in a trader's history to predict when they are likely to break their trading rules.

Return ONLY valid JSON with no markdown or backticks:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": 0-100,
  "patterns": [
    {
      "trigger": "What causes the rule break",
      "behavior": "What the trader does wrong",
      "frequency": "How often this happens"
    }
  ],
  "warning": "One sentence current risk warning",
  "prevention": "One actionable prevention tip"
}`;

export interface RuleBreakPattern {
  trigger: string;
  behavior: string;
  frequency: string;
}

export interface RuleBreakPredictionResult {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  patterns: RuleBreakPattern[];
  warning: string;
  prevention: string;
  cached_at: string;
}

function tradeDay(trade: Trade): string {
  return trade.date.split("T")[0] ?? trade.date;
}

function buildEmotionBreakdown(trades: Trade[]): string {
  const groups = groupBy(trades, (t) => t.emotion ?? "Unknown");
  const parts = Object.entries(groups).map(
    ([emotion, list]) => `${emotion}: ${list.length}`
  );
  return parts.length ? parts.join(", ") : "N/A";
}

function calcWinRateAfterLoss(trades: Trade[]): number {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let afterLoss = 0;
  let winsAfterLoss = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (Number(sorted[i - 1].pnl) < 0) {
      afterLoss++;
      if (Number(sorted[i].pnl) > 0) winsAfterLoss++;
    }
  }
  return afterLoss ? (winsAfterLoss / afterLoss) * 100 : 0;
}

function calcAvgTradesPerDay(trades: Trade[]): number {
  if (!trades.length) return 0;
  const byDay = groupBy(trades, (t) => tradeDay(t));
  return trades.length / Object.keys(byDay).length;
}

function calcMaxLosingStreak(trades: Trade[]): number {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let max = 0;
  let current = 0;
  for (const t of sorted) {
    if (Number(t.pnl) < 0) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

function calcWorstEmotion(trades: Trade[]): string {
  const losers = trades.filter((t) => Number(t.pnl) < 0);
  if (!losers.length) return "N/A";
  const groups = groupBy(losers, (t) => t.emotion ?? "Unknown");
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)[0][0];
}

function calcOvertradingRate(trades: Trade[]): string {
  if (!trades.length) return "0%";
  const byDay = groupBy(trades, (t) => tradeDay(t));
  const lossDays = new Set<string>();
  for (const [day, list] of Object.entries(byDay)) {
    if (aggregatePnl(list) < 0) lossDays.add(day);
  }
  const tradesOnLossDays = trades.filter((t) => lossDays.has(tradeDay(t))).length;
  return `${((tradesOnLossDays / trades.length) * 100).toFixed(1)}%`;
}

function calcWorstSession(trades: Trade[]): string {
  const losers = trades.filter((t) => Number(t.pnl) < 0);
  if (!losers.length) return "N/A";
  const groups = groupBy(losers, (t) => t.session ?? "Unknown");
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)[0][0];
}

function buildUserMessage(trades: Trade[]): string {
  return `Analyze these behavioral patterns:
Total trades analyzed: ${trades.length}
Emotion breakdown: ${buildEmotionBreakdown(trades)}
Win rate after losses: ${calcWinRateAfterLoss(trades).toFixed(1)}%
Average trades per day: ${calcAvgTradesPerDay(trades).toFixed(1)}
Largest losing streak: ${calcMaxLosingStreak(trades)}
Most common losing emotion: ${calcWorstEmotion(trades)}
Overtrading pattern (trades on loss days): ${calcOvertradingRate(trades)}
Session with most losses: ${calcWorstSession(trades)}`;
}

function isRiskLevel(value: unknown): value is RuleBreakPredictionResult["riskLevel"] {
  return value === "low" || value === "medium" || value === "high";
}

function parsePattern(value: unknown): RuleBreakPattern | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Partial<RuleBreakPattern>;
  if (
    typeof p.trigger !== "string" ||
    typeof p.behavior !== "string" ||
    typeof p.frequency !== "string"
  ) {
    return null;
  }
  return { trigger: p.trigger, behavior: p.behavior, frequency: p.frequency };
}

function parsePredictionPayload(text: string): RuleBreakPredictionResult | null {
  const trimmed = text.trim();
  let parsed: Partial<RuleBreakPredictionResult> & {
    patterns?: unknown[];
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
    !isRiskLevel(parsed.riskLevel) ||
    typeof parsed.riskScore !== "number" ||
    !Array.isArray(parsed.patterns) ||
    typeof parsed.warning !== "string" ||
    typeof parsed.prevention !== "string"
  ) {
    return null;
  }

  const patterns = parsed.patterns
    .map(parsePattern)
    .filter((p): p is RuleBreakPattern => p !== null);

  if (!patterns.length) return null;

  return {
    riskLevel: parsed.riskLevel,
    riskScore: parsed.riskScore,
    patterns,
    warning: parsed.warning,
    prevention: parsed.prevention,
    cached_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
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
      { error: "Rule Break Prediction is available on the Elite plan." },
      { status: 403 }
    );
  }

  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  if (!refresh) {
    const { data: cached } = await supabase
      .from("ai_usage")
      .select("content, created_at")
      .eq("user_id", user.id)
      .eq("report_type", REPORT_TYPE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.created_at) {
      const age = Date.now() - new Date(cached.created_at).getTime();
      if (age < CACHE_TTL_MS) {
        const parsed = parsePredictionPayload(cached.content);
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
    .limit(50);

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

  const userMessage = buildUserMessage(trades);

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
        max_tokens: 500,
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

  const result = parsePredictionPayload(rawContent);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to parse rule break prediction response." },
      { status: 502 }
    );
  }

  const cachedAt = new Date().toISOString();

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    report_type: REPORT_TYPE,
    content: JSON.stringify({
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      patterns: result.patterns,
      warning: result.warning,
      prevention: result.prevention,
    }),
    tokens_used: data.usage?.output_tokens ?? null,
  });

  return NextResponse.json({ ...result, cached_at: cachedAt });
}
