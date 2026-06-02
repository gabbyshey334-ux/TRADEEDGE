import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";

export const runtime = "nodejs";
// We rely on Next's fetch cache (revalidate: 3600) to bound FMP calls to
// once per hour. The route handler itself stays dynamic so each user request
// still goes through auth + plan checks.
export const dynamic = "force-dynamic";

const CACHE_SECONDS = 60 * 60; // 1 hour
const MAX_ROWS = 200; // cap upstream rows we keep in the table
const LIVE_ROW_LIMIT = 100;
const FMP_PAGE_LIMIT = 250; // max per FMP stable docs
const FMP_HOUSE_URL = "https://financialmodelingprep.com/stable/house-latest";
const FMP_SENATE_URL = "https://financialmodelingprep.com/stable/senate-latest";

function fmpErrorMessage(body: unknown): string | null {
  if (body && typeof body === "object" && "Error Message" in body) {
    const msg = (body as { "Error Message": unknown })["Error Message"];
    return typeof msg === "string" ? msg : null;
  }
  return null;
}

async function fetchFmpChamber(
  baseUrl: string,
  apiKey: string
): Promise<{ rows: Record<string, string>[]; error: string | null }> {
  const url = `${baseUrl}?page=0&limit=${FMP_PAGE_LIMIT}&apikey=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    const body: unknown = await res.json();
    const errMsg = fmpErrorMessage(body);
    if (errMsg) return { rows: [], error: errMsg };
    if (!res.ok) return { rows: [], error: `HTTP ${res.status}` };
    if (!Array.isArray(body)) return { rows: [], error: "Unexpected response format" };
    return { rows: body as Record<string, string>[], error: null };
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : "Request failed",
    };
  }
}

function normalizeTradeType(type: string | undefined): string {
  const v = (type ?? "").toLowerCase();
  if (v.includes("purchase") || v.includes("receive")) return "Purchase";
  return "Sale";
}

function memberNameFrom(item: Record<string, string>, chamber: "House" | "Senate"): string {
  const named =
    chamber === "House"
      ? (item.representative ?? "").trim()
      : (item.senator ?? "").trim();
  if (named) return named;
  const first = (item.firstName ?? "").trim();
  const last = (item.lastName ?? "").trim();
  const combined = `${first} ${last}`.trim();
  return combined || "Unknown";
}

function tickerFrom(item: Record<string, string>): string {
  return (item.symbol ?? item.ticker ?? "").trim().toUpperCase();
}

function normalizeTrade(
  item: Record<string, string>,
  chamber: "House" | "Senate"
): CongressionalTrade {
  const memberName = memberNameFrom(item, chamber);
  const ticker = tickerFrom(item);
  const tradeDate = item.transactionDate ?? null;
  const tradeType = normalizeTradeType(item.type);

  return {
    id: `${ticker}-${tradeDate ?? ""}-${memberName}`.replace(/\s+/g, "-"),
    member_name: memberName,
    party: "N/A",
    state: chamber === "House" ? (item.district ?? "House") : "Senate",
    ticker,
    trade_type: tradeType,
    amount_range: item.amount ?? null,
    trade_date: tradeDate,
    disclosure_date: item.disclosureDate ?? null,
    description:
      (item.assetDescription ?? item.asset_description ?? "").trim() || null,
  };
}

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

  const apiKey = process.env.FMP_API_KEY?.trim();
  if (!apiKey) {
    const cached = await readFromCache();
    return NextResponse.json<CongressionalTradesResponse>({
      data: cached,
      source: cached.length ? "cache" : "empty",
      error:
        "FMP_API_KEY is not configured. Add it to your Vercel environment variables to enable the live feed.",
      fetched_at: new Date().toISOString(),
    });
  }

  try {
    const [houseResult, senateResult] = await Promise.all([
      fetchFmpChamber(FMP_HOUSE_URL, apiKey),
      fetchFmpChamber(FMP_SENATE_URL, apiKey),
    ]);

    if (!houseResult.rows.length && !senateResult.rows.length) {
      const details = [houseResult.error, senateResult.error].filter(Boolean).join("; ");
      throw new Error(details || "FMP API request failed");
    }

    const mapped = [
      ...houseResult.rows.map((item) => normalizeTrade(item, "House")),
      ...senateResult.rows.map((item) => normalizeTrade(item, "Senate")),
    ]
      .filter((t) => t.ticker && t.trade_date)
      .sort(
        (a, b) =>
          new Date(b.trade_date ?? 0).getTime() - new Date(a.trade_date ?? 0).getTime()
      )
      .slice(0, LIVE_ROW_LIMIT);

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
