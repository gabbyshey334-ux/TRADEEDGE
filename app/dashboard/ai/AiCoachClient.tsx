"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { createCheckoutSession } from "@/lib/actions/billing";
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
    color: "#00e5b0",
    Icon: SessionIcon,
  },
  {
    id: "psychology",
    title: "Psychology Analysis",
    desc: "Identify emotional patterns and biases that are leaking your edge.",
    color: "#b466ff",
    Icon: PsychologyIcon,
  },
  {
    id: "edge",
    title: "Edge Report",
    desc: "Quantify your statistical edge by setup, session, and emotion.",
    color: "#f0c040",
    Icon: EdgeIcon,
  },
];

interface AiCoachClientProps {
  tradeCount: number;
  plan: Plan;
  reportsThisMonth: number;
  /** Monthly limit for AI reports, or null if unlimited. */
  monthlyLimit: number | null;
}

export function AiCoachClient({
  tradeCount,
  plan,
  reportsThisMonth,
  monthlyLimit,
}: AiCoachClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AiReportType>("session");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const isLocked = plan === "starter";
  const reachedLimit = monthlyLimit !== null && reportsThisMonth >= monthlyLimit;

  async function startUpgrade(target: Plan) {
    setError(null);
    setUpgrading(true);
    try {
      const { url } = await createCheckoutSession(target);
      router.push(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start checkout."
      );
      setUpgrading(false);
    }
  }

  async function generate() {
    setError(null);
    setResult("");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  const activeMode = MODES.find((m) => m.id === mode)!;
  const disabled = generating || tradeCount === 0 || isLocked || reachedLimit;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="AI Coach"
        subtitle={`${tradeCount} trades available for analysis`}
      />

      <div className="dashboard-page space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "group relative text-left rounded-xl border bg-[#0c1018] p-6 overflow-hidden",
                  "transition-all duration-150 ease-out",
                  active
                    ? "scale-[1.01]"
                    : "hover:bg-[#0f1420] hover:border-[#2a3050]"
                )}
                style={
                  active
                    ? {
                        borderColor: m.color,
                        boxShadow: `0 0 0 1px ${m.color}66, 0 0 28px ${m.color}33`,
                      }
                    : { borderColor: "#1a2030" }
                }
              >
                <div
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(to right, ${m.color}, ${m.color}00)`,
                  }}
                />
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${m.color}1a`,
                      color: m.color,
                    }}
                  >
                    <m.Icon />
                  </div>
                  {active && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] font-mono font-bold"
                      style={{
                        backgroundColor: `${m.color}1a`,
                        color: m.color,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      Active
                    </span>
                  )}
                </div>

                <div
                  className="text-[10px] uppercase tracking-[0.32em] font-mono"
                  style={{ color: m.color }}
                >
                  Mode
                </div>
                <div className="mt-2 font-heading text-2xl tracking-wide text-[#e8edf5] leading-none">
                  {m.title}
                </div>
                <div className="mt-3 text-[13px] text-[#8892a4] font-mono leading-relaxed">
                  {m.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Button
              onClick={generate}
              disabled={disabled}
              className="w-full sm:w-auto sm:min-w-[200px]"
            >
              {generating ? "Analyzing…" : "Generate Report"}
            </Button>

            {isLocked && (
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-3 rounded-md",
                  "bg-[#06080d]/85 backdrop-blur-sm border border-[#1a2030]",
                  "px-3"
                )}
              >
                <LockIcon />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#8892a4]">
                  Available on Pro &amp; Elite
                </span>
                <button
                  type="button"
                  onClick={() => startUpgrade("pro")}
                  disabled={upgrading}
                  className={cn(
                    "h-7 px-3 rounded-md",
                    "text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#06080d]",
                    "bg-[#00e5b0] hover:bg-[#00f5be]",
                    "shadow-[0_0_18px_rgba(0,229,176,0.35)]",
                    "transition-all active:scale-[0.98] disabled:opacity-60"
                  )}
                >
                  {upgrading ? "…" : "Upgrade"}
                </button>
              </div>
            )}
          </div>

          {!isLocked && plan === "pro" && monthlyLimit !== null && (
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[11px] font-mono uppercase tracking-[0.22em]",
                  reachedLimit ? "text-[#ff4d6d]" : "text-[#8892a4]"
                )}
              >
                {reportsThisMonth} of {monthlyLimit} reports used this month
              </span>
              {reachedLimit && (
                <button
                  type="button"
                  onClick={() => startUpgrade("elite")}
                  disabled={upgrading}
                  className={cn(
                    "h-7 px-3 rounded-md",
                    "text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#06080d]",
                    "transition-all active:scale-[0.98] disabled:opacity-60"
                  )}
                  style={{
                    background:
                      "linear-gradient(135deg, #b466ff 0%, #f0c040 100%)",
                  }}
                >
                  {upgrading ? "…" : "Upgrade to Elite"}
                </button>
              )}
            </div>
          )}

          {!isLocked && plan === "elite" && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] font-mono font-bold text-[#06080d]"
              style={{
                background: "linear-gradient(135deg, #b466ff 0%, #f0c040 100%)",
              }}
            >
              <SparkIcon />
              Unlimited Reports
            </span>
          )}

          {tradeCount === 0 && (
            <span className="text-[11px] text-[#5a6580] font-mono uppercase tracking-[0.22em]">
              Log at least one trade to enable AI analysis.
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono animate-fadeInSoft">
            {error}
          </div>
        )}

        <div className="relative rounded-xl border border-[#1a2030] bg-[#0c1018] overflow-hidden">
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(to right, ${activeMode.color}, ${activeMode.color}00)`,
            }}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-[#1a2030]">
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.32em] font-mono"
                style={{ color: activeMode.color }}
              >
                {activeMode.title}
              </div>
              <div className="mt-1 font-heading text-2xl tracking-wide text-[#e8edf5] leading-none">
                Report
              </div>
            </div>
            {generating && (
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#5a6580] font-mono">
                <span className="h-2 w-2 rounded-full bg-[#00e5b0] animate-pulseGlow" />
                Generating
              </span>
            )}
          </div>

          <div className="px-6 py-6 min-h-[320px]">
            {generating ? (
              <div className="space-y-3">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-5/6 rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ) : result ? (
              <div className="whitespace-pre-wrap text-[14px] text-[#e8edf5] font-mono leading-[1.85] animate-fadeInSoft">
                {result}
              </div>
            ) : (
              <EmptyResult color={activeMode.color} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyResult({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="relative mb-5">
        <div
          className="absolute inset-0 rounded-2xl blur-2xl animate-pulseGlow"
          style={{ backgroundColor: `${color}40` }}
        />
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: `${color}14`,
            borderColor: `${color}55`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l2.39 4.84L20 8l-4.34 3.78L17 18l-5-2.84L7 18l1.34-6.22L4 8l5.61-1.16L12 2z"
              stroke={color}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div
        className="text-[10px] uppercase tracking-[0.32em] font-mono"
        style={{ color }}
      >
        Ready
      </div>
      <h3 className="mt-2 font-heading text-2xl tracking-wide text-[#e8edf5]">
        Awaiting your data
      </h3>
      <p className="mt-2 max-w-md text-sm text-[#8892a4] font-mono">
        Pick a mode and press Generate Report to receive a personalized
        analysis of your trading data.
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

function SparkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.39 4.84L20 8l-4.34 3.78L17 18l-5-2.84L7 18l1.34-6.22L4 8l5.61-1.16L12 2z"
        fill="#06080d"
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
