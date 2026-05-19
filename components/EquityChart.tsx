import type { Trade } from "@/lib/types";
import { cumulativeEquity, formatCurrency } from "@/lib/utils";

interface EquityChartProps {
  trades: Trade[];
  height?: number;
}

export function EquityChart({ trades, height = 260 }: EquityChartProps) {
  const series = cumulativeEquity(trades);

  if (series.length < 2) {
    return (
      <div
        className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-[#1a2030] bg-[#0c1018] overflow-hidden"
        style={{ height }}
      >
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: "linear-gradient(to right, #00e5b0, transparent)",
          }}
        />
        <div className="text-[10px] uppercase tracking-[0.32em] text-[#5a6580] font-mono">
          Equity Curve
        </div>
        <div className="text-sm text-[#8892a4] font-mono">
          Add at least two trades to see your equity curve.
        </div>
      </div>
    );
  }

  const width = 1000;
  const padding = { top: 24, right: 16, bottom: 28, left: 16 };
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
  const positive = last >= 0;
  const stroke = positive ? "#00e5b0" : "#ff4d6d";
  const fillId = positive ? "areaGreen" : "areaRed";

  const areaPath = `M ${x(0)},${y(0)} L ${series
    .map((p, i) => `${x(i)},${y(p.equity)}`)
    .join(" L ")} L ${x(series.length - 1)},${y(0)} Z`;

  const linePath = `M ${series
    .map((p, i) => `${x(i)},${y(p.equity)}`)
    .join(" L ")}`;

  const zeroY = y(0);

  const gridLines = 4;
  const gridYs = Array.from({ length: gridLines + 1 }, (_, idx) =>
    padding.top + (idx / gridLines) * innerH
  );

  return (
    <div className="relative rounded-xl border border-[#1a2030] bg-[#0c1018] p-6 overflow-hidden transition-colors duration-150 hover:border-[#2a3050]">
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, ${stroke}, ${stroke}00)`,
        }}
      />
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-[#5a6580] font-mono">
            Equity Curve
          </div>
          <div
            className="mt-2 font-heading text-4xl leading-none tracking-wide"
            style={{ color: stroke }}
          >
            {formatCurrency(last)}
          </div>
          <div className="mt-2 text-[11px] text-[#5a6580] font-mono">
            Cumulative P&L · all trades
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1a2030] bg-[#080b11] px-2.5 py-1 text-[9px] uppercase tracking-[0.24em] text-[#8892a4] font-mono">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: stroke }}
            />
            Live
          </span>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[#5a6580] font-mono">
            {series.length} trades
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5b0" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#00e5b0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ff4d6d" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((gy, i) => (
          <line
            key={i}
            x1={padding.left}
            x2={width - padding.right}
            y1={gy}
            y2={gy}
            stroke="#1a2030"
            strokeWidth="1"
            strokeDasharray={i === gridLines / 2 ? "0" : "2 6"}
            opacity={i === gridLines / 2 ? 0.8 : 0.5}
          />
        ))}

        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#2a3050"
          strokeDasharray="3 4"
        />

        <path d={areaPath} fill={`url(#${fillId})`} />
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
          r="4"
          fill={stroke}
        />
        <circle
          cx={x(series.length - 1)}
          cy={y(last)}
          r="9"
          fill={stroke}
          opacity="0.18"
        />
      </svg>
    </div>
  );
}
