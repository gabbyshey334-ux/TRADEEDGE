const APP_URL = "https://tradeedgeapp.net";
const BILLING_URL = `${APP_URL}/dashboard/billing`;

/** Day 1 welcome video, absolute URLs required for email clients. */
const DAY1_VIDEO_URL =
  "https://res.cloudinary.com/j3kkepoe/video/upload/v1786333150/TradeEdge-Video1-Onboarding.mp4";
const DAY1_VIDEO_THUMBNAIL_URL = `${APP_URL}/videos/video1-onboarding-email.jpg`;

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
  ctaUrl?: string;
}): string {
  const name = escapeHtml(params.firstName);
  const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?userId=${encodeURIComponent(params.userId)}`;
  const ctaUrl = params.ctaUrl ?? BILLING_URL;

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
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 22px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;color:#080a0f;">
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
    subject: "Welcome to TradeEdge AI: here's where to start",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Open TradeEdge AI →",
      ctaUrl: `${APP_URL}/dashboard`,
      bodyHtml: `
        <p style="margin:0 0 16px 0;">
          Welcome to TradeEdge AI. You just made the first move most traders never make: deciding to actually track what's happening with their trading.
        </p>
        <p style="margin:0 0 12px 0;">Here's exactly what to do in the next 10 minutes:</p>
        <p style="margin:0 0 6px 0;">Step 1: Log your first trade in the Journal</p>
        <p style="margin:0 0 6px 0;">Step 2: Go to AI Coach and generate your first report</p>
        <p style="margin:0 0 16px 0;">Step 3: Add a prop firm challenge and check your Readiness Score</p>
        <p style="margin:0 0 16px 0;">
          The AI Coach step is the one that turns those logged trades into something useful: session debriefs, psychology diagnosis, and specific next-session corrections from your own trade history, so you see the leak instead of just the P&amp;L.
        </p>
        <p style="margin:0 0 16px 0;">
          That's it. Three steps and you'll have more insight into your trading than most people get in a year.
        </p>
        <p style="margin:24px 0 8px 0;color:#e8edf5;font-size:15px;line-height:1.7;">
          New here? Watch the 2-minute walkthrough:
        </p>
        <p style="margin:0 0 10px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#00ff88;">
          ▶ Watch: Getting Started (2 min)
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px 0;">
          <tr>
            <td align="left" style="padding:0;">
              <a href="${DAY1_VIDEO_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;border:0;outline:none;">
                <img
                  src="${DAY1_VIDEO_THUMBNAIL_URL}"
                  alt="Watch: Getting started with TradeEdge AI (2 min)"
                  width="600"
                  height="337"
                  style="display:block;width:100%;max-width:600px;height:auto;border:1px solid #1c2235;border-radius:10px;"
                />
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0 0;color:#8892a4;">
          Anthony Brown<br />
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
      ctaUrl: `${APP_URL}/dashboard/ai`,
      bodyHtml: `
        <p style="margin:0 0 16px 0;">
          If you've logged a few trades, your AI Coach has already found something interesting about your trading patterns.
        </p>
        <p style="margin:0 0 16px 0;">
          For example (and this is illustrative, not a claim about your account), something like: you're cutting winners early on your best-performing setup. That's the kind of pattern a report is built to surface from the trades you've already logged.
        </p>
        <p style="margin:0 0 16px 0;">
          Go run your first report. It takes 30 seconds.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">Anthony</p>
      `,
    }),
  };
}

export function day7HalfwayEmail(
  firstName: string,
  userId: string
): EmailContent {
  return {
    subject: "7 days in: here's what Pro unlocks for you",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Upgrade to Pro: Use FOUNDER20 →",
      bodyHtml: `
        <p style="margin:0 0 16px 0;">You're halfway through your free trial.</p>
        <p style="margin:0 0 12px 0;">Here's what you get when you upgrade to Pro:</p>
        <p style="margin:0 0 6px 0;">✓ Unlimited trades per month: no more hitting the Starter 50-trade ceiling mid-month</p>
        <p style="margin:0 0 6px 0;">✓ 10 AI coaching reports every month: session debriefs and next-session corrections from your own history</p>
        <p style="margin:0 0 6px 0;">✓ Congressional Trades feed: live STOCK Act disclosures so you can see what members of Congress are trading</p>
        <p style="margin:0 0 16px 0;">✓ Prop Firm Tracker: profit targets, daily loss, and max drawdown in one place so rule breaks don't surprise you</p>
        <p style="margin:0 0 16px 0;">
          Use code <strong style="color:#00ff88;">FOUNDER20</strong> for 20% off your first month.
        </p>
        <p style="margin:0 0 16px 0;color:#8892a4;">
          The code expires when your trial ends.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">Anthony</p>
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
      ctaLabel: "Upgrade Now: Save 20% →",
      bodyHtml: `
        <p style="margin:0 0 16px 0;">Your free trial ends in 2 days.</p>
        <p style="margin:0 0 16px 0;">
          You've seen what TradeEdge AI can do. The AI Coach, the Congressional Trades feed, the Prop Firm Tracker: all of it stays available when you upgrade.
        </p>
        <p style="margin:0 0 16px 0;">
          Traders upgrade at this point to keep AI Coach reports and unlimited journaling after trial. On Starter, monthly trades cap at 50 and AI reports drop to zero.
        </p>
        <p style="margin:0 0 16px 0;">
          Use <strong style="color:#00ff88;">FOUNDER20</strong> for 20% off. It expires when your trial does.
        </p>
        <p style="margin:0 0 16px 0;">
          If you have any questions before deciding, just reply to this email.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">
          Anthony Brown<br />
          Founder, TradeEdge AI
        </p>
      `,
    }),
  };
}

export function day14LastDayEmail(
  firstName: string,
  userId: string
): EmailContent {
  return {
    subject: "Your TradeEdge trial ends today",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Upgrade Now: Save 20% →",
      ctaUrl: BILLING_URL,
      bodyHtml: `
        <p style="margin:0 0 16px 0;">
          Your TradeEdge AI free trial ends today.
        </p>
        <p style="margin:0 0 12px 0;">
          If you don't upgrade, here's what changes when you move back to Starter limits:
        </p>
        <p style="margin:0 0 6px 0;">• Journal entries: capped at 50 trades per month</p>
        <p style="margin:0 0 6px 0;">• AI Coach reports: stop (Starter includes 0 reports)</p>
        <p style="margin:0 0 6px 0;">• Congressional Trades feed: locks</p>
        <p style="margin:0 0 16px 0;">• Prop Firm Tracker: locks</p>
        <p style="margin:0 0 16px 0;">
          Nothing is deleted. Every trade and journal entry you've logged stays in your account whether you upgrade or not.
        </p>
        <p style="margin:0 0 16px 0;">
          Use code <strong style="color:#00ff88;">FOUNDER20</strong> for 20% off. Today is the last day it works.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">
          Anthony Brown<br />
          Founder, TradeEdge AI
        </p>
      `,
    }),
  };
}

export function day15WinBackEmail(
  firstName: string,
  userId: string
): EmailContent {
  return {
    subject: "Your TradeEdge journal is still here",
    html: emailShell({
      firstName,
      userId,
      ctaLabel: "Pick Up Where You Left Off →",
      ctaUrl: BILLING_URL,
      bodyHtml: `
        <p style="margin:0 0 16px 0;">
          Your trial ended, but nothing's gone. Your TradeEdge journal is still here. Every trade you logged is exactly where you left it.
        </p>
        <p style="margin:0 0 16px 0;">
          TradeEdge AI shows you the pattern in your own trading that's quietly costing you money, before it costs you your account.
        </p>
        <p style="margin:0 0 16px 0;">
          When you're ready, pick up where you left off.
        </p>
        <p style="margin:24px 0 0 0;color:#8892a4;">
          Anthony Brown<br />
          Founder, TradeEdge AI
        </p>
      `,
    }),
  };
}
