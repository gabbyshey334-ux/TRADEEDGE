import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertFunnelEvent } from "@/lib/funnel-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: unknown;
      eventType?: unknown;
      metadata?: Record<string, unknown> | null;
    };

    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const eventType =
      typeof body.eventType === "string" ? body.eventType.trim() : "";

    if (!sessionId || !eventType) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await insertFunnelEvent({
      sessionId,
      eventType,
      userId: user?.id ?? null,
      metadata: body.metadata ?? null,
    });
  } catch {
    // Tracking must never block the user experience.
  }

  return NextResponse.json({ ok: true });
}
