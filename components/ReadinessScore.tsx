"use client";

import { useCallback, useEffect, useState } from "react";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

interface ReadinessScoreProps {
  plan: Plan;
}

interface ReadinessScoreData {
  score: number;
  grade: string;
  summary: string;
  strengths: string[];
  warnings: string[];
  recommendation: string;
  cached_at: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#00ff88";
  if (score >= 60) return "#f59e0b";
  return "#ff3b5c";
}

function ScoreCircle({ score, grade }: { score: number; grade: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const dashOffset = circumference * (1 - progress);
  const color = scoreColor(score);

  return (
    <div className="flex justify-center">
      <div className="relative h-[140px] w-[140px]">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#1c2235"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-4xl font-bold"
            style={{ color }}
          >
            {score}
          </span>
          <span className="font-mono text-sm text-[#8892a4]">{grade}</span>
        </div>
      </div>
    </div>
  );
}

export function ReadinessScore({ plan }: ReadinessScoreProps) {
  const [data, setData] = useState<ReadinessScoreData | null>(null);
  const [loading, setLoading] = useState(plan === "elite");
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async (refresh = false) => {
    if (plan !== "elite") return;

    setLoading(true);
    setError(null);

    try {
      const url = refresh
        ? "/api/ai/readiness-score?refresh=true"
        : "/api/ai/readiness-score";
      const res = await fetch(url);
      const body = (await res.json()) as ReadinessScoreData & { error?: string };

      if (!res.ok) {
        setError(body.error ?? "Failed to load readiness score.");
        setData(null);
        return;
      }

      setData(body);
    } catch {
      setError("Failed to load readiness score.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (plan === "elite") {
      void fetchScore(false);
    }
  }, [plan, fetchScore]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
      <div className="flex items-center justify-between border-b border-[#1c2235] bg-[#080a0f] px-5 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
          AI READINESS SCORE
        </span>
        <span className="rounded border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#f59e0b]">
          ★ ELITE
        </span>
      </div>

      {plan !== "elite" ? (
        <div className="relative min-h-[280px]">
          <LockedFeaturePanel
            targetPlan="elite"
            featureName="AI Readiness Score"
            featureDescription="Get a real-time score showing how prepared you are to trade based on your performance data."
          />
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-8">
          <span className="animate-pulse font-mono text-2xl text-[#00ff88]">
            _
          </span>
          <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a5568]">
            ANALYZING PERFORMANCE...
          </span>
        </div>
      ) : error ? (
        <div className="px-5 py-8 text-center">
          <p className="font-body text-[13px] text-[#ff3b5c]">{error}</p>
          <button
            type="button"
            onClick={() => void fetchScore(true)}
            className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[#4a5568] transition-colors hover:text-[#8892a4]"
          >
            ↻ RETRY
          </button>
        </div>
      ) : data ? (
        <div className="px-5 py-5">
          <ScoreCircle score={data.score} grade={data.grade} />

          <p className="mb-5 mt-3 text-center font-body text-[13px] text-[#8892a4]">
            {data.summary}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#00ff88]">
                ✓ STRENGTHS
              </div>
              <ul className="space-y-1.5">
                {data.strengths.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-1.5 font-body text-[12px] text-[#8892a4]"
                  >
                    <span className="text-[#00ff88]">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#f59e0b]">
                ⚠ WATCH
              </div>
              <ul className="space-y-1.5">
                {data.warnings.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-1.5 font-body text-[12px] text-[#8892a4]"
                  >
                    <span className="text-[#f59e0b]">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#1c2235] bg-[#080a0f] px-4 py-3">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
              COACHING NOTE
            </div>
            <p className="font-body text-[13px] italic text-[#e8edf5]">
              {data.recommendation}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void fetchScore(true)}
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider text-[#4a5568]",
                "transition-colors hover:text-[#8892a4]"
              )}
            >
              ↻ REFRESH SCORE
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
