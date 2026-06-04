import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTradeSummary, calcStats, formatCurrency } from "@/lib/utils";
import type { Plan, Trade } from "@/lib/types";

export const runtime = "nodejs";

const REPORT_TYPE = "daily_coaching" as const;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are an elite trading coach delivering a daily performance briefing. Be direct, specific, and actionable. Do not be generic.

Return ONLY valid JSON with no markdown or backticks:
{
  "date": "May 27, 2026",
  "sessionRating": "A" | "B" | "C" | "D" | "F",
  "headline": "One powerful sentence summarizing the session",
  "keyMetrics": {
    "trades": 0,
    "pnl": "$0.00",
    "winRate": "0%",
    "bestTrade": "TICKER +$amount",
    "worstTrade": "TICKER -$amount"
  },
  "coachingInsight": "2-3 sentences of specific coaching",
  "tomorrowFocus": "One specific thing to focus on tomorrow",
  "mentalNote": "One sentence on the psychological pattern observed"
}`;

export interface DailyCoachingKeyMetrics {
  trades: number;
  pnl: string;
  winRate: string;
  bestTrade: string;
  worstTrade: string;
}

export interface DailyCoachingReport {
  date: string;
  sessionRating: "A" | "B" | "C" | "D" | "F";
  headline: string;
  keyMetrics: DailyCoachingKeyMetrics;
  coachingInsight: string;
  tomorrowFocus: string;
  mentalNote: string;
  cached_at?: string;
}

interface CachedDailyCoaching {
  sessionDateKey: string;
  report: DailyCoachingReport;
}

function tradeDay(trade: Trade): string {
  return trade.date.split("T")[0] ?? trade.date;
}

function todayKey(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatSessionDateKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function resolveSessionTrades(trades: Trade[]): {
  sessionTrades: Trade[];
  sessionDateKey: string | null;
} {
  if (!trades.length) {
    return { sessionTrades: [], sessionDateKey: null };
  }

  const today = todayKey();
  const todayTrades = trades.filter((t) => tradeDay(t) === today);
  if (todayTrades.length) {
    return { sessionTrades: todayTrades, sessionDateKey: today };
  }

  const mostRecentDay = tradeDay(trades[0]);
  return {
    sessionTrades: trades.filter((t) => tradeDay(t) === mostRecentDay),
    sessionDateKey: mostRecentDay,
  };
}

function buildUserMessage(sessionTrades: Trade[], sessionDateKey: string): string {
  const stats = calcStats(sessionTrades);
  const sessionDate = formatSessionDateKey(sessionDateKey);

  const best = [...sessionTrades].sort(
    (a, b) => Number(b.pnl) - Number(a.pnl)
  )[0];
  const worst = [...sessionTrades].sort(
    (a, b) => Number(a.pnl) - Number(b.pnl)
  )[0];

  return `Deliver a daily coaching briefing for this trading session on ${sessionDate}.

Session summary:
Total trades: ${stats.tradeCount}
Total P&L: ${formatCurrency(stats.totalPnl)}
Win rate: ${stats.winRate.toFixed(1)}%
Best trade: ${best.symbol} ${formatCurrency(Number(best.pnl))}
Worst trade: ${worst.symbol} ${formatCurrency(Number(worst.pnl))}

Trade log:
${buildTradeSummary(sessionTrades)}`;
}

function isSessionRating(
  value: unknown
): value is DailyCoachingReport["sessionRating"] {
  return (
    value === "A" ||
    value === "B" ||
    value === "C" ||
    value === "D" ||
    value === "F"
  );
}

function parseKeyMetrics(value: unknown): DailyCoachingKeyMetrics | null {
  if (!value || typeof value !== "object") return null;
  const m = value as Partial<DailyCoachingKeyMetrics>;
  if (
    typeof m.trades !== "number" ||
    typeof m.pnl !== "string" ||
    typeof m.winRate !== "string" ||
    typeof m.bestTrade !== "string" ||
    typeof m.worstTrade !== "string"
  ) {
    return null;
  }
  return {
    trades: m.trades,
    pnl: m.pnl,
    winRate: m.winRate,
    bestTrade: m.bestTrade,
    worstTrade: m.worstTrade,
  };
}

function parseReportPayload(text: string): DailyCoachingReport | null {
  const trimmed = text.trim();
  let parsed: Partial<DailyCoachingReport>;

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

  const keyMetrics = parseKeyMetrics(parsed.keyMetrics);

  if (
    typeof parsed.date !== "string" ||
    !isSessionRating(parsed.sessionRating) ||
    typeof parsed.headline !== "string" ||
    !keyMetrics ||
    typeof parsed.coachingInsight !== "string" ||
    typeof parsed.tomorrowFocus !== "string" ||
    typeof parsed.mentalNote !== "string"
  ) {
    return null;
  }

  return {
    date: parsed.date,
    sessionRating: parsed.sessionRating,
    headline: parsed.headline,
    keyMetrics,
    coachingInsight: parsed.coachingInsight,
    tomorrowFocus: parsed.tomorrowFocus,
    mentalNote: parsed.mentalNote,
  };
}

function parseCachedContent(content: string): CachedDailyCoaching | null {
  try {
    const parsed = JSON.parse(content) as {
      sessionDateKey?: string;
      report?: DailyCoachingReport;
    };
    if (
      typeof parsed.sessionDateKey === "string" &&
      parsed.report &&
      typeof parsed.report === "object"
    ) {
      const report = parseReportPayload(JSON.stringify(parsed.report));
      if (!report) return null;
      return { sessionDateKey: parsed.sessionDateKey, report };
    }
    return null;
  } catch {
    return null;
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
      { error: "Daily Coaching Reports are available on the Elite plan." },
      { status: 403 }
    );
  }

  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  const { data: tradesData, error: tradesError } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(200);

  if (tradesError) {
    return NextResponse.json({ error: tradesError.message }, { status: 500 });
  }

  const allTrades = (tradesData ?? []) as Trade[];
  const { sessionTrades, sessionDateKey } = resolveSessionTrades(allTrades);

  if (!sessionTrades.length || !sessionDateKey) {
    return NextResponse.json({ empty: true });
  }

  if (!refresh) {
    const { data: cachedRows } = await supabase
      .from("ai_usage")
      .select("content, created_at")
      .eq("user_id", user.id)
      .eq("report_type", REPORT_TYPE)
      .order("created_at", { ascending: false })
      .limit(10);

    for (const cached of cachedRows ?? []) {
      if (!cached.created_at) continue;
      const age = Date.now() - new Date(cached.created_at).getTime();
      if (age >= CACHE_TTL_MS) continue;

      const parsed = parseCachedContent(cached.content);
      if (parsed?.sessionDateKey === sessionDateKey) {
        const report = parseReportPayload(
          JSON.stringify(parsed.report)
        );
        if (report) {
          return NextResponse.json({
            ...report,
            cached_at: cached.created_at,
          });
        }
      }
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI provider is not configured." },
      { status: 500 }
    );
  }

  const userMessage = buildUserMessage(sessionTrades, sessionDateKey);

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
        model: "claude-sonnet-4-20250514",
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

  const report = parseReportPayload(rawContent);
  if (!report) {
    return NextResponse.json(
      { error: "Failed to parse daily coaching report response." },
      { status: 502 }
    );
  }

  const cachedAt = new Date().toISOString();

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    report_type: REPORT_TYPE,
    content: JSON.stringify({
      sessionDateKey,
      report,
    }),
    tokens_used: data.usage?.output_tokens ?? null,
  });

  return NextResponse.json({ ...report, cached_at: cachedAt });
}
