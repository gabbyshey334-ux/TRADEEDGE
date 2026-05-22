"use client";

import { useState } from "react";
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
  monthlyLimit: number | null;
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
  const [upgrading, setUpgrading] = useState(false);

  const isLocked = plan === "starter";
  const reachedLimit = monthlyLimit !== null && reportsThisMonth >= monthlyLimit;

  async function startUpgrade(target: Plan) {
    setError(null);
    setUpgrading(true);
    try {
      const { url } = await createCheckoutSession(target);
      window.location.assign(url);
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
        eyebrow="Research"
        subtitle={`${tradeCount} trades available for analysis`}
      />

      <div className="dashboard-page space-y-7">
        {/* Mode selection */}
        <div>
          <div className="section-label mb-4">Select Mode</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "group relative text-left rounded-lg overflow-hidden",
                    "transition-all duration-200 ease-out",
                    "active:scale-[0.99]",
                    active
                      ? ""
                      : "border border-[#1a2030] bg-[#0c1018] hover:border-[#2a3050] hover:bg-[#0f1420]"
                  )}
                  style={
                    active
                      ? {
                          border: `1px solid ${m.color}`,
                          background: `linear-gradient(180deg, ${m.color}10 0%, #0c1018 70%)`,
                          boxShadow: `0 0 0 1px ${m.color}55, 0 0 40px -8px ${m.color}66, inset 0 1px 0 ${m.color}22`,
                        }
                      : undefined
                  }
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-sm"
                        style={{
                          backgroundColor: `${m.color}1a`,
                          color: m.color,
                          boxShadow: active
                            ? `0 0 18px -4px ${m.color}88`
                            : undefined,
                        }}
                      >
                        <m.Icon />
                      </div>
                      {active && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono font-bold uppercase"
                          style={{
                            fontSize: "9px",
                            letterSpacing: "0.28em",
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
                      className="font-mono uppercase"
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.32em",
                        color: m.color,
                      }}
                    >
                      Mode
                    </div>
                    <div
                      className="mt-2 font-heading leading-none text-[#e8edf5]"
                      style={{
                        fontSize: "26px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {m.title}
                    </div>
                    <div className="mt-3 text-[13px] text-[#a0afc0] font-sans leading-relaxed">
                      {m.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Button
              onClick={generate}
              disabled={disabled}
              className="w-full sm:w-auto sm:min-w-[220px]"
            >
              {generating ? "Analyzing…" : "Generate Report"}
            </Button>

            {isLocked && (
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-3 rounded-md",
                  "bg-[#06080d]/90 backdrop-blur-sm border border-[#1a2030]",
                  "px-3"
                )}
              >
                <LockIcon />
                <span
                  className="font-mono font-bold uppercase text-[#8892a4]"
                  style={{ fontSize: "10px", letterSpacing: "0.24em" }}
                >
                  Pro &amp; Elite Only
                </span>
                <button
                  type="button"
                  onClick={() => startUpgrade("pro")}
                  disabled={upgrading}
                  className={cn(
                    "h-7 px-3 rounded-sm",
                    "font-mono font-bold uppercase text-[#06080d]",
                    "bg-[#00e5b0] hover:bg-[#00f5be]",
                    "shadow-[0_0_18px_rgba(0,229,176,0.35)]",
                    "transition-all active:scale-[0.98] disabled:opacity-60"
                  )}
                  style={{ fontSize: "10px", letterSpacing: "0.22em" }}
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
                  "font-mono uppercase",
                  reachedLimit ? "text-[#ff4d6d]" : "text-[#8892a4]"
                )}
                style={{ fontSize: "11px", letterSpacing: "0.22em" }}
              >
                {reportsThisMonth} of {monthlyLimit} reports used this month
              </span>
              {reachedLimit && (
                <button
                  type="button"
                  onClick={() => startUpgrade("elite")}
                  disabled={upgrading}
                  className={cn(
                    "h-8 px-3 rounded-sm",
                    "font-mono font-bold uppercase text-[#06080d]",
                    "transition-all active:scale-[0.98] disabled:opacity-60"
                  )}
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.22em",
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
              className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono font-bold uppercase text-[#06080d]"
              style={{
                fontSize: "10px",
                letterSpacing: "0.24em",
                background:
                  "linear-gradient(135deg, #b466ff 0%, #f0c040 100%)",
              }}
            >
              <SparkIcon />
              Unlimited Reports
            </span>
          )}

          {tradeCount === 0 && (
            <span
              className="font-mono uppercase text-[#5a6580]"
              style={{ fontSize: "11px", letterSpacing: "0.22em" }}
            >
              Log at least one trade to enable AI analysis.
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-sm border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono animate-fadeInSoft">
            {error}
          </div>
        )}

        {/* Report area — premium research-report aesthetic */}
        <div
          className="relative rounded-lg border border-[#1a2030] overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #0c1018 0%, #0a0d14 100%)",
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-8 py-5 sm:py-6 border-b border-[#1a2030]/60 bg-[#080b11]/60">
            <div className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-sm"
                style={{
                  backgroundColor: `${activeMode.color}1a`,
                  color: activeMode.color,
                }}
              >
                <activeMode.Icon />
              </div>
              <div>
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.32em",
                    color: activeMode.color,
                  }}
                >
                  {activeMode.title}
                </div>
                <div className="mt-1.5 font-heading text-[24px] leading-none tracking-[0.06em] text-[#e8edf5]">
                  Research Report
                </div>
              </div>
            </div>
            {generating && (
              <span
                className="inline-flex items-center gap-2 font-mono uppercase text-[#5a6580]"
                style={{ fontSize: "10px", letterSpacing: "0.24em" }}
              >
                <span
                  className="h-2 w-2 rounded-full animate-pulseGlow"
                  style={{ backgroundColor: activeMode.color }}
                />
                Generating
              </span>
            )}
          </div>

          <div className="px-5 sm:px-10 py-8 sm:py-10 min-h-[360px]">
            {generating ? (
              <div className="space-y-4 max-w-[68ch]">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-5/6 rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ) : result ? (
              <ResearchReport content={result} accent={activeMode.color} />
            ) : (
              <EmptyResult color={activeMode.color} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render an AI-generated report as formatted text. We do lightweight parsing
 * so headings, bullets, and paragraphs read like a real research report
 * without pulling in a markdown library.
 */
function ResearchReport({
  content,
  accent,
}: {
  content: string;
  accent: string;
}) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <article className="max-w-[68ch] animate-fadeInSoft">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.replace(/\s+$/, ""));

        // Heading patterns: "# ", "## ", or "ALL CAPS" lines
        const first = lines[0];
        const hashMatch = first.match(/^(#{1,3})\s+(.*)$/);
        if (hashMatch) {
          const level = hashMatch[1].length;
          const text = hashMatch[2];
          if (level <= 2) {
            return (
              <h2
                key={i}
                className="font-heading mt-8 first:mt-0 mb-3 text-[#e8edf5]"
                style={{
                  fontSize: level === 1 ? "26px" : "22px",
                  letterSpacing: "0.06em",
                  lineHeight: 1.1,
                  borderBottom: "1px solid rgba(26,32,48,0.6)",
                  paddingBottom: 10,
                }}
              >
                <span style={{ color: accent }}>§ </span>
                {text}
              </h2>
            );
          }
          return (
            <h3
              key={i}
              className="font-mono uppercase mt-6 mb-2"
              style={{
                fontSize: "11px",
                letterSpacing: "0.28em",
                color: accent,
              }}
            >
              {text}
            </h3>
          );
        }

        // Bullet list
        if (lines.every((l) => /^[-*•]\s+/.test(l))) {
          return (
            <ul key={i} className="my-4 space-y-2.5 list-none pl-0">
              {lines.map((l, j) => {
                const text = l.replace(/^[-*•]\s+/, "");
                return (
                  <li
                    key={j}
                    className="flex gap-3 text-[13px] text-[#a0afc0] font-sans"
                    style={{ lineHeight: 1.8 }}
                  >
                    <span
                      className="mt-[10px] h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <span dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered list
        if (lines.every((l) => /^\d+[\.\)]\s+/.test(l))) {
          return (
            <ol key={i} className="my-4 space-y-2.5 list-none pl-0">
              {lines.map((l, j) => {
                const m = l.match(/^(\d+)[\.\)]\s+(.*)$/);
                const num = m?.[1] ?? `${j + 1}`;
                const text = m?.[2] ?? l;
                return (
                  <li
                    key={j}
                    className="flex gap-3 text-[13px] text-[#a0afc0] font-sans"
                    style={{ lineHeight: 1.8 }}
                  >
                    <span
                      className="shrink-0 font-mono font-bold tabular"
                      style={{
                        color: accent,
                        fontSize: "12px",
                        minWidth: 18,
                      }}
                    >
                      {String(num).padStart(2, "0")}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />
                  </li>
                );
              })}
            </ol>
          );
        }

        // Whole block looks like an uppercase title?
        if (
          first === first.toUpperCase() &&
          first.length < 50 &&
          /[A-Z]/.test(first) &&
          lines.length <= 2
        ) {
          return (
            <h3
              key={i}
              className="font-mono uppercase mt-6 mb-3"
              style={{
                fontSize: "11px",
                letterSpacing: "0.32em",
                color: accent,
              }}
            >
              {first}
            </h3>
          );
        }

        // Paragraph
        return (
          <p
            key={i}
            className="my-4 text-[13px] text-[#a0afc0] font-sans"
            style={{ lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{
              __html: inlineFormat(lines.join("<br />")),
            }}
          />
        );
      })}
    </article>
  );
}

function inlineFormat(text: string): string {
  // Escape lightly, then convert **bold** and `code`
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e8edf5;font-weight:600">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="color:#e8edf5;background:#080b11;padding:1px 6px;border-radius:3px;font-size:12px;font-family:var(--font-dm-mono),monospace">$1</code>');
}

function EmptyResult({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14">
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-2xl blur-2xl animate-pulseGlow"
          style={{ backgroundColor: `${color}44` }}
        />
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-sm border"
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
        className="font-mono uppercase"
        style={{
          fontSize: "10px",
          letterSpacing: "0.32em",
          color,
        }}
      >
        Ready
      </div>
      <h3 className="mt-3 font-heading text-[26px] tracking-[0.06em] text-[#e8edf5]">
        Awaiting your data
      </h3>
      <p className="mt-3 max-w-md text-[13px] text-[#a0afc0] font-sans" style={{ lineHeight: 1.7 }}>
        Pick a mode above and press Generate Report to receive a personalized
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
