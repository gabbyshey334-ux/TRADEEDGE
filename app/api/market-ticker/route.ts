import { NextResponse } from "next/server";
import { fetchAllTickerQuotes } from "@/lib/market-ticker";

export const dynamic = "force-dynamic";

export async function GET() {
  const quotes = await fetchAllTickerQuotes();

  if (quotes.length === 0) {
    return NextResponse.json(
      { error: "Unable to fetch market data", quotes: [] },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { quotes, updatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
