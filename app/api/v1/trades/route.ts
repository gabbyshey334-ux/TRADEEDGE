export const runtime = "nodejs";

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid Authorization header. Use: Bearer YOUR_API_KEY",
      },
      { status: 401 }
    );
  }

  const rawKey = authHeader.replace("Bearer ", "").trim();
  if (!rawKey.startsWith("te_live_")) {
    return NextResponse.json(
      { error: "Invalid API key format." },
      { status: 401 }
    );
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const service = getServiceClient();

  const { data: apiKey } = await service
    .from("api_keys")
    .select("id, user_id, last_used_at")
    .eq("key_hash", keyHash)
    .single();

  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  if (apiKey.last_used_at) {
    const lastUsed = new Date(apiKey.last_used_at).getTime();
    if (Date.now() - lastUsed < 1000) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before retrying." },
        { status: 429 }
      );
    }
  }

  const { data: profile } = await service
    .from("profiles")
    .select("plan")
    .eq("id", apiKey.user_id)
    .single();

  if (profile?.plan !== "elite") {
    return NextResponse.json(
      { error: "API access requires an active Elite subscription." },
      { status: 403 }
    );
  }

  void service
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const { data: trades, count } = await service
    .from("trades")
    .select(
      "id, date, symbol, market, direction, entry, exit_price, size, pnl, rr, emotion, setup, session, notes, created_at",
      { count: "exact" }
    )
    .eq("user_id", apiKey.user_id)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({
    object: "list",
    data: trades ?? [],
    total: count ?? 0,
    limit,
    offset,
    has_more: (count ?? 0) > offset + limit,
  });
}
