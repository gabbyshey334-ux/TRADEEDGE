import type { Plan } from "./types";

export const PLAN_LIMITS: Record<
  Plan,
  { maxMonthlyTrades: number; maxMonthlyAiReports: number }
> = {
  starter: { maxMonthlyTrades: 50,       maxMonthlyAiReports: 0        },
  pro:     { maxMonthlyTrades: Infinity, maxMonthlyAiReports: 10       },
  elite:   { maxMonthlyTrades: Infinity, maxMonthlyAiReports: Infinity },
};

export function canAddTrade(plan: Plan, tradesThisMonth: number): boolean {
  return tradesThisMonth < PLAN_LIMITS[plan].maxMonthlyTrades;
}

export function canRunAiReport(plan: Plan, reportsThisMonth: number): boolean {
  return reportsThisMonth < PLAN_LIMITS[plan].maxMonthlyAiReports;
}

export function remainingAiReports(
  plan: Plan,
  reportsThisMonth: number
): number | "unlimited" {
  const max = PLAN_LIMITS[plan].maxMonthlyAiReports;
  if (max === Infinity) return "unlimited";
  return Math.max(0, max - reportsThisMonth);
}

/** Map a Stripe Price ID to its internal plan tier. Returns null if no match. */
export function priceIdToPlan(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_ELITE_PRICE_ID) return "elite";
  return null;
}

/** Map a plan tier to its Stripe Price ID. */
export function planToPriceId(plan: Plan): string | undefined {
  switch (plan) {
    case "starter":
      return process.env.STRIPE_STARTER_PRICE_ID;
    case "pro":
      return process.env.STRIPE_PRO_PRICE_ID;
    case "elite":
      return process.env.STRIPE_ELITE_PRICE_ID;
  }
}
