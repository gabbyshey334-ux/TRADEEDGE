"use client";

import { useEffect, useState } from "react";

type Stat = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color: string;
  sub: string;
};

const STATS: Stat[] = [
  {
    label: "Net P&L",
    value: 4821,
    prefix: "+$",
    color: "#00e5b0",
    sub: "Last 30 days",
  },
  {
    label: "Win Rate",
    value: 68.4,
    suffix: "%",
    decimals: 1,
    color: "#0066ff",
    sub: "33 wins / 15 losses",
  },
  {
    label: "AI Score",
    value: 91,
    suffix: "/100",
    color: "#b466ff",
    sub: "Ready to trade",
  },
  {
    label: "Rule Breaks",
    value: 7,
    suffix: " flagged",
    color: "#f0c040",
    sub: "Before execution",
  },
];

const ROWS = [
  {
    market: "EUR/USD",
    setup: "London Breakout",
    emotion: "Disciplined",
    pnl: "+$795",
    positive: true,
  },
  {
    market: "NQ1!",
    setup: "VWAP Reclaim",
    emotion: "Patient",
    pnl: "+$1,800",
    positive: true,
  },
  {
    market: "GBP/USD",
    setup: "Late Reversal",
    emotion: "FOMO",
    pnl: "-$132",
    positive: false,
  },
];

function formatValue(stat: Stat, current: number) {
  const value = current.toLocaleString("en-US", {
    maximumFractionDigits: stat.decimals ?? 0,
    minimumFractionDigits: stat.decimals ?? 0,
  });

  return `${stat.prefix ?? ""}${value}${stat.suffix ?? ""}`;
}

export function HeroDashboard() {
  const [values, setValues] = useState(() => STATS.map(() => 0));

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const duration = 1400;

    const tick = (timestamp: number) => {
      start ??= timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValues(STATS.map((stat) => stat.value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="hero-dashboard-wrap mx-auto mt-10 w-full max-w-full overflow-hidden rounded-xl px-0 sm:mt-16 md:max-w-6xl">
      <div className="hero-dashboard rounded-[22px] border border-[#1a2030] bg-[#0c1018] shadow-[0_60px_140px_-60px_rgba(0,0,0,0.95)]">
        <div className="flex items-center gap-3 border-b border-[#1a2030] px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff4d6d]" />
            <span className="h-3 w-3 rounded-full bg-[#f0c040]" />
            <span className="h-3 w-3 rounded-full bg-[#00e5b0]" />
          </div>
          <div className="flex-1 overflow-hidden rounded-full border border-[#1a2030] bg-[#06080d] px-2 py-1.5 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-[#5a6580] sm:px-3 sm:text-[10px] sm:tracking-[0.2em]">
            app.tradeedge.ai / ai-coaching-live
          </div>
        </div>

        <div className="p-4 md:p-7">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#1a2030] bg-[#080b11] p-4"
                style={{
                  background: `linear-gradient(180deg, ${stat.color}12, rgba(8,11,17,0.96) 72%)`,
                  borderTopColor: `${stat.color}66`,
                }}
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#5a6580]">
                  {stat.label}
                </div>
                <div
                  className="mt-3 font-mono text-[22px] font-bold tabular-nums md:text-[28px]"
                  style={{ color: stat.color }}
                >
                  {formatValue(stat, values[index] ?? 0)}
                </div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#3a4560]">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#1a2030]">
            <div className="hidden grid-cols-[1fr_1.4fr_1fr_0.8fr] border-b border-[#1a2030] bg-[#06080d] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a6580] md:grid">
              <span>Market</span>
              <span>Setup</span>
              <span>Psychology</span>
              <span className="text-right">P&L</span>
            </div>
            {ROWS.map((row, index) => (
              <div
                key={row.market}
                className="dashboard-row grid grid-cols-2 gap-x-3 gap-y-1 border-b border-[#1a2030] px-4 py-4 last:border-b-0 md:grid-cols-[1fr_1.4fr_1fr_0.8fr] md:gap-2"
                style={{ animationDelay: `${420 + index * 160}ms` }}
              >
                <span className="font-mono text-sm text-[#e8edf5]">{row.market}</span>
                <span className="font-sans text-sm text-[#a0afc0]">{row.setup}</span>
                <span className="font-sans text-sm text-[#5a6580]">{row.emotion}</span>
                <span
                  className="font-mono text-sm font-bold md:text-right"
                  style={{ color: row.positive ? "#00e5b0" : "#ff4d6d" }}
                >
                  {row.pnl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-dashboard-glow" aria-hidden="true" />
    </div>
  );
}
