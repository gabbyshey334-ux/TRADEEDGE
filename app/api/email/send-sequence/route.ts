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

const MAX_EMAILS_PER_RUN = 50;

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

type DueEmail = {
  row: SequenceRow;
  column:
    | "day_1_sent_at"
    | "day_3_sent_at"
    | "day_7_sent_at"
    | "day_12_sent_at"
    | "day_14_sent_at"
    | "day_15_sent_at";
  build: (firstName: string, userId: string) => EmailContent;
};

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function firstNameFrom(fullName: string | null | undefined): string {
  const part = fullName?.trim().split(/\s+/)[0];
  return part || "Trader";
}

function collectDue(row: SequenceRow): DueEmail | null {
  const created = new Date(row.created_at).getTime();

  if (!row.day_1_sent_at && created <= hoursAgo(1).getTime()) {
    return {
      row,
      column: "day_1_sent_at",
      build: day1WelcomeEmail,
    };
  }
  if (!row.day_3_sent_at && created <= daysAgo(3).getTime()) {
    return {
      row,
      column: "day_3_sent_at",
      build: day3NudgeEmail,
    };
  }
  if (!row.day_7_sent_at && created <= daysAgo(7).getTime()) {
    return {
      row,
      column: "day_7_sent_at",
      build: day7HalfwayEmail,
    };
  }
  if (!row.day_12_sent_at && created <= daysAgo(12).getTime()) {
    return {
      row,
      column: "day_12_sent_at",
      build: day12LastChanceEmail,
    };
  }
  if (!row.day_14_sent_at && created <= daysAgo(14).getTime()) {
    return {
      row,
      column: "day_14_sent_at",
      build: day14LastDayEmail,
    };
  }
  if (!row.day_15_sent_at && created <= daysAgo(15).getTime()) {
    return {
      row,
      column: "day_15_sent_at",
      build: day15WinBackEmail,
    };
  }

  return null;
}

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Allow Vercel Cron header, or open in local/dev when secret unset
    return (
      request.headers.get("x-vercel-cron") === "1" ||
      process.env.NODE_ENV !== "production"
    );
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const service = getServiceClient();

    const { data: rows, error } = await service
      .from("email_sequence")
      .select(
        "id, user_id, email, day_1_sent_at, day_3_sent_at, day_7_sent_at, day_12_sent_at, day_14_sent_at, day_15_sent_at, created_at"
      )
      .eq("unsubscribed", false);

    if (error || !rows) {
      return NextResponse.json(
        { ok: false, sent: 0, error: error?.message ?? "No rows" },
        { status: 200 }
      );
    }

    const queue: DueEmail[] = [];
    for (const row of rows as SequenceRow[]) {
      const due = collectDue(row);
      if (due) queue.push(due);
    }

    const toSend = queue.slice(0, MAX_EMAILS_PER_RUN);
    let sent = 0;
    const nameCache = new Map<string, string>();

    for (const item of toSend) {
      try {
        // Re-check sent_at immediately before send (never send twice)
        const { data: fresh } = await service
          .from("email_sequence")
          .select(item.column)
          .eq("id", item.row.id)
          .maybeSingle();

        if (!fresh || (fresh as Record<string, string | null>)[item.column]) {
          continue;
        }

        let firstName = nameCache.get(item.row.user_id);
        if (!firstName) {
          const { data: profile } = await service
            .from("profiles")
            .select("full_name")
            .eq("id", item.row.user_id)
            .maybeSingle();
          firstName = firstNameFrom(profile?.full_name);
          nameCache.set(item.row.user_id, firstName);
        }

        const content = item.build(firstName, item.row.user_id);
        // TEMP diagnostic — fires regardless of send outcome
        console.log(
          `[send-sequence] calling sendResendEmail column=${item.column} rowId=${item.row.id}`
        );
        const ok = await sendResendEmail({
          to: item.row.email,
          subject: content.subject,
          html: content.html,
        });

        if (!ok) continue;

        const { error: updateError } = await service
          .from("email_sequence")
          .update({ [item.column]: new Date().toISOString() })
          .eq("id", item.row.id)
          .is(item.column, null);

        if (!updateError) sent += 1;
      } catch {
        // Fail silently per email — continue the batch
      }
    }

    return NextResponse.json({ ok: true, sent, queued: toSend.length });
  } catch {
    // Fail silently — never crash the cron
    return NextResponse.json({ ok: false, sent: 0 }, { status: 200 });
  }
}
