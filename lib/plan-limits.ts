import type { Plan } from "./types";

export const PLAN_LIMITS: Record<
  Plan,
  {
    maxMonthlyTrades: number;
    maxMonthlyAiReports: number;
    congressionalTrades: boolean;
    propFirmTracker: boolean;
  }
> = {
  starter: {
    maxMonthlyTrades: 50,
    maxMonthlyAiReports: 0,
    congressionalTrades: false,
    propFirmTracker: false,
  },
  pro: {
    maxMonthlyTrades: Infinity,
    maxMonthlyAiReports: 10,
    congressionalTrades: true,
    propFirmTracker: true,
  },
  elite: {
    maxMonthlyTrades: Infinity,
    maxMonthlyAiReports: Infinity,
    congressionalTrades: true,
    propFirmTracker: true,
  },
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
  const id = priceId.trim();
  const starter = process.env.STRIPE_STARTER_PRICE_ID?.trim();
  const pro = process.env.STRIPE_PRO_PRICE_ID?.trim();
  const elite = process.env.STRIPE_ELITE_PRICE_ID?.trim();
  if (starter && id === starter) return "starter";
  if (pro && id === pro) return "pro";
  if (elite && id === elite) return "elite";
  return null;
}

export function parsePlan(value: unknown): Plan | null {
  if (value === "pro" || value === "elite" || value === "starter") {
    return value;
  }
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
