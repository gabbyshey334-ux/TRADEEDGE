export type Plan = "starter" | "pro" | "elite";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_sub_id: string | null;
  sub_status: string;
  trial_ends_at: string;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  date: string;
  market: "Forex" | "Futures";
  symbol: string;
  direction: "Long" | "Short";
  entry: number;
  exit_price: number | null;
  size: number | null;
  pnl: number;
  rr: number | null;
  emotion: string | null;
  setup: string | null;
  session: string | null;
  notes: string | null;
  screenshot_url: string | null;
  created_at: string;
}

export type NewTrade = Omit<Trade, "id" | "user_id" | "created_at">;

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_status: string;
  plan: Plan;
  current_period_end: string | null;
  updated_at: string;
}

export type AiCoachReportType = "session" | "psychology" | "edge";
export type AiReportType =
  | AiCoachReportType
  | "readiness_score"
  | "rule_break_prediction"
  | "daily_coaching";

export interface AiUsage {
  id: string;
  user_id: string;
  report_type: AiReportType;
  content: string;
  tokens_used: number | null;
  created_at: string;
}
