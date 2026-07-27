/**
 * Thin Resend HTTP client — no npm package required.
 * Fails silently (returns false) when Resend is down or misconfigured.
 */

// TEMP diagnostic — last attempt metadata for admin probes
export let lastResendAttempt: {
  at: string;
  skippedMissingKey: boolean;
  status: number | null;
  ok: boolean;
  error: string | null;
  body: string | null;
} | null = null;

export async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    // TEMP diagnostic — remove after Resend send investigation
    console.log("[resend] RESEND_API_KEY missing or empty — skipping fetch");
    lastResendAttempt = {
      at: new Date().toISOString(),
      skippedMissingKey: true,
      status: null,
      ok: false,
      error: "missing_key",
      body: null,
    };
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
    // TEMP diagnostic — remove after Resend send investigation
    let responseBody: string | null = null;
    try {
      responseBody = (await response.text()).slice(0, 500);
    } catch {
      responseBody = "unreadable_body";
    }
    console.log(
      `[resend] fetch completed status=${response.status} ok=${response.ok} body=${responseBody}`
    );
    lastResendAttempt = {
      at: new Date().toISOString(),
      skippedMissingKey: false,
      status: response.status,
      ok: response.ok,
      error: response.ok ? null : responseBody,
      body: responseBody,
    };
    return response.ok;
  } catch (err) {
    // TEMP diagnostic — remove after Resend send investigation
    const message = err instanceof Error ? err.message : "unknown";
    console.log(`[resend] fetch threw: ${message}`);
    lastResendAttempt = {
      at: new Date().toISOString(),
      skippedMissingKey: false,
      status: null,
      ok: false,
      error: message,
      body: null,
    };
    return false;
  }
}
