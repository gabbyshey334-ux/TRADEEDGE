"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/actions/billing";
import {
  handleBillingActionResult,
  PAYMENT_COMING_SOON_MESSAGE,
} from "@/lib/billing-client";
import { cn } from "@/lib/utils";

interface BlurredFeaturePreviewProps {
  targetPlan: "pro" | "elite";
  featureName: string;
  featureDescription: string;
  children: React.ReactNode;
  minHeight?: number;
  /** Unblurred badge in the overlay layer (e.g. "SAMPLE") */
  badge?: string;
}

export function BlurredFeaturePreview({
  targetPlan,
  featureName,
  featureDescription,
  children,
  minHeight,
  badge,
}: BlurredFeaturePreviewProps) {
  const [pending, setPending] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const upgradeLabel =
    targetPlan === "elite" ? "Upgrade to Elite" : "Upgrade to Pro";

  async function handleUpgrade() {
    setPaymentNotice(null);
    setPending(true);
    const result = await createCheckoutSession(targetPlan);
    handleBillingActionResult(result, {
      onSuccess: (url) => window.location.assign(url),
      onNotConfigured: () => setPaymentNotice(PAYMENT_COMING_SOON_MESSAGE),
      onError: (msg) => setPaymentNotice(msg || "Failed to start checkout."),
    });
    if (!result.ok) setPending(false);
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={minHeight != null ? { minHeight } : undefined}
    >
      <div className="pointer-events-none select-none" style={{ filter: "blur(6px)" }}>
        {children}
      </div>

      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-end",
          "bg-gradient-to-t from-[#080a0f] via-[#080a0f]/85 to-transparent",
          "px-6 pb-10 pt-16 text-center"
        )}
      >
        {badge ? (
          <span
            className="absolute top-4 left-4 font-mono font-bold uppercase text-[#00e5b0] border border-[#00e5b0]/30 bg-[#00e5b0]/10 px-2 py-0.5 rounded"
            style={{ fontSize: "9px", letterSpacing: "0.22em" }}
          >
            {badge}
          </span>
        ) : null}

        <LockIcon />
        <p
          className="mt-3 max-w-md font-mono font-bold uppercase text-[#e8edf5]"
          style={{ fontSize: "10px", letterSpacing: "0.22em" }}
        >
          {featureName}
        </p>
        <p className="mt-2 max-w-md font-body text-[13px] leading-relaxed text-[#8892a4]">
          {featureDescription}
        </p>

        {paymentNotice ? (
          <div
            className="mt-4 max-w-sm rounded-sm border border-[#f0c040]/40 bg-[#f0c040]/[0.08] px-4 py-3 text-[13px] text-[#f0c040] font-body leading-relaxed"
            role="status"
          >
            {paymentNotice}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={pending}
            className={cn(
              "mt-4 h-9 px-4 rounded-sm",
              "font-mono font-bold uppercase text-[#06080d]",
              "bg-[#00e5b0] hover:bg-[#00f5be]",
              "shadow-[0_0_18px_rgba(0,229,176,0.35)]",
              "transition-all active:scale-[0.98] disabled:opacity-60"
            )}
            style={{ fontSize: "10px", letterSpacing: "0.22em" }}
          >
            {pending ? "Loading…" : upgradeLabel}
          </button>
        )}
      </div>
    </div>
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
