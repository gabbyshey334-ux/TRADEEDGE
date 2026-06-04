"use client";

import { useCallback, useEffect, useState } from "react";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

interface DailyCoachingReportProps {
  plan: Plan;
}

interface DailyCoachingKeyMetrics {
  trades: number;
  pnl: string;
  winRate: string;
  bestTrade: string;
  worstTrade: string;
}

interface DailyCoachingData {
  date: string;
  sessionRating: "A" | "B" | "C" | "D" | "F";
  headline: string;
  keyMetrics: DailyCoachingKeyMetrics;
  coachingInsight: string;
  tomorrowFocus: string;
  mentalNote: string;
  cached_at?: string;
}

function formatHeaderDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ratingBannerClass(rating: DailyCoachingData["sessionRating"]): string {
  if (rating === "A" || rating === "B") {
    return "bg-[#00ff88]/[0.06] text-[#00ff88]";
  }
  if (rating === "C") {
    return "bg-[#f59e0b]/[0.06] text-[#f59e0b]";
  }
  return "bg-[#ff3b5c]/[0.06] text-[#ff3b5c]";
}

function pnlColor(pnl: string): string {
  if (pnl.includes("-")) return "#ff3b5c";
  if (pnl !== "$0.00" && pnl !== "$0") return "#00ff88";
  return "#e8edf5";
}

export function DailyCoachingReport({ plan }: DailyCoachingReportProps) {
  const [data, setData] = useState<DailyCoachingData | null>(null);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(plan === "elite");
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (refresh = false) => {
    if (plan !== "elite") return;

    setLoading(true);
    setError(null);
    setEmpty(false);

    try {
      const url = refresh
        ? "/api/ai/daily-coaching?refresh=true"
        : "/api/ai/daily-coaching";
      const res = await fetch(url);
      const body = (await res.json()) as DailyCoachingData & {
        error?: string;
        empty?: boolean;
      };

      if (!res.ok) {
        setError(body.error ?? "Failed to load daily coaching report.");
        setData(null);
        return;
      }

      if (body.empty) {
        setEmpty(true);
        setData(null);
        return;
      }

      setData(body);
    } catch {
      setError("Failed to load daily coaching report.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (plan === "elite") {
      void fetchReport(false);
    }
  }, [plan, fetchReport]);

  const metrics = data
    ? [
        { label: "TRADES", value: String(data.keyMetrics.trades) },
        {
          label: "P&L",
          value: data.keyMetrics.pnl,
          color: pnlColor(data.keyMetrics.pnl),
        },
        { label: "WIN RATE", value: data.keyMetrics.winRate },
        { label: "BEST", value: data.keyMetrics.bestTrade },
        { label: "WORST", value: data.keyMetrics.worstTrade },
      ]
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
      <div className="flex items-center justify-between border-b border-[#1c2235] bg-[#080a0f] px-5 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
          DAILY COACHING REPORT
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#4a5568]">
            {formatHeaderDate()}
          </span>
          <span className="rounded border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#f59e0b]">
            ★ ELITE
          </span>
        </div>
      </div>

      {plan !== "elite" ? (
        <div className="relative min-h-[280px]">
          <LockedFeaturePanel
            targetPlan="elite"
            featureName="Daily Coaching Reports"
            featureDescription="Get an AI-generated daily briefing after every session with coaching insights and focus points for tomorrow."
          />
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-8">
          <span className="animate-pulse font-mono text-2xl text-[#00ff88]">
            _
          </span>
          <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a5568]">
            GENERATING DAILY BRIEFING...
          </span>
        </div>
      ) : error ? (
        <div className="px-5 py-8 text-center">
          <p className="font-body text-[13px] text-[#ff3b5c]">{error}</p>
          <button
            type="button"
            onClick={() => void fetchReport(true)}
            className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[#4a5568] transition-colors hover:text-[#8892a4]"
          >
            ↻ RETRY
          </button>
        </div>
      ) : empty ? (
        <div className="py-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a5568]">
            NO SESSION DATA YET
          </div>
          <p className="mt-2 font-body text-[13px] text-[#4a5568]">
            Log your first trade to receive your daily coaching report.
          </p>
        </div>
      ) : data ? (
        <>
          <div
            className={cn(
              "border-b border-[#1c2235] px-5 py-3 font-mono text-[11px] tracking-[0.1em]",
              ratingBannerClass(data.sessionRating)
            )}
          >
            SESSION RATING: {data.sessionRating} — {data.headline}
          </div>

          <div className="grid grid-cols-5 divide-x divide-[#1c2235] border-b border-[#1c2235] bg-[#080a0f]">
            {metrics.map((metric) => (
              <div key={metric.label} className="px-3 py-3 text-center sm:px-4">
                <div className="font-mono text-[9px] tracking-widest text-[#4a5568]">
                  {metric.label}
                </div>
                <div
                  className="mt-1 font-mono text-[13px] font-bold truncate"
                  style={{ color: metric.color ?? "#e8edf5" }}
                >
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div className="border-b border-[#1c2235] px-5 py-4">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
              COACH&apos;S INSIGHT
            </div>
            <p className="font-body text-[14px] leading-relaxed text-[#e8edf5]">
              {data.coachingInsight}
            </p>
          </div>

          <div className="border-b border-[#1c2235] bg-[#00ff88]/[0.02] px-5 py-4">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#00ff88]">
              TOMORROW&apos;S FOCUS
            </div>
            <p className="font-body text-[14px] font-medium text-[#e8edf5]">
              {data.tomorrowFocus}
            </p>
          </div>

          <div className="px-5 py-4">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#a78bfa]">
              MENTAL NOTE
            </div>
            <p className="font-body text-[13px] italic text-[#8892a4]">
              {data.mentalNote}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
