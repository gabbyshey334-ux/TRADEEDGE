import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";

export const runtime = "nodejs";
// We rely on Next's fetch cache (revalidate: 3600) to bound government-source
// fetches to once per hour. The route handler itself stays dynamic so each user
// request still goes through auth + plan checks.
export const dynamic = "force-dynamic";

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

  try {
    const [houseRes, senateRes] = await Promise.all([
      fetch(
        "https://raw.githubusercontent.com/leftmove/wallstreetlocal/main/backend/files/house.json",
        { next: { revalidate: CACHE_SECONDS } }
      ),
      fetch(
        "https://raw.githubusercontent.com/leftmove/wallstreetlocal/main/backend/files/senate.json",
        { next: { revalidate: CACHE_SECONDS } }
      ),
    ]);

    if (!houseRes.ok && !senateRes.ok) {
      throw new Error("Congressional disclosure data unavailable");
    }

    const houseRaw = houseRes.ok ? await houseRes.json() : [];
    const senateRaw = senateRes.ok ? await senateRes.json() : [];

    function normalizeSenate(
      item: Record<string, string>
    ): CongressionalTrade {
      const tradeType = (item.type ?? "")
        .toLowerCase()
        .includes("purchase")
        ? "Purchase"
        : "Sale";

      return {
        id: `S-${item.ticker ?? ""}-${item.transaction_date ?? ""}-${item.last_name ?? ""}`.replace(/\s+/g, "-"),
        member_name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
        party: null,
        state: "Senate",
        ticker: item.ticker ?? "",
        trade_type: tradeType,
        amount_range: item.amount ?? null,
        trade_date: item.transaction_date ?? null,
        disclosure_date: item.date_received ?? null,
        description: item.asset_description ?? null,
      };
    }

    function normalizeHouse(
      item: Record<string, string>
    ): CongressionalTrade {
      const tradeType = (item.type ?? "")
        .toLowerCase()
        .includes("purchase")
        ? "Purchase"
        : "Sale";

      return {
        id: `H-${item.ticker ?? ""}-${item.transaction_date ?? ""}-${item.representative ?? ""}`.replace(/\s+/g, "-"),
        member_name: item.representative ?? "Unknown",
        party: null,
        state: item.district ?? "House",
        ticker: item.ticker ?? "",
        trade_type: tradeType,
        amount_range: item.amount ?? null,
        trade_date: item.transaction_date ?? null,
        disclosure_date: item.disclosure_date ?? null,
        description: item.asset_description ?? null,
      };
    }

    const senateTrades = Array.isArray(senateRaw)
      ? senateRaw
          .filter((i: Record<string, string>) =>
            i.ticker && i.ticker !== "--" && i.asset_type === "Stock"
          )
          .map(normalizeSenate)
      : [];

    const houseTrades = Array.isArray(houseRaw)
      ? houseRaw
          .filter((i: Record<string, string>) =>
            i.ticker && i.ticker !== "--"
          )
          .map(normalizeHouse)
      : [];

    const mapped = [...senateTrades, ...houseTrades]
      .filter((t) => t.ticker && t.trade_date)
      .sort(
        (a, b) =>
          new Date(b.trade_date ?? 0).getTime() -
          new Date(a.trade_date ?? 0).getTime()
      )
      .slice(0, 100);

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
