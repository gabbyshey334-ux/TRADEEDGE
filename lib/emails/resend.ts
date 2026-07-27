/**
 * Thin Resend HTTP client — no npm package required.
 * Fails silently (returns false) when Resend is down or misconfigured.
 */
export async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    // TEMP diagnostic — remove after Resend send investigation
    console.log("[resend] RESEND_API_KEY missing or empty — skipping fetch");
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
    console.log(
      `[resend] fetch completed status=${response.status} ok=${response.ok}`
    );
    return response.ok;
  } catch (err) {
    // TEMP diagnostic — remove after Resend send investigation
    console.log(
      `[resend] fetch threw: ${err instanceof Error ? err.message : "unknown"}`
    );
    return false;
  }
}
