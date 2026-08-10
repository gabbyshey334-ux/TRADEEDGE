"use client";

import Link from "next/link";

export interface OnboardingChecklistProps {
  hasFirstTrade: boolean;
  hasFirstAiReport: boolean;
  hasFirstPropFirmAccount: boolean;
  userId: string;
}

const STEPS = [
  {
    title: "Log your first trade",
    subtitle: "Open the Journal and record your first trade",
    href: "/dashboard/journal",
    action: "Journal",
  },
  {
    title: "Generate your first AI report",
    subtitle: "Go to AI Coach and hit Generate Report",
    href: "/dashboard/ai",
    action: "AI Coach",
  },
  {
    title: "Check your Prop Firm Readiness",
    subtitle: "Add a challenge and get your readiness score",
    href: "/dashboard/prop-firm-tracker",
    action: "Tracker",
  },
] as const;

export function OnboardingChecklist({
  hasFirstTrade,
  hasFirstAiReport,
  hasFirstPropFirmAccount,
}: OnboardingChecklistProps) {
  const doneFlags = [hasFirstTrade, hasFirstAiReport, hasFirstPropFirmAccount];
  const completedCount = doneFlags.filter(Boolean).length;
  const allDone = completedCount === 3;

  if (allDone) return null;

  return (
    <div className="bg-[#0c0f17] border border-[#00ff88]/20 rounded-xl overflow-hidden mb-6">
      <div className="bg-[#080a0f] border-b border-[#1c2235] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse mr-2" />
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#00ff88] uppercase">
            GET STARTED
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#4a5568]">
          {completedCount} / 3 COMPLETE
        </span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {STEPS.map((step, index) => {
          const done = doneFlags[index];
          return (
            <div
              key={step.href}
              className="flex items-center gap-4 py-3 border-b border-[#1c2235] last:border-0"
            >
              {done ? (
                <div className="w-8 h-8 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center shrink-0">
                  <span className="text-[#00ff88] font-mono text-[14px]">✓</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border border-[#2a3350] flex items-center justify-center font-mono text-[12px] text-[#4a5568] shrink-0">
                  {index + 1}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div
                  className={`font-body text-[13px] font-medium ${
                    done ? "text-[#4a5568] line-through" : "text-[#e8edf5]"
                  }`}
                >
                  {step.title}
                </div>
                <div className="font-mono text-[10px] text-[#4a5568] mt-0.5">
                  {step.subtitle}
                </div>
              </div>

              {!done && (
                <Link
                  href={step.href}
                  className="shrink-0 bg-[#111520] border border-[#1c2235] rounded-lg font-mono text-[10px] tracking-[0.1em] uppercase text-[#8892a4] px-3 py-1.5 hover:border-[#2a3350] hover:text-[#e8edf5] transition-all duration-150"
                >
                  {step.action}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {completedCount === 2 && (
        <div className="bg-[#00ff88]/[0.04] border-t border-[#00ff88]/10 px-5 py-3 font-mono text-[10px] text-[#00ff88] tracking-[0.1em]">
          ONE MORE STEP: you are almost set up
        </div>
      )}
    </div>
  );
}
