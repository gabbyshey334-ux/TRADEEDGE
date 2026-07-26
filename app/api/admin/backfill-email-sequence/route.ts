import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { sendResendEmail } from "@/lib/emails/resend";
import {
  day1WelcomeEmail,
  day3NudgeEmail,
  day7HalfwayEmail,
  day12LastChanceEmail,
  day14LastDayEmail,
  day15WinBackEmail,
  type EmailContent,
} from "@/lib/emails/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BATCH_SIZE = 125;
const SEND_DELAY_MS = 400;

type SentColumn =
  | "day_1_sent_at"
  | "day_3_sent_at"
  | "day_7_sent_at"
  | "day_12_sent_at"
  | "day_14_sent_at"
  | "day_15_sent_at";

type SequenceRow = {
  id: string;
  user_id: string;
  email: string;
  day_1_sent_at: string | null;
  day_3_sent_at: string | null;
  day_7_sent_at: string | null;
  day_12_sent_at: string | null;
  day_14_sent_at: string | null;
  day_15_sent_at: string | null;
  created_at: string;
};

const STAGES: Array<{
  days: number;
  col: SentColumn;
  build: (firstName: string, userId: string) => EmailContent;
}> = [
  { days: 1, col: "day_1_sent_at", build: day1WelcomeEmail },
  { days: 3, col: "day_3_sent_at", build: day3NudgeEmail },
  { days: 7, col: "day_7_sent_at", build: day7HalfwayEmail },
  { days: 12, col: "day_12_sent_at", build: day12LastChanceEmail },
  { days: 14, col: "day_14_sent_at", build: day14LastDayEmail },
  { days: 15, col: "day_15_sent_at", build: day15WinBackEmail },
];

function firstNameFrom(fullName: string | null | undefined): string {
  const part = fullName?.trim().split(/\s+/)[0];
  return part || "Trader";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_BACKFILL_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let batchSize = DEFAULT_BATCH_SIZE;
  try {
    const body = (await request.json()) as { batchSize?: unknown };
    if (typeof body.batchSize === "number" && Number.isFinite(body.batchSize)) {
      batchSize = Math.max(1, Math.floor(body.batchSize));
    }
  } catch {
    // No/invalid body — use default batch size
  }

  const service = getServiceClient();
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await service
    .from("email_sequence")
    .select(
      "id, user_id, email, day_1_sent_at, day_3_sent_at, day_7_sent_at, day_12_sent_at, day_14_sent_at, day_15_sent_at, created_at"
    )
    .eq("unsubscribed", false)
    .is("day_15_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error || !rows) {
    return NextResponse.json(
      {
        processed: 0,
        emailed: 0,
        backfilledOnly: 0,
        remaining: 0,
        error: error?.message ?? "No rows",
      },
      { status: 200 }
    );
  }

  let processed = 0;
  let emailed = 0;
  let backfilledOnly = 0;
  const nameCache = new Map<string, string>();

  for (const row of rows as SequenceRow[]) {
    processed += 1;

    const daysSinceSignup =
      (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24);

    const eligible = STAGES.filter(
      (stage) => daysSinceSignup >= stage.days && row[stage.col] == null
    );

    if (eligible.length === 0) continue;

    const toEmail = eligible[eligible.length - 1];
    const silentStages = eligible.slice(0, -1);

    try {
      let firstName = nameCache.get(row.user_id);
      if (!firstName) {
        const { data: profile } = await service
          .from("profiles")
          .select("full_name")
          .eq("id", row.user_id)
          .maybeSingle();
        firstName = firstNameFrom(profile?.full_name);
        nameCache.set(row.user_id, firstName);
      }

      const content = toEmail.build(firstName, row.user_id);
      const ok = await sendResendEmail({
        to: row.email,
        subject: content.subject,
        html: content.html,
      });

      if (!ok) {
        await sleep(SEND_DELAY_MS);
        continue;
      }

      const patch: Partial<Record<SentColumn, string>> = {};
      for (const stage of eligible) {
        patch[stage.col] = nowIso;
      }

      const { error: updateError } = await service
        .from("email_sequence")
        .update(patch)
        .eq("id", row.id);

      if (!updateError) {
        emailed += 1;
        if (silentStages.length > 0) backfilledOnly += 1;
      }
    } catch {
      // Continue the batch
    }

    await sleep(SEND_DELAY_MS);
  }

  const { count: remainingCount } = await service
    .from("email_sequence")
    .select("id", { count: "exact", head: true })
    .eq("unsubscribed", false)
    .is("day_15_sent_at", null);

  return NextResponse.json({
    processed,
    emailed,
    backfilledOnly,
    remaining: remainingCount ?? 0,
  });
}
