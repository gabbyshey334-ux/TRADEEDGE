"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EliteBadge } from "@/components/EliteBadge";
import { PageHeader } from "@/components/PageHeader";
import { PlanUpgradeModal } from "@/components/PlanUpgradeModal";
import { createCheckoutSession } from "@/lib/actions/billing";
import {
  handleBillingActionResult,
  PAYMENT_COMING_SOON_MESSAGE,
} from "@/lib/billing-client";
import { cn } from "@/lib/utils";
import type { AiReportType, Plan } from "@/lib/types";

const MODES: Array<{
  id: AiReportType;
  title: string;
  desc: string;
  color: string;
  Icon: () => JSX.Element;
}> = [
  {
    id: "session",
    title: "Session Debrief",
    desc: "Analyze your most recent trading session and surface mistakes and wins.",
    color: "#00ff88",
    Icon: SessionIcon,
  },
  {
    id: "psychology",
    title: "Psychology Analysis",
    desc: "Identify emotional patterns and biases that are leaking your edge.",
    color: "#a78bfa",
    Icon: PsychologyIcon,
  },
  {
    id: "edge",
    title: "Edge Report",
    desc: "Quantify your statistical edge by setup, session, and emotion.",
    color: "#f59e0b",
    Icon: EdgeIcon,
  },
];

interface AiCoachClientProps {
  tradeCount: number;
  plan: Plan;
  reportsThisMonth: number;
  monthlyLimit: number | null;
}

function usageLabel(
  plan: Plan,
  reportsThisMonth: number,
  monthlyLimit: number | null
): string {
  if (plan === "starter") return "UPGRADE TO PRO TO UNLOCK";
  if (plan === "elite") return "∞ UNLIMITED REPORTS · ELITE PLAN";
  if (monthlyLimit !== null) {
    return `${reportsThisMonth} / ${monthlyLimit} REPORTS USED · PRO PLAN`;
  }
  return `${reportsThisMonth} REPORTS USED · PRO PLAN`;
}

export function AiCoachClient({
  tradeCount,
  plan,
  reportsThisMonth,
  monthlyLimit,
}: AiCoachClientProps) {
  const [mode, setMode] = useState<AiReportType>("session");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [reportAt, setReportAt] = useState<Date | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isLocked = plan === "starter";
  const reachedLimit = monthlyLimit !== null && reportsThisMonth >= monthlyLimit;

  async function startUpgrade(target: Plan) {
    setError(null);
    setUpgrading(true);
    const result = await createCheckoutSession(target);
    handleBillingActionResult(result, {
      onSuccess: (url) => window.location.assign(url),
      onNotConfigured: () => setError(PAYMENT_COMING_SOON_MESSAGE),
      onError: (msg) => setError(msg || "Failed to start checkout."),
    });
    if (!result.ok) setUpgrading(false);
  }

  async function generate() {
    setError(null);
    setResult("");
    setReportAt(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate report.");
      }
      setResult(data.content ?? "");
      setReportAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  const activeMode = MODES.find((m) => m.id === mode)!;
  const disabled = generating || tradeCount === 0 || isLocked || reachedLimit;
  const hasReport = Boolean(result);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="AI Coach"
        eyebrow="Research"
        subtitle={`${tradeCount} trades available for analysis`}
      />

      <div className="dashboard-page space-y-7">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase mb-4">
            Select Mode
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "group relative text-left rounded-xl p-4 sm:p-5 cursor-pointer",
                    "transition-all duration-200 active:scale-[0.99]",
                    active
                      ? "border border-[#00ff88]/40 bg-[#00ff88]/[0.04] shadow-[0_0_30px_rgba(0,255,136,0.08)]"
                      : "bg-[#0c0f17] border border-[#1c2235] hover:border-[#2a3350] hover:bg-[#111520]"
                  )}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div
                      className={cn(
                        "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border",
                        active
                          ? "border-[#00ff88]/30 bg-[#00ff88]/[0.06] text-[#00ff88]"
                          : "border-[#1c2235] bg-[#111520] text-[#8892a4]"
                      )}
                      style={!active ? { color: m.color } : undefined}
                    >
                      <m.Icon />
                    </div>
                    {active && (
                      <span className="inline-flex items-center font-mono text-[9px] text-[#00ff88] tracking-widest uppercase">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse mr-1.5" />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase mb-1">
                    MODE
                  </div>
                  <div className="font-display text-base sm:text-lg font-bold text-[#e8edf5]">
                    {m.title}
                  </div>
                  <div className="mt-2 font-body text-[13px] text-[#8892a4] leading-relaxed">
                    {m.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-start">
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={generate}
              disabled={disabled}
              className={cn(
                "w-full sm:w-auto bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[13px]",
                "tracking-[0.1em] uppercase px-8 py-3 rounded-lg",
                "transition-all duration-200",
                "hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]",
                "active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              )}
            >
              {generating ? "Analyzing…" : "Generate Report"}
            </button>

            {isLocked && (
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-3 rounded-lg",
                  "bg-[#080a0f]/90 backdrop-blur-sm border border-[#1c2235]",
                  "px-3"
                )}
              >
                <LockIcon />
                <span className="font-mono font-bold uppercase text-[#8892a4] text-[10px] tracking-[0.24em]">
                  Pro &amp; Elite Only
                </span>
                <button
                  type="button"
                  onClick={() => startUpgrade("pro")}
                  disabled={upgrading}
                  className={cn(
                    "h-7 px-3 rounded-lg font-mono font-bold uppercase text-[#080a0f] text-[10px] tracking-[0.22em]",
                    "bg-[#00ff88] hover:bg-[#00ff88]/90 transition-all duration-200",
                    "active:scale-[0.98] disabled:opacity-60"
                  )}
                >
                  {upgrading ? "…" : "Upgrade"}
                </button>
              </div>
            )}
          </div>

          <p className="mt-2 font-mono text-[11px] text-[#4a5568] uppercase tracking-[0.08em]">
            {usageLabel(plan, reportsThisMonth, monthlyLimit)}
          </p>

          {!isLocked && plan === "pro" && reachedLimit && (
            <div className="w-full bg-[#f59e0b]/[0.04] border border-[#f59e0b]/20 rounded-xl p-5 mt-4">
              <div className="flex items-center gap-2">
                <EliteBadge />
                <span className="font-mono text-[11px] text-[#f59e0b] tracking-[0.05em]">
                  MONTHLY LIMIT REACHED
                </span>
              </div>
              <p className="font-body text-[13px] text-[#8892a4] mt-2">
                You&apos;ve used all 10 Pro reports this month. Upgrade to Elite
                for unlimited AI coaching.
              </p>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className={cn(
                  "mt-4 w-full sm:w-auto px-6 py-3 rounded-lg font-mono font-bold text-[12px] tracking-[0.1em] uppercase",
                  "bg-[#f59e0b] text-[#080a0f] hover:bg-[#f59e0b]/90",
                  "hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all duration-200",
                  "active:scale-[0.98]"
                )}
              >
                ★ UPGRADE TO ELITE
              </button>
            </div>
          )}

          {tradeCount === 0 && (
            <span className="mt-2 font-mono text-[11px] text-[#4a5568] uppercase tracking-[0.08em]">
              Log at least one trade to enable AI analysis.
            </span>
          )}
        </div>

        {paymentNotice && (
          <div
            className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-3 text-[13px] text-[#f59e0b] font-body leading-relaxed animate-fadeInSoft"
            role="status"
          >
            {paymentNotice}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#ff3b5c]/20 bg-[#ff3b5c]/10 px-4 py-3 text-xs text-[#ff3b5c] font-mono animate-fadeInSoft">
            {error}
          </div>
        )}

        <div className="bg-[#0c0f17] border border-[#1c2235] rounded-xl overflow-hidden">
          <div className="bg-[#080a0f] border-b border-[#1c2235] px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5"
                style={{ color: activeMode.color }}
              >
                <activeMode.Icon />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[9px] text-[#4a5568] tracking-widest uppercase">
                  {activeMode.title}
                </div>
                <div className="font-mono text-[13px] text-[#e8edf5] font-medium truncate">
                  Research Report
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {hasReport && reportAt && (
                <span className="font-mono text-[10px] text-[#4a5568] tabular-nums">
                  {reportAt.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  hasReport ? "bg-[#00ff88]" : "bg-[#2a3350]"
                )}
                aria-hidden
              />
            </div>
          </div>

          <div className="min-h-[360px]">
            {generating ? (
              <LoadingState />
            ) : result ? (
              <div className="px-5 py-5">
                <ResearchReport content={result} />
              </div>
            ) : (
              <EmptyResult />
            )}
          </div>
        </div>
      </div>

      <PlanUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={plan}
        targetPlan="elite"
        featureName="Unlimited AI Reports"
        featureDescription="Generate as many coaching reports as you need, every month, with no limits."
      />
    </div>
  );
}

function normalizeReportContent(text: string): string {
  return text
    .replace(/<br\s*\/>/gi, "\n\n")
    .replace(/<br>/gi, "\n\n")
    .replace(/\\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "**$1**")
    .trim();
}

function ResearchReport({ content }: { content: string }) {
  return (
    <article className="max-w-[68ch] animate-fadeInSoft ai-report-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizeReportContent(content)}
      </ReactMarkdown>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center">
      <span className="font-mono text-2xl text-[#00ff88] animate-blink">
        _
      </span>
      <div className="mt-4 font-mono text-[10px] tracking-[0.2em] text-[#00ff88] uppercase animate-pulse">
        ANALYZING TRADE DATA
      </div>
    </div>
  );
}

function EmptyResult() {
  return (
    <div
      className="py-20 flex flex-col items-center justify-center text-center px-6"
      style={{
        backgroundImage: `
          linear-gradient(rgba(28,34,53,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(28,34,53,0.5) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <span className="font-mono text-4xl text-[#2a3350]">&gt;</span>
      <div className="mt-4 font-mono text-[10px] tracking-[0.25em] text-[#4a5568] uppercase">
        AWAITING ANALYSIS
      </div>
      <p className="mt-1 font-body text-[13px] text-[#4a5568]">
        Select a mode and generate your first report
      </p>
    </div>
  );
}

function SessionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 20h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 16V9M11 16V5M16 16v-7M21 16v-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function PsychologyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 20v-2a4 4 0 0 1-4-4v-3a7 7 0 0 1 13.5-2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="15" cy="13" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15 7v2M15 17v2M9 13h2M19 13h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="11"
        width="16"
        height="10"
        rx="2"
        stroke="#8892a4"
        strokeWidth="1.6"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="#8892a4"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EdgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14l5-5 4 4 7-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6h5v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
