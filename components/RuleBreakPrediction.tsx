"use client";

import { useCallback, useEffect, useState } from "react";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

interface RuleBreakPredictionProps {
  plan: Plan;
}

interface RuleBreakPattern {
  trigger: string;
  behavior: string;
  frequency: string;
}

interface RuleBreakPredictionData {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  patterns: RuleBreakPattern[];
  warning: string;
  prevention: string;
  cached_at: string;
}

const RISK_BANNERS = {
  low: {
    className:
      "bg-[#00ff88]/[0.06] border-[#00ff88]/20 text-[#00ff88]",
    message: "● LOW RISK — patterns look healthy",
  },
  medium: {
    className:
      "bg-[#f59e0b]/[0.06] border-[#f59e0b]/20 text-[#f59e0b]",
    message: "▲ MEDIUM RISK — watch your next session",
  },
  high: {
    className:
      "bg-[#ff3b5c]/[0.06] border-[#ff3b5c]/20 text-[#ff3b5c]",
    message: "⚠ HIGH RISK — rule break likely",
  },
} as const;

function riskBarColor(score: number): string {
  if (score <= 33) return "#00ff88";
  if (score <= 66) return "#f59e0b";
  return "#ff3b5c";
}

export function RuleBreakPrediction({ plan }: RuleBreakPredictionProps) {
  const [data, setData] = useState<RuleBreakPredictionData | null>(null);
  const [loading, setLoading] = useState(plan === "elite");
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async (refresh = false) => {
    if (plan !== "elite") return;

    setLoading(true);
    setError(null);

    try {
      const url = refresh
        ? "/api/ai/rule-break-prediction?refresh=true"
        : "/api/ai/rule-break-prediction";
      const res = await fetch(url);
      const body = (await res.json()) as RuleBreakPredictionData & {
        error?: string;
      };

      if (!res.ok) {
        setError(body.error ?? "Failed to load rule break prediction.");
        setData(null);
        return;
      }

      setData(body);
    } catch {
      setError("Failed to load rule break prediction.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (plan === "elite") {
      void fetchPrediction(false);
    }
  }, [plan, fetchPrediction]);

  const banner = data ? RISK_BANNERS[data.riskLevel] : null;
  const barColor = data ? riskBarColor(data.riskScore) : "#1c2235";
  const barWidth = data
    ? `${Math.min(Math.max(data.riskScore, 0), 100)}%`
    : "0%";

  return (
    <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
      <div className="flex items-center justify-between border-b border-[#1c2235] bg-[#080a0f] px-5 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
          RULE BREAK PREDICTION
        </span>
        <span className="rounded border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#f59e0b]">
          ★ ELITE
        </span>
      </div>

      {plan !== "elite" ? (
        <div className="relative min-h-[280px]">
          <LockedFeaturePanel
            targetPlan="elite"
            featureName="Rule Break Prediction"
            featureDescription="AI detects when you are about to break your trading rules before it happens."
          />
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-8">
          <span className="animate-pulse font-mono text-2xl text-[#00ff88]">
            _
          </span>
          <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a5568]">
            ANALYZING BEHAVIORAL PATTERNS...
          </span>
        </div>
      ) : error ? (
        <div className="px-5 py-8 text-center">
          <p className="font-body text-[13px] text-[#ff3b5c]">{error}</p>
          <button
            type="button"
            onClick={() => void fetchPrediction(true)}
            className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[#4a5568] transition-colors hover:text-[#8892a4]"
          >
            ↻ RETRY
          </button>
        </div>
      ) : data && banner ? (
        <>
          <div
            className={cn(
              "border-b border-[#1c2235] px-5 py-3 font-mono text-[11px] tracking-[0.1em]",
              banner.className
            )}
          >
            {banner.message}
          </div>

          <div className="px-5 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-widest text-[#4a5568]">
                RISK SCORE
              </span>
              <span className="font-mono text-[11px] text-[#8892a4]">
                {data.riskScore}/100
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[#1c2235] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: barWidth, backgroundColor: barColor }}
              />
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
              DETECTED PATTERNS
            </div>
            {data.patterns.map((pattern) => (
              <div
                key={`${pattern.trigger}-${pattern.behavior}`}
                className="mb-2 rounded-lg border border-[#1c2235] bg-[#080a0f] p-3 last:mb-0"
              >
                <div className="mb-1 font-mono text-[11px] text-[#f59e0b]">
                  {pattern.trigger}
                </div>
                <p className="font-body text-[12px] text-[#8892a4]">
                  {pattern.behavior}
                </p>
                <p className="mt-1 font-mono text-[10px] text-[#4a5568]">
                  {pattern.frequency}
                </p>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <div className="mb-3 rounded-lg border border-[#ff3b5c]/20 bg-[#ff3b5c]/[0.04] px-4 py-3">
              <p className="font-body text-[13px] text-[#ff3b5c]">
                {data.warning}
              </p>
            </div>
            <div className="rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/[0.04] px-4 py-3">
              <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#00ff88]">
                PREVENTION
              </div>
              <p className="font-body text-[13px] text-[#e8edf5]">
                {data.prevention}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
