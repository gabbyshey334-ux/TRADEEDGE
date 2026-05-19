"use client";

import { useCallback, useEffect, useState } from "react";
import type { TickerQuote } from "@/lib/market-ticker";

const POLL_MS = 30_000;

function TickerItems({ items }: { items: TickerQuote[] }) {
  return (
    <>
      {items.map((it) => (
        <span
          key={it.symbol}
          className="inline-flex items-center gap-2 px-6 font-mono text-[11px] uppercase whitespace-nowrap"
          style={{ letterSpacing: "0.18em" }}
        >
          <span className="text-text">{it.symbol}</span>
          <span className="text-muted">{it.price}</span>
          <span style={{ color: it.positive ? "#00e5b0" : "#ff4d6d" }}>
            {it.change}
          </span>
          <span className="text-dimmed px-2">•</span>
        </span>
      ))}
    </>
  );
}

export function MarketTicker() {
  const [quotes, setQuotes] = useState<TickerQuote[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market-ticker", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { quotes: TickerQuote[] };
      if (data.quotes?.length) setQuotes(data.quotes);
    } catch {
      /* keep last good quotes on transient failure */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (!quotes) {
    return (
      <div className="flex items-center h-full px-6 font-mono text-[11px] uppercase text-muted whitespace-nowrap"
        style={{ letterSpacing: "0.18em" }}
      >
        Loading live markets…
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center h-full">
        <TickerItems items={quotes} />
      </div>
      <div className="flex items-center h-full" aria-hidden="true">
        <TickerItems items={quotes} />
      </div>
    </>
  );
}
