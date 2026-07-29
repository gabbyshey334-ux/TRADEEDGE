/**
 * Thin Resend HTTP client — no npm package required.
 * Fails silently (returns false) when Resend is down or misconfigured.
 */

// TEMP — used by preview-sequence-emails probe; remove with that route
export let lastResendAttempt: {
  status: number | null;
  ok: boolean;
  body: string | null;
} | null = null;

export async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    lastResendAttempt = { status: null, ok: false, body: "missing_key" };
    return false;
  }

  const from =
    process.env.RESEND_FROM_EMAIL ??
    "TradeEdge AI <noreply@tradeedgeapp.net>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    const body = (await response.text()).slice(0, 500);
    lastResendAttempt = {
      status: response.status,
      ok: response.ok,
      body,
    };
    return response.ok;
  } catch (err) {
    lastResendAttempt = {
      status: null,
      ok: false,
      body: err instanceof Error ? err.message : "unknown",
    };
    return false;
  }
}
