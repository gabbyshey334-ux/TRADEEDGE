import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  aggregatePnl,
  calcStats,
  formatCurrency,
  groupBy,
} from "@/lib/utils";
import type { Plan, Trade } from "@/lib/types";

export const runtime = "nodejs";

const REPORT_TYPE = "readiness_score" as const;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a professional trading coach analyzing a trader's recent performance data. Based on the metrics provided, generate a Readiness Score from 0 to 100 that represents how prepared this trader is for their next session.

Return ONLY a valid JSON object in this exact format with no markdown, no backticks, no extra text:
{
  "score": 75,
  "grade": "B+",
  "summary": "One sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "warnings": ["warning 1", "warning 2"],
  "recommendation": "One actionable sentence for next session"
}

Grade scale:
90-100: A — Elite
80-89:  B — Strong
70-79:  C — Developing
60-69:  D — Needs Work
0-59:   F — Not Ready`;

export interface ReadinessScoreResult {
  score: number;
  grade: string;
  summary: string;
  strengths: string[];
  warnings: string[];
  recommendation: string;
  cached_at: string;
}

function topByFrequency(trades: Trade[], field: "emotion" | "setup" | "session"): string {
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

function buildUserMessage(trades: Trade[]): string {
  const stats = calcStats(trades);
  const avgPnl = trades.length ? stats.totalPnl / trades.length : 0;
  const profitFactor = Number.isFinite(stats.profitFactor)
    ? stats.profitFactor.toFixed(2)
    : "∞";

  const sorted = [...trades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recentTrend =
    sorted.length === 0
      ? "No recent trades"
      : sorted
          .slice(0, 5)
          .map((t) => formatCurrency(Number(t.pnl)))
          .join(", ");

  return `Analyze this trader's last 30 trades:
Total trades: ${stats.tradeCount}
Win rate: ${stats.winRate.toFixed(1)}%
Average R:R: ${stats.avgRR.toFixed(2)}
Profit factor: ${profitFactor}
Average P&L: ${formatCurrency(avgPnl)}
Most common emotion: ${topByFrequency(trades, "emotion")}
Most profitable setup: ${topByFrequency(trades, "setup")}
Most profitable session: ${topByFrequency(trades, "session")}
Recent trend (last 5 trades P&L): ${recentTrend}`;
}

function parseScorePayload(text: string): ReadinessScoreResult | null {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed) as Partial<ReadinessScoreResult>;
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.grade !== "string" ||
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.warnings) ||
      typeof parsed.recommendation !== "string"
    ) {
      return null;
    }
    return {
      score: parsed.score,
      grade: parsed.grade,
      summary: parsed.summary,
      strengths: parsed.strengths.map(String),
      warnings: parsed.warnings.map(String),
      recommendation: parsed.recommendation,
      cached_at: new Date().toISOString(),
    };
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return parseScorePayload(match[0]);
    } catch {
      return null;
    }
  }
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
      { error: "AI Readiness Score is available on the Elite plan." },
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
    report_type: REPORT_TYPE,
    content: JSON.stringify({
      score: result.score,
      grade: result.grade,
      summary: result.summary,
      strengths: result.strengths,
      warnings: result.warnings,
      recommendation: result.recommendation,
    }),
    tokens_used: data.usage?.output_tokens ?? null,
  });

  return NextResponse.json({ ...result, cached_at: cachedAt });
}
