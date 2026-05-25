// Shared (non-server-action) types & constants for the Prop Firm Tracker.
// Server actions live in lib/actions/prop-firms.ts and re-use these types.

export type ChallengePhase =
  | "Evaluation"
  | "Phase 1"
  | "Phase 2"
  | "Funded"
  | "Failed"
  | "Passed";

export const CHALLENGE_PHASES: readonly ChallengePhase[] = [
  "Evaluation",
  "Phase 1",
  "Phase 2",
  "Funded",
  "Failed",
  "Passed",
] as const;

export interface PropFirmAccount {
  id: string;
  user_id: string;
  firm_name: string;
  account_size: number;
  challenge_phase: ChallengePhase;
  profit_target: number | null;
  max_drawdown: number | null;
  daily_drawdown: number | null;
  current_balance: number | null;
  start_date: string | null;
  notes: string | null;
  created_at: string;
}

export type NewPropFirmAccount = Omit<
  PropFirmAccount,
  "id" | "user_id" | "created_at"
>;

export function isChallengePhase(value: unknown): value is ChallengePhase {
  return (
    typeof value === "string" &&
    (CHALLENGE_PHASES as readonly string[]).includes(value)
  );
}
