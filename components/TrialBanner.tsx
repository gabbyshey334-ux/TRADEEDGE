import Link from "next/link";
import type { Plan } from "@/lib/types";

export interface TrialBannerProps {
  plan: Plan;
  trialEndsAt: string | null;
}

export function TrialBanner({ plan, trialEndsAt }: TrialBannerProps) {
  if (plan !== "starter" || !trialEndsAt) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  const urgency =
    daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "warn" : "calm";

  const shellClass =
    urgency === "critical"
      ? "bg-[#ff3b5c]/[0.06] border-b border-[#ff3b5c]/20"
      : urgency === "warn"
        ? "bg-[#f59e0b]/[0.06] border-b border-[#f59e0b]/20"
        : "bg-[#0c0f17] border-b border-[#1c2235]";

  const textClass =
    urgency === "critical"
      ? "text-[#ff3b5c]"
      : urgency === "warn"
        ? "text-[#f59e0b]"
        : "text-[#4a5568]";

  const icon = urgency === "critical" ? "🔴 " : urgency === "warn" ? "⚠ " : "⏱ ";

  return (
    <div
      className={`-mx-4 sm:-mx-6 lg:-mx-8 mb-4 lg:mb-6 w-auto px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2 ${shellClass}`}
    >
      <div className="flex flex-wrap items-center gap-y-2 min-w-0">
        <span className={`font-mono text-[11px] ${textClass}`}>
          {icon}
          {daysLeft} days left on your free trial
        </span>
        <span className="bg-[#00ff88]/10 border border-[#00ff88]/20 font-mono text-[9px] text-[#00ff88] tracking-widest px-2 py-0.5 rounded ml-0 sm:ml-3">
          USE CODE: FOUNDER20 FOR 20% OFF
        </span>
      </div>

      <Link
        href="/dashboard/billing"
        className="shrink-0 self-start sm:self-auto bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 rounded-lg hover:shadow-[0_0_12px_rgba(0,255,136,0.25)] transition-all duration-200"
      >
        {daysLeft <= 3 ? "UPGRADE NOW →" : "UPGRADE →"}
      </Link>
    </div>
  );
}
