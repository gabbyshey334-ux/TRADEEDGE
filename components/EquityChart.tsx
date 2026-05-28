"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Trade } from "@/lib/types";
import { cn, cumulativeEquity, formatCurrency } from "@/lib/utils";

interface EquityChartProps {
  trades: Trade[];
  height?: number;
}

export function EquityChart({ trades, height = 280 }: EquityChartProps) {
  const series = useMemo(() => cumulativeEquity(trades), [trades]);
  const fillIdBase = useId();

  if (series.length < 2) {
    return (
      <div
        className="relative overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17] h-[200px] sm:h-[300px]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28,34,53,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28,34,53,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 0 88 Q 100 72 200 64 T 400 36"
            fill="none"
            stroke="#1c2235"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[#2a3350]"
            aria-hidden
          >
            <path
              d="M3 20h18M6 16V9M11 16V5M16 16v-7M21 16v-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <div className="mt-2 font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
            EQUITY CURVE
          </div>
          <p className="mt-1 font-body text-[13px] text-[#4a5568]">
            Log 2+ trades to activate
          </p>
        </div>
      </div>
    );
  }

  const last = series[series.length - 1].equity;
  const positive = last >= 0;
  const stroke = positive ? "#00ff88" : "#ff3b5c";

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17] transition-colors duration-200 hover:border-[#2a3350]">
      <div className="flex flex-col gap-3 border-b border-[#1c2235] px-5 pb-4 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:pt-6">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
            Equity Curve
          </div>
          <div
            className={cn(
              "mt-3 font-mono text-3xl font-bold leading-none tracking-tight break-words",
              positive ? "text-[#00ff88] glow-green-text" : "text-[#ff3b5c]"
            )}
          >
            {formatCurrency(last)}
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
            Cumulative P&L · {series.length} trades
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded border border-[#1c2235] bg-[#080a0f] px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[#8892a4]">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: stroke }}
            />
            Live
          </span>
        </div>
      </div>

      <EquityCanvas
        series={series}
        height={height}
        stroke={stroke}
        fillIdBase={fillIdBase}
      />
    </div>
  );
}

function EquityCanvas({
  series,
  height,
  stroke,
  fillIdBase,
}: {
  series: Array<{ date: string; equity: number }>;
  height: number;
  stroke: string;
  fillIdBase: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(
    null
  );

  const width = 1000;
  const padding = { top: 16, right: 64, bottom: 24, left: 0 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const equities = series.map((p) => p.equity);
  const min = Math.min(0, ...equities);
  const max = Math.max(0, ...equities);
  const range = max - min || 1;

  const x = (i: number) =>
    padding.left + (i / (series.length - 1)) * innerW;
  const y = (v: number) =>
    padding.top + innerH - ((v - min) / range) * innerH;

  const last = series[series.length - 1].equity;
  const areaId = `area-${fillIdBase}`;
  const areaPath = `M ${x(0)},${y(0)} L ${series
    .map((p, i) => `${x(i)},${y(p.equity)}`)
    .join(" L ")} L ${x(series.length - 1)},${y(0)} Z`;
  const linePath = `M ${series
    .map((p, i) => `${x(i)},${y(p.equity)}`)
    .join(" L ")}`;
  const zeroY = y(0);

  const gridValues = niceTicks(min, max, 4);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const xCoord = relX * scaleX;
    const fract = (xCoord - padding.left) / innerW;
    const idx = Math.min(
      series.length - 1,
      Math.max(0, Math.round(fract * (series.length - 1)))
    );
    setHover({ i: idx, x: x(idx), y: y(series[idx].equity) });
  }

  const tooltip =
    hover &&
    (() => {
      const point = series[hover.i];
      const cx = (hover.x / width) * 100;
      const cy = (hover.y / height) * 100;
      const showOnRight = cx < 60;
      return (
        <div
          ref={wrapRef}
          className="pointer-events-none absolute z-10 -translate-y-full"
          style={{
            left: `${cx}%`,
            top: `${cy}%`,
            transform: `translate(${showOnRight ? "12px" : "calc(-100% - 12px)"}, -100%)`,
          }}
        >
          <div className="rounded-xl border border-[#2a3350] bg-[#080a0f] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
              {new Date(point.date).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </div>
            <div
              className={cn(
                "mt-1.5 font-mono text-[15px] font-bold",
                point.equity >= 0 ? "text-[#00ff88]" : "text-[#ff3b5c]"
              )}
            >
              {formatCurrency(point.equity)}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
              Trade {hover.i + 1}
            </div>
          </div>
        </div>
      );
    })();

  return (
    <div className="relative h-[200px] sm:h-[300px] w-full bg-[#0c0f17]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridValues.map((v, i) => {
          const gy = y(v);
          const isZero = v === 0;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={gy}
                y2={gy}
                stroke={isZero ? "#2a3350" : "#1c2235"}
                strokeWidth="1"
                strokeDasharray={isZero ? "0" : "2 6"}
                opacity={isZero ? 0.9 : 0.55}
              />
              <text
                x={width - padding.right + 8}
                y={gy + 4}
                fill="#4a5568"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="10"
                fontWeight="500"
                style={{ letterSpacing: "0.04em" }}
              >
                {compactCurrency(v)}
              </text>
            </g>
          );
        })}

        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#2a3350"
          strokeDasharray="3 4"
        />

        <path d={areaPath} fill={`url(#${areaId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <circle
          cx={x(series.length - 1)}
          cy={y(last)}
          r="9"
          fill={stroke}
          opacity="0.18"
        />
        <circle
          cx={x(series.length - 1)}
          cy={y(last)}
          r="3.5"
          fill={stroke}
        />

        {hover && (
          <g pointerEvents="none">
            <line
              x1={hover.x}
              x2={hover.x}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="#2a3350"
              strokeDasharray="3 4"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="4.5"
              fill={stroke}
              stroke="#080a0f"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {tooltip}
    </div>
  );
}

function niceTicks(min: number, max: number, count = 4): number[] {
  const range = max - min;
  if (range === 0) return [min];
  const rawStep = range / count;
  const exp = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * exp);
  const step = candidates.find((c) => c >= rawStep) ?? rawStep;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) {
    out.push(Number(v.toFixed(6)));
  }
  return out;
}

function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000)
    return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}
