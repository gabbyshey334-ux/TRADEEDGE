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

const ACTIVE_CHALLENGE_PHASES: readonly ChallengePhase[] = [
  "Evaluation",
  "Phase 1",
  "Phase 2",
  "Funded",
];

export function isActiveChallenge(phase: ChallengePhase): boolean {
  return ACTIVE_CHALLENGE_PHASES.includes(phase);
}

export const PROP_FIRM_DATA = {
  FTMO: {
    challenges: [
      "10K Challenge",
      "25K Challenge",
      "50K Challenge",
      "100K Challenge",
    ],
    accountSizes: {
      "10K Challenge": 10000,
      "25K Challenge": 25000,
      "50K Challenge": 50000,
      "100K Challenge": 100000,
    },
    rules: {
      profit_target: 10,
      daily_drawdown: 5,
      max_drawdown: 10,
      min_trading_days: 10,
    },
  },
  "Apex Trader Funding": {
    challenges: ["25K Full", "50K Full", "100K Full", "150K Full"],
    accountSizes: {
      "25K Full": 25000,
      "50K Full": 50000,
      "100K Full": 100000,
      "150K Full": 150000,
    },
    rules: {
      profit_target: 6,
      daily_drawdown: 3,
      max_drawdown: 6,
      min_trading_days: 0,
    },
  },
  TopStep: {
    challenges: ["50K Express", "100K Express", "150K Express"],
    accountSizes: {
      "50K Express": 50000,
      "100K Express": 100000,
      "150K Express": 150000,
    },
    rules: {
      profit_target: 6,
      daily_drawdown: 2,
      max_drawdown: 4,
      min_trading_days: 0,
    },
  },
  "The Funded Trader": {
    challenges: [
      "25K Standard",
      "50K Standard",
      "100K Standard",
      "200K Standard",
    ],
    accountSizes: {
      "25K Standard": 25000,
      "50K Standard": 50000,
      "100K Standard": 100000,
      "200K Standard": 200000,
    },
    rules: {
      profit_target: 10,
      daily_drawdown: 5,
      max_drawdown: 10,
      min_trading_days: 5,
    },
  },
  "E8 Funding": {
    challenges: ["25K E8", "50K E8", "100K E8"],
    accountSizes: {
      "25K E8": 25000,
      "50K E8": 50000,
      "100K E8": 100000,
    },
    rules: {
      profit_target: 8,
      daily_drawdown: 5,
      max_drawdown: 8,
      min_trading_days: 0,
    },
  },
} as const;

export type PropFirmName = keyof typeof PROP_FIRM_DATA;
export const PROP_FIRM_NAMES = Object.keys(PROP_FIRM_DATA) as PropFirmName[];

export function decodeChallengeType(notes: string | null): string {
  if (!notes?.startsWith("challenge:")) return "Standard Challenge";
  const parts = notes.replace("challenge:", "").split("|");
  return parts[0]?.trim() || "Standard Challenge";
}

export function getMinTradingDays(firmName: string): number {
  const firm = PROP_FIRM_DATA[firmName as PropFirmName];
  return firm?.rules.min_trading_days ?? 0;
}
