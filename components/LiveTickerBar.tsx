"use client";

import { MarketTicker } from "@/components/MarketTicker";

export function LiveTickerBar() {
  return (
    <div
      className="fixed left-0 right-0 top-16 z-40 overflow-hidden border-b border-[#1a2030] bg-[#080b11]"
      style={{ height: 36 }}
      aria-label="Live market prices"
    >
      <div className="ticker-track flex h-full w-max items-center">
        <MarketTicker />
      </div>
    </div>
  );
}
