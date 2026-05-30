"use client";

import Link from "next/link";
import { useState } from "react";
import { createCheckoutSession } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

export interface PlanUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  targetPlan: "pro" | "elite";
  featureName: string;
  featureDescription: string;
}

const PRO_FEATURES = [
  "Unlimited trades per month",
  "10 AI coaching reports/month",
  "Congressional Trades feed",
  "Prop Firm Tracker",
] as const;

const ELITE_FEATURES = [
  "Everything in Pro",
  "Unlimited AI coaching reports",
  "AI Readiness Score",
  "Rule Break Prediction",
  "Daily Coaching Reports",
] as const;

function currentPlanPill(plan: Plan) {
  if (plan === "pro") {
    return "bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]";
  }
  return "bg-[#111520] border-[#1c2235] text-[#4a5568]";
}

function currentPlanLabel(plan: Plan) {
  if (plan === "pro") return "PRO";
  if (plan === "elite") return "ELITE";
  return "STARTER";
}

export function PlanUpgradeModal({
  open,
  onClose,
  currentPlan,
  targetPlan,
  featureName,
  featureDescription,
}: PlanUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const features = targetPlan === "pro" ? PRO_FEATURES : ELITE_FEATURES;
  const checkColor = targetPlan === "pro" ? "text-[#00ff88]" : "text-[#f59e0b]";
  const price = targetPlan === "pro" ? "$49" : "$99";
  const priceColor = targetPlan === "pro" ? "text-[#00ff88]" : "text-[#f59e0b]";

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    const result = await createCheckoutSession(targetPlan);
    setLoading(false);
    if (result.ok) {
      window.location.href = result.url;
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="bg-[#0c0f17] border border-[#1c2235] rounded-2xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[#4a5568] hover:text-[#e8edf5] transition-colors duration-150"
        >
          <CloseIcon />
        </button>

        <div className="px-6 pt-6 pb-5 border-b border-[#1c2235]">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                "font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded border",
                currentPlanPill(currentPlan)
              )}
            >
              {currentPlanLabel(currentPlan)}
            </span>
            <span className="text-[#4a5568] font-mono text-[12px]">→</span>
            {targetPlan === "pro" ? (
              <span className="bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded">
                PRO
              </span>
            ) : (
              <span className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded">
                ★ ELITE
              </span>
            )}
          </div>

          <h2
            id="upgrade-modal-title"
            className="font-display text-xl font-bold text-[#e8edf5] mb-1"
          >
            {featureName}
          </h2>
          <p className="font-body text-[13px] text-[#8892a4]">{featureDescription}</p>
        </div>

        <div className="px-6 py-5">
          <p className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase mb-3">
            WHAT YOU UNLOCK
          </p>
          <ul>
            {features.map((item) => (
              <li key={item} className="flex items-center gap-2 mb-2">
                <span className={cn("font-mono text-[12px]", checkColor)}>✓</span>
                <span className="font-body text-[13px] text-[#8892a4]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-2">
          <div className="flex items-baseline gap-1">
            <span className={cn("font-mono text-2xl font-bold", priceColor)}>
              {price}
            </span>
            <span className="font-mono text-[11px] text-[#4a5568]">/month</span>
          </div>
          <p className="font-mono text-[10px] text-[#4a5568] mt-1">
            Billed monthly · Cancel anytime
          </p>
        </div>

        <div className="px-6 pb-6 mt-2">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className={cn(
              "w-full py-3.5 rounded-lg font-mono font-bold text-[12px] tracking-[0.1em] uppercase transition-all duration-200",
              targetPlan === "pro"
                ? "bg-[#00ff88] text-[#080a0f] hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.25)]"
                : "bg-[#f59e0b] text-[#080a0f] hover:bg-[#f59e0b]/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner />
              </span>
            ) : targetPlan === "pro" ? (
              "UPGRADE TO PRO →"
            ) : (
              "★ UPGRADE TO ELITE →"
            )}
          </button>

          {error && (
            <p className="font-mono text-[11px] text-[#ff3b5c] mt-2 text-center">
              {error}
            </p>
          )}

          <p className="text-center mt-3">
            <Link
              href="/#pricing"
              className="font-mono text-[10px] text-[#4a5568] tracking-[0.05em] hover:text-[#8892a4] transition-all duration-200"
            >
              Compare all plans
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border-2 border-[#080a0f]/30 border-t-[#080a0f] animate-spin"
      aria-hidden
    />
  );
}
