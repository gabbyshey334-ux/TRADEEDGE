import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

function TrendArrow({
  direction,
  color,
}: {
  direction: "up" | "down" | "neutral";
  color: string;
}) {
  if (direction === "neutral") {
    return (
      <span
        className="inline-block h-[1px] w-3 align-middle"
        style={{ backgroundColor: color, opacity: 0.7 }}
      />
    );
  }
  const up = direction === "up";
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d={up ? "M5 1l4 5H6v3H4V6H1l4-5z" : "M5 9L1 4h3V1h2v3h3L5 9z"}
        fill={color}
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  sub,
  color = "#00e5b0",
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl bg-[#0c1018] border border-[#1a2030] p-6 overflow-hidden",
        "transition-all duration-150 ease-out",
        "hover:bg-[#0f1420] hover:border-[#2a3050] hover:shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, ${color}, ${color}00)`,
        }}
      />

      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#5a6580] font-mono">
          {label}
        </div>
        {trend && <TrendArrow direction={trend} color={color} />}
      </div>

      <div
        className="mt-3 font-heading text-4xl leading-none tracking-wide"
        style={{ color }}
      >
        {value}
      </div>

      {sub && (
        <div className="mt-2 text-[11px] text-[#5a6580] font-mono">
          {sub}
        </div>
      )}
    </div>
  );
}
