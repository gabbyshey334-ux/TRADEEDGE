/**
 * TEMPORARY one-off Resend probe — delete after confirmation.
 * Does not touch email_sequence or any DB rows.
 */
import { NextRequest, NextResponse } from "next/server";
import { lastResendAttempt, sendResendEmail } from "@/lib/emails/resend";
import { day1WelcomeEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_BACKFILL_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const content = day1WelcomeEmail("Test", "00000000-0000-0000-0000-000000000000");
  const ok = await sendResendEmail({
    to: "sheywebstudio@gmail.com",
    subject: content.subject,
    html: content.html,
  });

  const attempt = lastResendAttempt;

  return NextResponse.json({
    success: ok,
    status: attempt?.status ?? null,
    skippedMissingKey: attempt?.skippedMissingKey ?? null,
    body: attempt?.body ?? null,
    lastResendAttempt: attempt,
  });
}
