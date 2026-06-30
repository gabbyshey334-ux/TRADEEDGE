"use client";

const SESSION_STORAGE_KEY = "te_session_id";
const SESSION_COOKIE_NAME = "te_session_id";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function syncSessionCookie(sessionId: string) {
  if (typeof document === "undefined" || !sessionId) return;

  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=lax`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  }

  syncSessionCookie(id);
  return id;
}

export async function trackFunnelEvent(
  eventType: string,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch("/api/funnel-track", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        eventType,
        metadata,
      }),
    });
  } catch {
    // Silent fail — never block the user experience for tracking
  }
}
