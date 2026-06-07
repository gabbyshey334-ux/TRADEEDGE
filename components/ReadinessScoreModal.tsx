"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

function ScoreCircle({
  score,
  grade,
  compact,
}: {
  score: number;
  grade: string;
  compact?: boolean;
}) {
  const radius = compact ? 54 : 62;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const dashOffset = circumference * (1 - progress);
  const color = scoreColor(score);
  const gradientId = "readiness-score-ring";

  return (
    <div className="flex justify-center py-1 sm:py-2">
      <div
        className={cn(
          "relative",
          compact ? "h-[140px] w-[140px]" : "h-[168px] w-[168px]"
        )}
      >
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
            className={cn(
              "font-mono font-bold leading-none tabular-nums",
              compact ? "text-[44px]" : "text-[52px]"
            )}
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
    <ul className="space-y-2.5 sm:space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 font-body text-[12px] leading-snug text-[#8892a4] sm:leading-relaxed"
        >
          <span
            className="mt-[6px] h-1 w-1 shrink-0 rounded-full sm:mt-[7px]"
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
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ReadinessScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  const ruleAnalysis = data?.ruleAnalysis ?? [];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="readiness-score-title"
    >
      <button
        type="button"
        aria-label="Close readiness score"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm sm:bg-black/75"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden bg-[#0c0f17]",
          "h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[min(90vh,720px)] sm:max-w-md",
          "border-[#1c2235] sm:rounded-2xl sm:border",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:shadow-[0_32px_64px_rgba(0,0,0,0.55)]",
          "animate-fadeInSoft"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile sheet handle */}
        <div className="flex shrink-0 justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#2a3350]" aria-hidden />
        </div>

        {/* Header */}
        <div
          className={cn(
            "shrink-0 border-b border-[#1c2235] bg-[#080a0f]",
            "px-4 pb-3 pt-1 sm:px-5 sm:pb-4 sm:pt-4",
            "pt-[max(0.25rem,env(safe-area-inset-top))]"
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex min-h-[44px] items-center gap-1.5 rounded-lg",
                "px-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8892a4]",
                "transition-colors hover:text-[#e8edf5] active:bg-[#111520]"
              )}
            >
              <span aria-hidden className="text-base leading-none">
                ←
              </span>
              Back
            </button>
            <EliteBadge />
          </div>

          <p
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#4a5568]"
            id="readiness-score-title"
          >
            AI Readiness Score
          </p>
          <p className="mt-1 truncate font-display text-base font-bold text-[#e8edf5] sm:text-lg">
            {firmName}
          </p>
          <p className="truncate font-mono text-[11px] text-[#5a6580]">
            {challengeType}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {loading && !data ? (
            <div className="flex flex-col items-center py-10 sm:py-12">
              <div className="relative h-[140px] w-[140px] sm:h-[168px] sm:w-[168px]">
                <div className="absolute inset-0 rounded-full border-[10px] border-[#1c2235]" />
                <div className="absolute inset-0 animate-pulse rounded-full border-[10px] border-[#f59e0b]/30 border-t-[#f59e0b]" />
              </div>
              <span className="mt-6 animate-pulse font-mono text-[10px] uppercase tracking-[0.2em] text-[#f59e0b]">
                Analyzing challenge readiness...
              </span>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 min-h-[44px] px-4 font-mono text-[10px] uppercase tracking-wider text-[#4a5568] transition-colors hover:text-[#8892a4]"
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
                className="mt-4 min-h-[44px] px-4 font-mono text-[10px] uppercase tracking-wider text-[#4a5568] transition-colors hover:text-[#8892a4]"
              >
                ↻ Retry
              </button>
            </div>
          ) : data ? (
            <>
              <ScoreCircle score={data.score} grade={data.grade} compact />

              <p className="mt-3 text-center font-body text-[13px] leading-relaxed text-[#8892a4] sm:mx-auto sm:mt-4 sm:max-w-[34ch]">
                {data.summary}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 border-t border-[#1c2235] pt-5 min-[400px]:grid-cols-2 min-[400px]:gap-4 sm:mt-6">
                <div>
                  <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
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
                  <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
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
                    className="flex min-h-[44px] w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#4a5568] transition-colors hover:text-[#8892a4]"
                  >
                    <span>Rule-by-rule breakdown</span>
                    <span>{rulesExpanded ? "▲" : "▼"}</span>
                  </button>

                  {rulesExpanded ? (
                    <div className="mt-1 space-y-2">
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
          <div
            className={cn(
              "shrink-0 border-t border-[#1c2235] bg-[#080a0f] p-4",
              "pb-[max(1rem,env(safe-area-inset-bottom))]"
            )}
          >
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "w-full min-h-[48px] rounded-xl border border-[#1c2235] bg-[#111520]",
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
    </div>,
    document.body
  );
}
