export type TickerQuote = {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
};

type InstrumentConfig = {
  label: string;
  yahooSymbol: string;
  decimals: number;
  thousands: boolean;
};

export const TICKER_INSTRUMENTS: InstrumentConfig[] = [
  { label: "EUR/USD", yahooSymbol: "EURUSD=X", decimals: 4, thousands: false },
  { label: "GBP/USD", yahooSymbol: "GBPUSD=X", decimals: 4, thousands: false },
  { label: "ES1!", yahooSymbol: "ES=F", decimals: 2, thousands: true },
  { label: "NQ1!", yahooSymbol: "NQ=F", decimals: 2, thousands: true },
  { label: "GC1!", yahooSymbol: "GC=F", decimals: 2, thousands: true },
  { label: "CL1!", yahooSymbol: "CL=F", decimals: 2, thousands: false },
  { label: "BTC/USD", yahooSymbol: "BTC-USD", decimals: 0, thousands: true },
  { label: "AAPL", yahooSymbol: "AAPL", decimals: 2, thousands: false },
];

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; TradeEdgeAI/1.0; +https://tradeedge.ai)",
  Accept: "application/json",
};

type YahooChartMeta = {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
};

function formatPrice(value: number, decimals: number, thousands: boolean): string {
  const fixed = value.toFixed(decimals);
  if (!thousands) return fixed;
  const [whole, frac] = fixed.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac !== undefined ? `${withCommas}.${frac}` : withCommas;
}

function formatChangePercent(pct: number): { text: string; positive: boolean } {
  const positive = pct >= 0;
  const sign = positive ? "+" : "";
  return {
    text: `${sign}${pct.toFixed(2)}%`,
    positive,
  };
}

async function fetchYahooQuote(
  instrument: InstrumentConfig
): Promise<TickerQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    instrument.yahooSymbol
  )}?interval=1m&range=1d`;

  try {
    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      next: { revalidate: 30 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      chart?: { result?: Array<{ meta?: YahooChartMeta }> };
    };

    const meta = data.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const previous = meta?.chartPreviousClose;

    if (price == null || previous == null || previous === 0) return null;

    const changePct = ((price - previous) / previous) * 100;
    const { text: change, positive } = formatChangePercent(changePct);

    return {
      symbol: instrument.label,
      price: formatPrice(price, instrument.decimals, instrument.thousands),
      change,
      positive,
    };
  } catch {
    return null;
  }
}

export async function fetchAllTickerQuotes(): Promise<TickerQuote[]> {
  const results = await Promise.all(
    TICKER_INSTRUMENTS.map((inst) => fetchYahooQuote(inst))
  );

  return results.filter((q): q is TickerQuote => q !== null);
}
