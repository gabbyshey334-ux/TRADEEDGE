import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";

export const runtime = "nodejs";
// We rely on Next's fetch cache (revalidate: 3600) to bound Quiver calls to
// once per hour. The route handler itself stays dynamic so each user request
// still goes through auth + plan checks.
export const dynamic = "force-dynamic";

const QUIVER_ENDPOINT = "https://api.quiverquant.com/beta/live/congresstrading";
const CACHE_SECONDS = 60 * 60; // 1 hour
const MAX_ROWS = 200; // cap upstream rows we keep in the table

export interface CongressionalTrade {
  id: string;
  member_name: string;
  party: string | null;
  state: string | null;
  ticker: string;
  trade_type: string;
  amount_range: string | null;
  trade_date: string | null;
  disclosure_date: string | null;
  description: string | null;
}

export interface CongressionalTradesResponse {
  data: CongressionalTrade[];
  source: "live" | "cache" | "empty";
  error: string | null;
  fetched_at: string;
}

interface QuiverRow {
  Representative?: string;
  Senator?: string;
  Name?: string;
  Party?: string;
  State?: string;
  Ticker?: string;
  Transaction?: string;
  TransactionType?: string;
  Type?: string;
  Range?: string;
  Amount?: string;
  TradeDate?: string;
  Traded?: string;
  ReportDate?: string;
  Filed?: string;
  Description?: string;
}

function normalizeParty(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v.startsWith("D")) return "D";
  if (v.startsWith("R")) return "R";
  if (v.startsWith("I")) return "I";
  return v.slice(0, 1) || null;
}

function normalizeTradeType(value: string | null | undefined): string {
  if (!value) return "Purchase";
  const v = value.trim().toLowerCase();
  if (v.includes("sale") || v.includes("sell")) return "Sale";
  if (v.includes("exchange")) return "Exchange";
  return "Purchase";
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function mapQuiverRow(row: QuiverRow): CongressionalTrade | null {
  const memberName =
    row.Representative?.trim() ||
    row.Senator?.trim() ||
    row.Name?.trim() ||
    "";
  const ticker = (row.Ticker ?? "").trim().toUpperCase();
  if (!memberName || !ticker) return null;

  const tradeType = normalizeTradeType(
    row.Transaction ?? row.TransactionType ?? row.Type
  );

  return {
    id: `${memberName}|${ticker}|${row.Traded ?? row.TradeDate ?? ""}|${tradeType}|${row.Range ?? row.Amount ?? ""}`,
    member_name: memberName,
    party: normalizeParty(row.Party),
    state: row.State ? row.State.trim() : null,
    ticker,
    trade_type: tradeType,
    amount_range: (row.Range ?? row.Amount ?? "").trim() || null,
    trade_date: toDateOnly(row.Traded ?? row.TradeDate),
    disclosure_date: toDateOnly(row.ReportDate ?? row.Filed),
    description: row.Description?.trim() || null,
  };
}

async function readFromCache(): Promise<CongressionalTrade[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("congressional_trades")
      .select(
        "id, member_name, party, state, ticker, trade_type, amount_range, trade_date, disclosure_date, description"
      )
      .order("disclosure_date", { ascending: false, nullsFirst: false })
      .order("cached_at", { ascending: false })
      .limit(MAX_ROWS);

    return (data ?? []) as CongressionalTrade[];
  } catch {
    return [];
  }
}

async function writeToCache(rows: CongressionalTrade[]): Promise<void> {
  if (!rows.length) return;
  try {
    const service = getServiceClient();
    // upsert on the unique index (member_name, ticker, trade_date, trade_type, amount_range)
    const payload = rows.map((r) => ({
      member_name: r.member_name,
      party: r.party,
      state: r.state,
      ticker: r.ticker,
      trade_type: r.trade_type,
      amount_range: r.amount_range,
      trade_date: r.trade_date,
      disclosure_date: r.disclosure_date,
      description: r.description,
      cached_at: new Date().toISOString(),
    }));
    await service.from("congressional_trades").upsert(payload, {
      onConflict: "member_name,ticker,trade_date,trade_type,amount_range",
      ignoreDuplicates: false,
    });
  } catch {
    // Service role may be missing in local dev; fall through silently.
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { data: [], source: "empty", error: "Unauthorized", fetched_at: new Date().toISOString() },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const plan: Plan =
    profile?.plan === "pro" || profile?.plan === "elite" || profile?.plan === "starter"
      ? (profile.plan as Plan)
      : "starter";

  if (!PLAN_LIMITS[plan].congressionalTrades) {
    return NextResponse.json(
      {
        data: [],
        source: "empty",
        error: "Congressional Trades is available on Pro and Elite plans.",
        fetched_at: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  const apiKey = process.env.QUIVER_API_KEY;
  if (!apiKey) {
    const cached = await readFromCache();
    return NextResponse.json<CongressionalTradesResponse>({
      data: cached,
      source: cached.length ? "cache" : "empty",
      error:
        "QUIVER_API_KEY is not configured. Add it to your environment to enable the live feed.",
      fetched_at: new Date().toISOString(),
    });
  }

  try {
    const upstream = await fetch(QUIVER_ENDPOINT, {
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: "application/json",
      },
      // Next.js fetch cache — refresh once per hour.
      next: { revalidate: CACHE_SECONDS, tags: ["congressional-trades"] },
    });

    if (!upstream.ok) {
      throw new Error(`Quiver responded ${upstream.status}`);
    }

    const raw = (await upstream.json()) as QuiverRow[] | unknown;
    const rows = Array.isArray(raw) ? raw : [];
    const mapped = rows
      .map(mapQuiverRow)
      .filter((r): r is CongressionalTrade => r !== null)
      .slice(0, MAX_ROWS);

    if (mapped.length) {
      // Fire-and-forget cache write; do not block the response.
      void writeToCache(mapped);
    }

    return NextResponse.json<CongressionalTradesResponse>({
      data: mapped,
      source: "live",
      error: null,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    const cached = await readFromCache();
    return NextResponse.json<CongressionalTradesResponse>({
      data: cached,
      source: cached.length ? "cache" : "empty",
      error:
        cached.length
          ? "Live feed unavailable — showing the last cached snapshot."
          : `Live feed unavailable and no cached data on file. (${err instanceof Error ? err.message : "Unknown error"})`,
      fetched_at: new Date().toISOString(),
    });
  }
}
