"use client";

import { useCallback, useEffect, useState } from "react";
import { EliteBadge } from "@/components/EliteBadge";
import { cn } from "@/lib/utils";

export interface ReadinessScoreModalProps {
  open: boolean;
  onClose: () => void;
  firmName: string;
  challengeType: string;
  profitTarget: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  minTradingDays: number;
  accountSize: number;
}

interface RuleAnalysisItem {
  rule: string;
  traderStat: string;
  assessment: "SAFE" | "AT RISK" | "DANGER";
  note: string;
}

interface ReadinessScoreData {
  score: number;
  grade: string;
  summary: string;
  ruleAnalysis: RuleAnalysisItem[];
  estimatedPassDays: number;
  biggestRisk: string;
  recommendation: string;
}

const ASSESSMENT_STYLES: Record<
  RuleAnalysisItem["assessment"],
  string
> = {
  SAFE: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
  "AT RISK": "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  DANGER: "bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/20",
};

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
          <span className="font-mono text-4xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="font-mono text-sm text-[#8892a4]">{grade}</span>
        </div>
      </div>
    </div>
  );
}

export function ReadinessScoreModal({
  open,
  onClose,
  firmName,
  challengeType,
  profitTarget,
  dailyDrawdown,
  maxDrawdown,
  minTradingDays,
  accountSize,
}: ReadinessScoreModalProps) {
  const [data, setData] = useState<ReadinessScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(
    async (refresh = false) => {
      const cacheKey = `readiness_${firmName}_${challengeType}`
        .replace(/\s+/g, "_")
        .toLowerCase();

      setError(null);

      let hasCachedDisplay = false;
      const localCache = localStorage.getItem(cacheKey);
      if (localCache) {
        try {
          const parsed = JSON.parse(localCache) as ReadinessScoreData;
          setData(parsed);
          setLoading(false);
          hasCachedDisplay = true;
        } catch {
          // ignore invalid local cache
        }
      }

      if (!hasCachedDisplay) {
        setLoading(true);
      }

      try {
        const res = await fetch("/api/ai/readiness-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firmName,
            challengeType,
            profitTarget,
            dailyDrawdown,
            maxDrawdown,
            minTradingDays,
            accountSize,
            refresh,
          }),
        });
        const body = (await res.json()) as ReadinessScoreData & {
          error?: string;
        };

        if (!res.ok) {
          if (!hasCachedDisplay) {
            setError(body.error ?? "Failed to load readiness score.");
            setData(null);
          }
          return;
        }

        setData(body);
        localStorage.setItem(cacheKey, JSON.stringify(body));
      } catch {
        if (!hasCachedDisplay) {
          setError("Failed to load readiness score.");
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      firmName,
      challengeType,
      profitTarget,
      dailyDrawdown,
      maxDrawdown,
      minTradingDays,
      accountSize,
    ]
  );

  useEffect(() => {
    if (open) {
      void fetchScore(false);
    }
  }, [open, fetchScore]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="readiness-score-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#1c2235] bg-[#0c0f17]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 font-mono text-[#4a5568] transition-colors hover:text-[#8892a4]"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="border-b border-[#1c2235] px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <h2
                id="readiness-score-title"
                className="font-display text-xl font-bold text-[#e8edf5] truncate"
              >
                {firmName}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-[#4a5568] truncate">
                {challengeType}
              </p>
            </div>
            <EliteBadge />
          </div>
        </div>

        <div className="px-5 py-5">
          {loading && !data ? (
            <div className="flex flex-col items-center py-10">
              <span className="animate-pulse font-mono text-2xl text-[#00ff88]">
                _
              </span>
              <span className="mt-3 animate-pulse font-mono text-[10px] uppercase tracking-[0.2em] text-[#00ff88]">
                ANALYZING CHALLENGE READINESS...
              </span>
            </div>
          ) : error && !data ? (
            <div className="py-8 text-center">
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
            <>
              <ScoreCircle score={data.score} grade={data.grade} />
              <p className="mt-3 text-center font-mono text-[11px] text-[#4a5568]">
                READINESS FOR {firmName} {challengeType}
              </p>
              <p className="mt-2 text-center font-body text-[13px] text-[#8892a4]">
                {data.summary}
              </p>

              <div className="mt-5">
                {data.ruleAnalysis.map((item) => (
                  <div
                    key={`${item.rule}-${item.traderStat}`}
                    className="grid grid-cols-3 gap-3 border-b border-[#1c2235] py-3"
                  >
                    <div className="font-mono text-[11px] text-[#8892a4]">
                      {item.rule}
                    </div>
                    <div className="font-mono text-[11px] font-medium text-[#e8edf5]">
                      {item.traderStat}
                    </div>
                    <div className="flex justify-end">
                      <span
                        className={cn(
                          "rounded border px-2 py-0.5 font-mono text-[9px] tracking-widest",
                          ASSESSMENT_STYLES[item.assessment]
                        )}
                      >
                        {item.assessment}
                      </span>
                    </div>
                    <p className="col-span-3 font-body text-[12px] text-[#4a5568]">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/[0.04] px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00ff88]">
                  ESTIMATED PASS TIME
                </div>
                <p className="mt-1 font-mono text-xl font-bold text-[#00ff88]">
                  {data.estimatedPassDays} trading days at current pace
                </p>
              </div>

              <div className="mt-3 rounded-lg border border-[#ff3b5c]/20 bg-[#ff3b5c]/[0.04] px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff3b5c]">
                  BIGGEST RISK
                </div>
                <p className="mt-1 font-body text-[13px] text-[#e8edf5]">
                  {data.biggestRisk}
                </p>
              </div>

              <div className="mt-3 rounded-lg border border-[#1c2235] bg-[#0c0f17] px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                  COACHING NOTE
                </div>
                <p className="mt-1 font-body text-[13px] italic text-[#8892a4]">
                  {data.recommendation}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
