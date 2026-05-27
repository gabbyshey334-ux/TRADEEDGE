import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  /**
   * Kept for backwards compatibility with existing call sites — direction is
   * folded into the sparkline shape rather than rendered as a separate arrow.
   */
  trend?: "up" | "down" | "neutral";
  /**
   * Optional sparkline values (0..1 ideally). When omitted the card falls back
   * to a clean number-only layout, which is the more professional default.
   */
  spark?: number[];
  className?: string;
}

function accentWashClass(color: string): string {
  const map: Record<string, string> = {
    "#00ff88": "from-[#00ff88]/[0.03]",
    "#00e5b0": "from-[#00ff88]/[0.03]",
    "#0ea5e9": "from-[#0ea5e9]/[0.03]",
    "#0066ff": "from-[#0ea5e9]/[0.03]",
    "#a78bfa": "from-[#a78bfa]/[0.03]",
    "#b466ff": "from-[#a78bfa]/[0.03]",
    "#f59e0b": "from-[#f59e0b]/[0.03]",
    "#f0c040": "from-[#f59e0b]/[0.03]",
    "#ff3b5c": "from-[#ff3b5c]/[0.03]",
    "#ff4d6d": "from-[#ff3b5c]/[0.03]",
  };
  return map[color] ?? "from-[#00ff88]/[0.03]";
}

function valueColorClass(color: string): string {
  if (color === "#ff3b5c" || color === "#ff4d6d") return "text-[#ff3b5c]";
  if (color === "#00ff88" || color === "#00e5b0") return "text-[#00ff88]";
  if (color === "#0ea5e9" || color === "#0066ff") return "text-[#0ea5e9]";
  if (color === "#a78bfa" || color === "#b466ff") return "text-[#a78bfa]";
  if (color === "#f59e0b" || color === "#f0c040") return "text-[#f59e0b]";
  return "text-[#e8edf5]";
}

function Sparkline({
  points,
  color,
  trend,
}: {
  points?: number[];
  color: string;
  trend: "up" | "down" | "neutral";
}) {
  const synthetic =
    trend === "up"
      ? [0.4, 0.45, 0.42, 0.55, 0.6, 0.7, 0.78, 0.85]
      : trend === "down"
        ? [0.85, 0.78, 0.72, 0.66, 0.55, 0.4, 0.38, 0.3]
        : [0.5, 0.52, 0.48, 0.5, 0.52, 0.49, 0.5, 0.5];

  const data =
    points && points.length >= 2 ? normalize(points) : synthetic;
  const W = 56;
  const H = 16;
  const step = W / (data.length - 1);
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = H - v * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0 opacity-40"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalize(points: number[]): number[] {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  return points.map((p) => (p - min) / range);
}

export function StatCard({
  label,
  value,
  sub,
  color = "#00ff88",
  trend = "neutral",
  spark,
  className,
}: StatCardProps) {
  const isPositivePnl =
    color === "#00ff88" || color === "#00e5b0";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl",
        "bg-[#0c0f17] border border-[#1c2235] p-5",
        "hover:border-[#2a3350] transition-colors duration-200",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent",
          accentWashClass(color)
        )}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
            {label}
          </span>
          <Sparkline points={spark} color={color} trend={trend} />
        </div>

        <div
          className={cn(
            "mt-4 font-mono text-3xl font-bold tracking-tight leading-none break-words",
            valueColorClass(color),
            isPositivePnl && "glow-green-text"
          )}
        >
          {value}
        </div>

        {sub && (
          <div className="mt-2 pt-2 border-t border-[#1c2235] font-mono text-[11px] text-[#4a5568]">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
