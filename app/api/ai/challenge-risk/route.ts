import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aggregatePnl, groupBy } from "@/lib/utils";
import type { Plan, Trade } from "@/lib/types";

export const runtime = "nodejs";

export interface ChallengeRiskResult {
  riskLevel: "low" | "medium" | "high";
  warning: string | null;
  dailyLimitUsed: number;
  maxDrawdownUsed: number;
  todayPnl: number;
  revengeTradingRate: number;
}

interface ChallengeRiskRequest {
  accountId: string;
  firmName: string;
  challengeType: string;
  challengePhase: string;
  dailyDrawdown: number;
  maxDrawdown: number;
  profitTarget: number;
  minTradingDays: number;
  accountSize: number;
  currentBalance: number;
  startDate: string | null;
}

function todayKey(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function tradeDay(trade: Trade): string {
  return trade.date.split("T")[0] ?? trade.date;
}

function tradeTimestamp(trade: Trade): number {
  const value = trade.created_at || trade.date;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function computeRevengeTradingRate(trades: Trade[]): number {
  const sorted = [...trades].sort(
    (a, b) => tradeTimestamp(a) - tradeTimestamp(b)
  );
  const losingTrades = sorted.filter((t) => Number(t.pnl) < 0);
  if (!losingTrades.length) return 0;

  let revengeCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    const trade = sorted[i];
    if (Number(trade.pnl) >= 0) continue;

    const lossTime = tradeTimestamp(trade);
    for (let j = i + 1; j < sorted.length; j++) {
      const nextTime = tradeTimestamp(sorted[j]);
      const delta = nextTime - lossTime;
      if (delta <= 0) continue;
      if (delta <= 2 * 60 * 60 * 1000) {
        revengeCount++;
        break;
      }
      break;
    }
  }

  return revengeCount / losingTrades.length;
}

function computeTradingDays(trades: Trade[]): number {
  if (!trades.length) return 0;
  return Object.keys(groupBy(trades, (t) => tradeDay(t))).length;
}

function computeDaysSinceStart(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((nowUtc - startUtc) / 86_400_000));
}

function determineRisk(input: {
  firmName: string;
  challengeType: string;
  dailyDrawdown: number;
  maxDrawdown: number;
  profitTarget: number;
  minTradingDays: number;
  dailyLimitUsed: number;
  maxDrawdownUsed: number;
  revengeTradingRate: number;
  tradingDaysLogged: number;
  daysSinceStart: number | null;
}): Pick<ChallengeRiskResult, "riskLevel" | "warning"> {
  const {
    firmName,
    challengeType,
    dailyDrawdown,
    maxDrawdown,
    minTradingDays,
    dailyLimitUsed,
    maxDrawdownUsed,
    revengeTradingRate,
    tradingDaysLogged,
    daysSinceStart,
  } = input;

  const dailyUsed = Math.round(dailyLimitUsed);
  const maxUsed = Math.round(maxDrawdownUsed);
  const revengePct = Math.round(revengeTradingRate * 100);

  if (dailyLimitUsed >= 80 && revengeTradingRate > 0.3) {
    return {
      riskLevel: "high",
      warning: `You are at ${dailyUsed}% of your ${dailyDrawdown}% daily loss limit on ${firmName} ${challengeType} and your journal shows revenge trading ${revengePct}% of the time after losses. Stop trading for today.`,
    };
  }

  if (dailyLimitUsed >= 70 && revengeTradingRate > 0.25) {
    return {
      riskLevel: "high",
      warning: `At ${dailyUsed}% of your ${dailyDrawdown}% daily loss limit with a ${revengePct}% revenge-trading rate — this pattern historically leads to rule breaks on ${firmName} challenges.`,
    };
  }

  if (maxDrawdownUsed >= 85) {
    return {
      riskLevel: "high",
      warning: `Your account is at ${maxUsed}% of the ${maxDrawdown}% max drawdown limit on ${firmName} ${challengeType}. One more losing session ends this challenge.`,
    };
  }

  if (dailyLimitUsed >= 60) {
    return {
      riskLevel: "medium",
      warning: `You have used ${dailyUsed}% of your ${dailyDrawdown}% daily loss limit on ${firmName} ${challengeType}. Proceed with caution.`,
    };
  }

  if (maxDrawdownUsed >= 70) {
    return {
      riskLevel: "medium",
      warning: `Your account is at ${maxUsed}% of the ${maxDrawdown}% maximum drawdown limit. One bad session ends this ${firmName} challenge.`,
    };
  }

  if (dailyLimitUsed >= 40 && revengeTradingRate > 0.5) {
    return {
      riskLevel: "medium",
      warning: `Your historical revenge trading rate is ${revengePct}%. With ${dailyUsed}% of your ${dailyDrawdown}% daily limit used, walk away if this trade loses.`,
    };
  }

  if (
    minTradingDays > 0 &&
    daysSinceStart !== null &&
    daysSinceStart >= minTradingDays &&
    tradingDaysLogged < minTradingDays
  ) {
    return {
      riskLevel: "medium",
      warning: `${firmName} ${challengeType} requires ${minTradingDays} minimum trading days — you have logged trades on ${tradingDaysLogged} day${tradingDaysLogged === 1 ? "" : "s"} so far.`,
    };
  }

  return { riskLevel: "low", warning: null };
}

function parseRequestBody(body: unknown): ChallengeRiskRequest | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Partial<ChallengeRiskRequest>;
  if (
    typeof input.accountId !== "string" ||
    !input.accountId.trim() ||
    typeof input.firmName !== "string" ||
    !input.firmName.trim() ||
    typeof input.challengeType !== "string" ||
    typeof input.challengePhase !== "string" ||
    typeof input.dailyDrawdown !== "number" ||
    typeof input.maxDrawdown !== "number" ||
    typeof input.profitTarget !== "number" ||
    typeof input.minTradingDays !== "number" ||
    typeof input.accountSize !== "number" ||
    typeof input.currentBalance !== "number"
  ) {
    return null;
  }
  return {
    accountId: input.accountId.trim(),
    firmName: input.firmName.trim(),
    challengeType: input.challengeType.trim() || "Standard Challenge",
    challengePhase: input.challengePhase.trim(),
    dailyDrawdown: input.dailyDrawdown,
    maxDrawdown: input.maxDrawdown,
    profitTarget: input.profitTarget,
    minTradingDays: input.minTradingDays,
    accountSize: input.accountSize,
    currentBalance: input.currentBalance,
    startDate:
      typeof input.startDate === "string" ? input.startDate : null,
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
      { error: "Rule Break Prediction is available on the Elite plan." },
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
      { error: "Missing or invalid challenge fields." },
      { status: 400 }
    );
  }

  if (body.accountSize <= 0) {
    return NextResponse.json(
      { error: "Account size must be greater than zero." },
      { status: 400 }
    );
  }

  const { data: account } = await supabase
    .from("prop_firm_accounts")
    .select("id")
    .eq("id", body.accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const { data: tradesData, error: tradesError } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(500);

  if (tradesError) {
    return NextResponse.json({ error: tradesError.message }, { status: 500 });
  }

  const trades = (tradesData ?? []) as Trade[];
  const today = todayKey();
  const todayTrades = trades.filter((t) => tradeDay(t) === today);
  const todayPnl = aggregatePnl(todayTrades);

  const todayDrawdown = Math.abs((todayPnl / body.accountSize) * 100);
  const dailyLimitUsed =
    body.dailyDrawdown > 0 ? (todayDrawdown / body.dailyDrawdown) * 100 : 0;

  const currentDrawdownPct =
    body.currentBalance < body.accountSize
      ? Math.abs(
          ((body.currentBalance - body.accountSize) / body.accountSize) * 100
        )
      : 0;
  const maxDrawdownUsed =
    body.maxDrawdown > 0
      ? (currentDrawdownPct / body.maxDrawdown) * 100
      : 0;

  const revengeTradingRate = computeRevengeTradingRate(trades);
  const tradingDaysLogged = computeTradingDays(trades);
  const daysSinceStart = computeDaysSinceStart(body.startDate);

  const { riskLevel, warning } = determineRisk({
    firmName: body.firmName,
    challengeType: body.challengeType,
    dailyDrawdown: body.dailyDrawdown,
    maxDrawdown: body.maxDrawdown,
    profitTarget: body.profitTarget,
    minTradingDays: body.minTradingDays,
    dailyLimitUsed,
    maxDrawdownUsed,
    revengeTradingRate,
    tradingDaysLogged,
    daysSinceStart,
  });

  return NextResponse.json({
    riskLevel,
    warning,
    dailyLimitUsed,
    maxDrawdownUsed,
    todayPnl,
    revengeTradingRate,
  } satisfies ChallengeRiskResult);
}
