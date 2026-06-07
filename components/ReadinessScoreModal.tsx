"use client";

import { useCallback, useEffect, useState } from "react";
import { EliteBadge } from "@/components/EliteBadge";
import { cn } from "@/lib/utils";

export interface ReadinessScoreModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
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
  strengths: string[];
  watch: string[];
  ruleAnalysis?: RuleAnalysisItem[];
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

function normalizeCachedData(raw: ReadinessScoreData): ReadinessScoreData {
  if (raw.strengths?.length && raw.watch?.length) return raw;

  const ruleAnalysis = raw.ruleAnalysis ?? [];
  const strengths =
    raw.strengths ??
    ruleAnalysis
      .filter((item) => item.assessment === "SAFE")
      .map((item) => item.note || `${item.rule}: ${item.traderStat}`);

  const watch =
    raw.watch ??
    ruleAnalysis
      .filter((item) => item.assessment !== "SAFE")
      .map((item) => item.note || `${item.rule}: ${item.traderStat}`);

  return {
    ...raw,
    strengths: strengths.length
      ? strengths
      : ["Journal patterns show areas of consistency for this challenge."],
    watch: watch.length
      ? watch
      : ["Monitor daily loss and max drawdown limits closely."],
  };
}

function ScoreCircle({ score, grade }: { score: number; grade: string }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const dashOffset = circumference * (1 - progress);
  const color = scoreColor(score);
  const gradientId = "readiness-score-ring";

  return (
    <div className="flex justify-center py-2">
      <div className="relative h-[168px] w-[168px]">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 140 140"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#1c2235"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700"
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-[52px] font-bold leading-none tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
          <span className="mt-1 font-mono text-base font-medium text-[#e8edf5]">
            {grade}
          </span>
        </div>
      </div>
    </div>
  );
}

function BulletList({
  items,
  dotColor,
}: {
  items: string[];
  dotColor: string;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 font-body text-[12px] leading-relaxed text-[#8892a4]"
        >
          <span
            className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReadinessScoreModal({
  open,
  onClose,
  accountId,
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
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const fetchScore = useCallback(
    async (refresh = false) => {
      const cacheKey = `readiness_${accountId}`;

      setError(null);

      let hasCachedDisplay = false;
      const localCache = localStorage.getItem(cacheKey);
      if (localCache) {
        try {
          const parsed = normalizeCachedData(
            JSON.parse(localCache) as ReadinessScoreData
          );
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
            accountId,
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

        const normalized = normalizeCachedData(body);
        setData(normalized);
        localStorage.setItem(cacheKey, JSON.stringify(normalized));
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
      accountId,
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
      setRulesExpanded(false);
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

  const ruleAnalysis = data?.ruleAnalysis ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="readiness-score-title"
    >
      <div
        className={cn(
          "relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden",
          "rounded-t-2xl border border-[#1c2235] bg-[#0c0f17] sm:rounded-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#1c2235] bg-[#080a0f] px-5 pb-4 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex min-h-[44px] min-w-[44px] items-center gap-1.5",
                "font-mono text-[11px] uppercase tracking-[0.12em] text-[#8892a4]",
                "transition-colors hover:text-[#e8edf5]"
              )}
            >
              <span aria-hidden className="text-base leading-none">
                ←
              </span>
              <span className="hidden sm:inline">Back</span>
            </button>
            <EliteBadge />
          </div>

          <p
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#4a5568]"
            id="readiness-score-title"
          >
            AI Readiness Score
          </p>
          <p className="mt-1 truncate font-display text-lg font-bold text-[#e8edf5]">
            {firmName}
          </p>
          <p className="truncate font-mono text-[11px] text-[#5a6580]">
            {challengeType}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading && !data ? (
            <div className="flex flex-col items-center py-12">
              <div className="relative h-[168px] w-[168px]">
                <div className="absolute inset-0 rounded-full border-[10px] border-[#1c2235]" />
                <div className="absolute inset-0 animate-pulse rounded-full border-[10px] border-[#f59e0b]/30 border-t-[#f59e0b]" />
              </div>
              <span className="mt-6 animate-pulse font-mono text-[10px] uppercase tracking-[0.2em] text-[#f59e0b]">
                Analyzing challenge readiness...
              </span>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 font-mono text-[10px] uppercase tracking-wider text-[#4a5568] transition-colors hover:text-[#8892a4]"
              >
                Cancel
              </button>
            </div>
          ) : error && !data ? (
            <div className="py-10 text-center">
              <p className="font-body text-[13px] text-[#ff3b5c]">{error}</p>
              <button
                type="button"
                onClick={() => void fetchScore(true)}
                className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[#4a5568] transition-colors hover:text-[#8892a4]"
              >
                ↻ Retry
              </button>
            </div>
          ) : data ? (
            <>
              <ScoreCircle score={data.score} grade={data.grade} />

              <p className="mx-auto mt-4 max-w-[32ch] text-center font-body text-[13px] leading-relaxed text-[#8892a4]">
                {data.summary}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#1c2235] pt-5">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#00ff88]">
                      +
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ff88]">
                      Strengths
                    </span>
                  </div>
                  <BulletList items={data.strengths} dotColor="#00ff88" />
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#f59e0b]">
                      −
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#f59e0b]">
                      Watch
                    </span>
                  </div>
                  <BulletList items={data.watch} dotColor="#f59e0b" />
                </div>
              </div>

              {ruleAnalysis.length > 0 ? (
                <div className="mt-5 border-t border-[#1c2235] pt-4">
                  <button
                    type="button"
                    onClick={() => setRulesExpanded((v) => !v)}
                    className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#4a5568] transition-colors hover:text-[#8892a4]"
                  >
                    <span>Rule-by-rule breakdown</span>
                    <span>{rulesExpanded ? "▲" : "▼"}</span>
                  </button>

                  {rulesExpanded ? (
                    <div className="mt-3 space-y-2">
                      {ruleAnalysis.map((item) => (
                        <div
                          key={`${item.rule}-${item.traderStat}`}
                          className="rounded-lg border border-[#1c2235] bg-[#080a0f] px-3 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#8892a4]">
                              {item.rule}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[8px] tracking-widest",
                                ASSESSMENT_STYLES[item.assessment]
                              )}
                            >
                              {item.assessment}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-[11px] text-[#e8edf5]">
                            {item.traderStat}
                          </p>
                          <p className="mt-1 font-body text-[11px] text-[#4a5568]">
                            {item.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 rounded-xl border border-[#1c2235] bg-[#080a0f] px-4 py-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                  Coaching Note
                </div>
                <p className="mt-2 font-body text-[13px] italic leading-relaxed text-[#e8edf5]">
                  {data.recommendation}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        {data || error ? (
          <div className="shrink-0 border-t border-[#1c2235] bg-[#080a0f] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "w-full rounded-xl border border-[#1c2235] bg-[#111520] py-3.5",
                "font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#e8edf5]",
                "transition-all duration-200 hover:border-[#2a3350] hover:bg-[#1c2235]",
                "active:scale-[0.99]"
              )}
            >
              ← Back to Challenges
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
