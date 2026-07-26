const APP_URL = "https://tradeedgeapp.net";
const BILLING_URL = `${APP_URL}/dashboard/billing`;

export interface EmailContent {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(params: {
  firstName: string;
  userId: string;
  bodyHtml: string;
  ctaLabel: string;
}): string {
  const name = escapeHtml(params.firstName);
  const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?userId=${encodeURIComponent(params.userId)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TradeEdge AI</title>
</head>
<body style="margin:0;padding:0;background-color:#080a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#080a0f;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#0c0f17;border:1px solid #1c2235;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px 28px;border-bottom:1px solid #1c2235;">
              <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:18px;letter-spacing:0.12em;font-weight:700;">
                <span style="color:#e8edf5;">TRADE</span><span style="color:#00ff88;">EDGE</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#e8edf5;font-size:15px;line-height:1.7;">
              <p style="margin:0 0 16px 0;">Hey ${name},</p>
              ${params.bodyHtml}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px 0;">
                <tr>
                  <td style="border-radius:10px;background-color:#00ff88;">
                    <a href="${BILLING_URL}" style="display:inline-block;padding:14px 22px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;color:#080a0f;">
                      ${escapeHtml(params.ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;border-top:1px solid #1c2235;color:#4a5568;font-size:12px;line-height:1.6;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
              TradeEdge AI · tradeedgeapp.net<br />
              You're receiving this because you signed up for a free trial.<br />
              <a href="${unsubscribeUrl}" style="color:#8892a4;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function day1WelcomeEmail(
  firstName: string,
  userId: string
): EmailContent {
  return {
    subject: "Welcome to TradeEdge AI — here's where to start",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Open TradeEdge AI →",
      bodyHtml: `
        <p style="margin:0 0 16px 0;">
          Welcome to TradeEdge AI. You just made the first move most traders never make — deciding to actually track what's happening with their trading.
        </p>
        <p style="margin:0 0 12px 0;">Here's exactly what to do in the next 10 minutes:</p>
        <p style="margin:0 0 6px 0;">Step 1 — Log your first trade in the Journal</p>
        <p style="margin:0 0 6px 0;">Step 2 — Go to AI Coach and generate your first report</p>
        <p style="margin:0 0 16px 0;">Step 3 — Add a prop firm challenge and check your Readiness Score</p>
        <p style="margin:0 0 16px 0;">
          That's it. Three steps and you'll have more insight into your trading than most people get in a year.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">
          — Anthony Brown<br />
          Founder, TradeEdge AI
        </p>
      `,
    }),
  };
}

export function day3NudgeEmail(
  firstName: string,
  userId: string
): EmailContent {
  return {
    subject: "Have you seen what your AI Coach found?",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Generate My AI Report →",
      bodyHtml: `
        <p style="margin:0 0 16px 0;">
          If you've logged a few trades, your AI Coach has already found something interesting about your trading patterns.
        </p>
        <p style="margin:0 0 16px 0;">
          Traders who run their first AI report within the first week consistently find at least one pattern they had no idea existed — an emotion that costs them money, a session where their edge disappears, a setup that looks good on paper but doesn't show up in the data.
        </p>
        <p style="margin:0 0 16px 0;">
          Go run your first report. It takes 30 seconds.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">— Anthony</p>
      `,
    }),
  };
}

export function day7HalfwayEmail(
  firstName: string,
  userId: string
): EmailContent {
  return {
    subject: "7 days in — here's what Pro unlocks for you",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Upgrade to Pro — Use FOUNDER20 →",
      bodyHtml: `
        <p style="margin:0 0 16px 0;">You're halfway through your free trial.</p>
        <p style="margin:0 0 12px 0;">Here's what you get when you upgrade to Pro:</p>
        <p style="margin:0 0 6px 0;">✓ Unlimited trades per month</p>
        <p style="margin:0 0 6px 0;">✓ 10 AI coaching reports every month</p>
        <p style="margin:0 0 6px 0;">✓ Congressional Trades feed — see what senators are buying in real time</p>
        <p style="margin:0 0 16px 0;">✓ Prop Firm Tracker with AI Readiness Score</p>
        <p style="margin:0 0 16px 0;">
          Use code <strong style="color:#00ff88;">FOUNDER20</strong> for 20% off your first month.
        </p>
        <p style="margin:0 0 16px 0;color:#8892a4;">
          The code expires when your trial ends.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">— Anthony</p>
      `,
    }),
  };
}

export function day12LastChanceEmail(
  firstName: string,
  userId: string
): EmailContent {
  return {
    subject: "2 days left on your TradeEdge trial",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Upgrade Now — Save 20% →",
      bodyHtml: `
        <p style="margin:0 0 16px 0;">Your free trial ends in 2 days.</p>
        <p style="margin:0 0 16px 0;">
          You've seen what TradeEdge AI can do. The AI Coach, the Congressional Trades feed, the Prop Firm Readiness Score — all of it stays available when you upgrade.
        </p>
        <p style="margin:0 0 16px 0;">
          Use <strong style="color:#00ff88;">FOUNDER20</strong> for 20% off. It expires when your trial does.
        </p>
        <p style="margin:0 0 16px 0;">
          If you have any questions before deciding, just reply to this email.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">
          — Anthony Brown<br />
          Founder, TradeEdge AI
        </p>
      `,
    }),
  };
}
