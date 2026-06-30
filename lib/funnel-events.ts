import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase/service";

export const FUNNEL_SESSION_COOKIE = "te_session_id";

type FunnelMetadata = Record<string, unknown> | null | undefined;

interface InsertFunnelEventArgs {
  sessionId: string;
  eventType: string;
  userId?: string | null;
  metadata?: FunnelMetadata;
}

interface TrackServerFunnelEventArgs {
  eventType: string;
  userId?: string | null;
  sessionId?: string | null;
  metadata?: FunnelMetadata;
}

export async function getServerSessionId(): Promise<string> {
  try {
    return cookies().get(FUNNEL_SESSION_COOKIE)?.value ?? "";
  } catch {
    return "";
  }
}

export async function insertFunnelEvent({
  sessionId,
  eventType,
  userId = null,
  metadata = null,
}: InsertFunnelEventArgs): Promise<void> {
  if (!sessionId || !eventType) return;

  try {
    const service = getServiceClient();
    await service.from("funnel_events").insert({
      session_id: sessionId,
      event_type: eventType,
      user_id: userId,
      metadata,
    });
  } catch {
    // Tracking must never block the product flow.
  }
}

export async function trackServerFunnelEvent({
  eventType,
  userId = null,
  sessionId,
  metadata = null,
}: TrackServerFunnelEventArgs): Promise<void> {
  const resolvedSessionId = sessionId ?? (await getServerSessionId());
  if (!resolvedSessionId) return;

  await insertFunnelEvent({
    sessionId: resolvedSessionId,
    eventType,
    userId,
    metadata,
  });
}

export function getSessionIdFromMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";

  const sessionId = (metadata as Record<string, unknown>).te_session_id;
  return typeof sessionId === "string" ? sessionId : "";
}
