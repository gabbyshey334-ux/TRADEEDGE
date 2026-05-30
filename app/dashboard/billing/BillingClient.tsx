"use client";

import { useState } from "react";
import {
  createCheckoutSession,
  createPortalSession,
} from "@/lib/actions/billing";
import {
  handleBillingActionResult,
  PAYMENT_COMING_SOON_MESSAGE,
} from "@/lib/billing-client";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

const PLAN_PILL: Record<Plan, { label: string; className: string }> = {
  starter: {
    label: "Starter",
    className:
      "bg-[#111520] border border-[#1c2235] text-[#4a5568] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded",
  },
  pro: {
    label: "Pro",
    className:
      "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded",
  },
  elite: {
    label: "★ Elite",
    className:
      "bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded",
  },
};

const PLAN_PRICES: Record<Plan, string> = {
  starter: "$19/month",
  pro: "$49/month",
  elite: "$99/month",
};

const PLAN_NAME_COLOR: Record<Plan, string> = {
  starter: "text-[#e8edf5]",
  pro: "text-[#00ff88]",
  elite: "text-[#f59e0b]",
};

const PLAN_CARDS: Array<{
  id: Plan;
  name: string;
  price: string;
  features: string[];
}> = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    features: [
      "50 trades per month",
      "Basic analytics",
      "Risk calculator",
      "Trade calendar",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    features: [
      "Unlimited trades per month",
      "10 AI coaching reports/month",
      "Congressional Trades feed",
      "Prop Firm Tracker",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "$99",
    features: [
      "Everything in Pro",
      "Unlimited AI coaching reports",
      "AI Readiness Score",
      "Rule Break Prediction",
      "Daily Coaching Reports",
    ],
  },
];

function subStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "active") return "text-[#00ff88]";
  if (s === "trialing") return "text-[#f59e0b]";
  if (s === "past_due") return "text-[#ff3b5c]";
  return "text-[#4a5568]";
}

function formatSubStatus(status: string): string {
  return status.replace(/_/g, " ").toUpperCase();
}

interface BillingClientProps {
  plan: Plan;
  subStatus: string;
  hasStripeBilling: boolean;
}

export function BillingClient({
  plan,
  subStatus,
  hasStripeBilling,
}: BillingClientProps) {
  const [checkoutPending, setCheckoutPending] = useState<Plan | null>(null);
  const [portalPending, setPortalPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pill = PLAN_PILL[plan];

  async function handleCheckout(target: Plan) {
    if (target === "starter" || target === plan) return;
    setError(null);
    setCheckoutPending(target);
    const result = await createCheckoutSession(target);
    handleBillingActionResult(result, {
      onSuccess: (url) => {
        window.location.href = url;
      },
      onNotConfigured: () => setError(PAYMENT_COMING_SOON_MESSAGE),
      onError: (msg) => setError(msg || "Failed to start checkout."),
    });
    if (!result.ok) setCheckoutPending(null);
  }

  async function handlePortal() {
    setError(null);
    setPortalPending(true);
    try {
      const result = await createPortalSession();
      handleBillingActionResult(result, {
        onSuccess: (url) => {
          window.location.href = url;
        },
        onNotConfigured: () => setError(PAYMENT_COMING_SOON_MESSAGE),
        onError: (msg) => setError(msg || "Failed to open billing portal."),
      });
      if (!result.ok) setPortalPending(false);
    } catch {
      setError("Failed to open billing portal. Please try again.");
      setPortalPending(false);
    }
  }

  return (
    <div className="dashboard-page space-y-8 animate-fadeIn">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase mb-2">
          ACCOUNT
        </p>
        <h1 className="font-display text-3xl font-bold text-[#e8edf5]">
          Billing &amp; Plan
        </h1>
      </div>

      <div className="bg-[#0c0f17] border border-[#1c2235] rounded-xl p-6">
        <p className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
          CURRENT PLAN
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "font-display text-2xl font-bold capitalize",
              PLAN_NAME_COLOR[plan]
            )}
          >
            {pill.label.replace("★ ", "")}
          </span>
          <span className={pill.className}>{pill.label}</span>
        </div>

        <p className="font-mono text-[13px] text-[#4a5568] mt-1">
          {PLAN_PRICES[plan]}
        </p>

        <p
          className={cn(
            "mt-3 font-mono text-[10px] tracking-[0.1em]",
            subStatusColor(subStatus)
          )}
        >
          {formatSubStatus(subStatus || "trialing")}
        </p>

        {hasStripeBilling ? (
          <button
            type="button"
            onClick={handlePortal}
            disabled={portalPending}
            className={cn(
              "mt-4 bg-transparent border border-[#1c2235] rounded-lg",
              "font-mono text-[11px] tracking-[0.1em] text-[#4a5568] uppercase px-4 py-2.5",
              "hover:border-[#2a3350] hover:text-[#e8edf5] transition-all duration-200",
              "disabled:opacity-60"
            )}
          >
            {portalPending ? "Loading…" : "MANAGE BILLING →"}
          </button>
        ) : (
          <p className="font-mono text-[10px] text-[#4a5568] italic mt-3">
            Your plan is managed directly. Contact support to manage billing.
          </p>
        )}
      </div>

      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase mb-4">
          AVAILABLE PLANS
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_CARDS.map((card) => {
            const isCurrent = card.id === plan;
            const canUpgrade =
              (plan === "starter" && card.id !== "starter") ||
              (plan === "pro" && card.id === "elite");

            return (
              <div
                key={card.id}
                className={cn(
                  "relative bg-[#0c0f17] border border-[#1c2235] rounded-xl p-5 flex flex-col",
                  isCurrent && "border-[#2a3350]",
                  card.id === "pro" &&
                    !isCurrent &&
                    "hover:border-[#00ff88]/30 transition-colors duration-200",
                  card.id === "elite" &&
                    !isCurrent &&
                    "hover:border-[#f59e0b]/30 transition-colors duration-200"
                )}
              >
                {isCurrent && (
                  <span className="absolute top-4 right-4 bg-[#111520] border border-[#1c2235] text-[#4a5568] font-mono text-[9px] tracking-widest px-2 py-0.5 rounded uppercase">
                    CURRENT
                  </span>
                )}

                <h3
                  className={cn(
                    "font-display text-lg font-bold",
                    card.id === "starter" && "text-[#e8edf5]",
                    card.id === "pro" && "text-[#00ff88]",
                    card.id === "elite" && "text-[#f59e0b]"
                  )}
                >
                  {card.name}
                </h3>

                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "font-mono text-2xl font-bold",
                      card.id === "pro" && "text-[#00ff88]",
                      card.id === "elite" && "text-[#f59e0b]",
                      card.id === "starter" && "text-[#e8edf5]"
                    )}
                  >
                    {card.price}
                  </span>
                  <span className="font-mono text-[11px] text-[#4a5568]">/mo</span>
                </div>

                <ul className="mt-4 flex-1 space-y-2">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span
                        className={cn(
                          "font-mono text-[12px] shrink-0",
                          card.id === "elite"
                            ? "text-[#f59e0b]"
                            : "text-[#00ff88]"
                        )}
                      >
                        ✓
                      </span>
                      <span className="font-body text-[13px] text-[#8892a4]">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {canUpgrade && (
                  <button
                    type="button"
                    onClick={() => handleCheckout(card.id)}
                    disabled={checkoutPending !== null}
                    className={cn(
                      "mt-5 w-full py-3 rounded-lg font-mono font-bold text-[11px] tracking-[0.1em] uppercase transition-all duration-200",
                      card.id === "pro"
                        ? "bg-[#00ff88] text-[#080a0f] hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.25)]"
                        : "bg-[#f59e0b] text-[#080a0f] hover:bg-[#f59e0b]/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]",
                      "disabled:opacity-60"
                    )}
                  >
                    {checkoutPending === card.id
                      ? "Loading…"
                      : card.id === "pro"
                        ? "UPGRADE TO PRO"
                        : "★ UPGRADE TO ELITE"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border border-[#ff3b5c]/20 bg-[#ff3b5c]/10 px-4 py-3 text-[11px] text-[#ff3b5c] font-mono"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
