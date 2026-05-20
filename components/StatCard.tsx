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

function hexWithAlpha(hex: string, alphaHex: string): string {
  // hex like "#00e5b0" + alphaHex like "0a" -> "#00e5b00a"
  return `${hex}${alphaHex}`;
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
  // Build a tiny shape. If real points were provided we use them; otherwise
  // we synthesize a small representative curve tied to the trend.
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
      className="sparkline-track shrink-0"
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
  color = "#00e5b0",
  trend = "neutral",
  spark,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg",
        "border border-[#1a2030] border-l-2",
        "transition-all duration-150 ease-out",
        "hover:border-[#2a3050]",
        className
      )}
      style={{
        borderLeftColor: color,
        backgroundColor: "#0c1018",
        backgroundImage: `linear-gradient(180deg, ${hexWithAlpha(color, "0a")} 0%, ${hexWithAlpha(color, "00")} 80%)`,
      }}
    >
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-mono uppercase"
            style={{
              fontSize: "9px",
              letterSpacing: "0.32em",
              color: "#5a6580",
              lineHeight: 1,
            }}
          >
            {label}
          </span>
          <Sparkline points={spark} color={color} trend={trend} />
        </div>

        <div
          className="data-value mt-4 leading-none break-words"
          style={{
            color,
            fontSize: "clamp(28px, 4.2vw, 42px)",
          }}
        >
          {value}
        </div>

        {sub && (
          <div
            className="mt-3 font-mono uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.24em",
              color: "#3a4560",
              lineHeight: 1.2,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
