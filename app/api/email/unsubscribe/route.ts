import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TradeEdge AI: Unsubscribed</title>
</head>
<body style="margin:0;padding:0;background:#080a0f;color:#e8edf5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:80px auto;padding:0 20px;text-align:center;">
    <div style="font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:16px;letter-spacing:0.12em;margin-bottom:24px;">
      <span style="color:#e8edf5;">TRADE</span><span style="color:#00ff88;">EDGE</span>
    </div>
    <p style="font-size:16px;line-height:1.6;color:#8892a4;">${message}</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")?.trim();

  if (!userId) {
    return new NextResponse(
      htmlPage("Missing unsubscribe token. Please use the link from your email."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const service = getServiceClient();
    await service
      .from("email_sequence")
      .update({ unsubscribed: true })
      .eq("user_id", userId);
  } catch {
    // Fail soft, still show confirmation so users aren't stuck
  }

  return new NextResponse(
    htmlPage("You have been unsubscribed from TradeEdge AI emails."),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
