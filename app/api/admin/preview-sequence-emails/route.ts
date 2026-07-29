/**
 * TEMPORARY — send all 6 trial templates for content preview.
 * Delete after confirmation. Does not touch email_sequence.
 */
import { NextRequest, NextResponse } from "next/server";
import { lastResendAttempt, sendResendEmail } from "@/lib/emails/resend";
import {
  day1WelcomeEmail,
  day3NudgeEmail,
  day7HalfwayEmail,
  day12LastChanceEmail,
  day14LastDayEmail,
  day15WinBackEmail,
} from "@/lib/emails/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TO = "brown.anthony89@yahoo.com";
const PLACEHOLDER_NAME = "Anthony";
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000";
const DELAY_MS = 400;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_BACKFILL_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STAGES = [
  { id: "day1", label: "day1WelcomeEmail", build: day1WelcomeEmail },
  { id: "day3", label: "day3NudgeEmail", build: day3NudgeEmail },
  { id: "day7", label: "day7HalfwayEmail", build: day7HalfwayEmail },
  { id: "day12", label: "day12LastChanceEmail", build: day12LastChanceEmail },
  { id: "day14", label: "day14LastDayEmail", build: day14LastDayEmail },
  { id: "day15", label: "day15WinBackEmail", build: day15WinBackEmail },
] as const;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{
    id: string;
    template: string;
    subject: string;
    success: boolean;
    status: number | null;
    body: string | null;
  }> = [];

  for (const stage of STAGES) {
    const content = stage.build(PLACEHOLDER_NAME, PLACEHOLDER_USER_ID);
    const ok = await sendResendEmail({
      to: TO,
      subject: content.subject,
      html: content.html,
    });
    results.push({
      id: stage.id,
      template: stage.label,
      subject: content.subject,
      success: ok,
      status: lastResendAttempt?.status ?? null,
      body: lastResendAttempt?.body ?? null,
    });
    await sleep(DELAY_MS);
  }

  return NextResponse.json({ to: TO, results });
}
