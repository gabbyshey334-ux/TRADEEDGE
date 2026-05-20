"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Trade } from "@/lib/types";
import { cumulativeEquity, formatCurrency } from "@/lib/utils";

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
        className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-[#1a2030] bg-[#0c1018] overflow-hidden"
        style={{ height }}
      >
        <div className="section-label">Equity Curve</div>
        <div className="text-sm text-[#8892a4] font-sans">
          Log at least two trades to see your equity curve.
        </div>
      </div>
    );
  }

  const last = series[series.length - 1].equity;
  const positive = last >= 0;
  const stroke = positive ? "#00e5b0" : "#ff4d6d";

  return (
    <div className="relative rounded-lg border border-[#1a2030] bg-[#0c1018] overflow-hidden transition-colors duration-150 hover:border-[#2a3050]">
      {/* Card header (padded) */}
      <div className="flex flex-col gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#1a2030]/60">
        <div className="min-w-0">
          <div className="section-label">Equity Curve</div>
          <div
            className="data-value mt-3 leading-none break-words"
            style={{
              color: stroke,
              fontSize: "clamp(28px, 4vw, 38px)",
            }}
          >
            {formatCurrency(last)}
          </div>
          <div
            className="mt-2 font-mono uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.24em",
              color: "#3a4560",
            }}
          >
            Cumulative P&L · {series.length} trades
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#1a2030] bg-[#080b11] px-2.5 py-1 text-[9px] uppercase tracking-[0.28em] text-[#8892a4] font-mono">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: stroke }}
            />
            Live
          </span>
        </div>
      </div>

      {/* Chart body — bleeds edge-to-edge */}
      <EquityCanvas series={series} height={height} stroke={stroke} fillIdBase={fillIdBase} />
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

  // Build clean horizontal grid values using a "nice" step.
  const gridValues = niceTicks(min, max, 4);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const xCoord = relX * scaleX;
    // Nearest index
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
          <div className="rounded-sm border border-[#2a3050] bg-[#080b11] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
            <div
              className="font-mono uppercase"
              style={{
                fontSize: "9px",
                letterSpacing: "0.28em",
                color: "#5a6580",
              }}
            >
              {new Date(point.date).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </div>
            <div
              className="data-value mt-1.5"
              style={{
                color: point.equity >= 0 ? "#00e5b0" : "#ff4d6d",
                fontSize: "15px",
              }}
            >
              {formatCurrency(point.equity)}
            </div>
            <div
              className="mt-1 font-mono uppercase"
              style={{
                fontSize: "9px",
                letterSpacing: "0.24em",
                color: "#3a4560",
              }}
            >
              Trade {hover.i + 1}
            </div>
          </div>
        </div>
      );
    })();

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
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
                stroke={isZero ? "#2a3050" : "#1a2030"}
                strokeWidth="1"
                strokeDasharray={isZero ? "0" : "2 6"}
                opacity={isZero ? 0.9 : 0.55}
              />
              <text
                x={width - padding.right + 8}
                y={gy + 4}
                fill="#5a6580"
                fontFamily="var(--font-dm-mono), ui-monospace, monospace"
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
          stroke="#2a3050"
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

        {/* Last point pulse */}
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

        {/* Hover crosshair */}
        {hover && (
          <g pointerEvents="none">
            <line
              x1={hover.x}
              x2={hover.x}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="#2a3050"
              strokeDasharray="3 4"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="4.5"
              fill={stroke}
              stroke="#06080d"
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
