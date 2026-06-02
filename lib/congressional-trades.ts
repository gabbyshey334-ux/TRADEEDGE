/** Matches Supabase upsert unique key and dedupes paginated FMP rows. */
export function tradeDedupeKey(trade: {
  member_name: string;
  ticker: string;
  trade_date: string | null;
  trade_type: string;
  amount_range: string | null;
}): string {
  return [
    trade.member_name.trim(),
    trade.ticker.trim().toUpperCase(),
    trade.trade_date ?? "",
    normalizeTradeType(trade.trade_type),
    (trade.amount_range ?? "").trim(),
  ].join("|");
}

export function tradeStableId(trade: {
  member_name: string;
  ticker: string;
  trade_date: string | null;
  trade_type: string;
  amount_range: string | null;
}): string {
  return tradeDedupeKey(trade).replace(/\s+/g, "-").replace(/\|/g, "--");
}

export function normalizeTradeType(type: string | undefined | null): "Purchase" | "Sale" {
  const v = (type ?? "").toLowerCase();
  if (v.includes("purchase") || v.includes("receive")) return "Purchase";
  if (v.includes("sale") || v.includes("sell") || v.includes("exchange")) return "Sale";
  return "Sale";
}

export function dedupeTrades<T extends {
  member_name: string;
  ticker: string;
  trade_date: string | null;
  trade_type: string;
  amount_range: string | null;
}>(trades: T[]): T[] {
  const seen = new Map<string, T>();
  for (const trade of trades) {
    const key = tradeDedupeKey(trade);
    if (!seen.has(key)) seen.set(key, trade);
  }
  return Array.from(seen.values());
}
