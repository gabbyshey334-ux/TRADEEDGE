"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/actions/billing";
import {
  handleBillingActionResult,
  PAYMENT_COMING_SOON_MESSAGE,
} from "@/lib/billing-client";
import { cn } from "@/lib/utils";

type LockedFeaturePanelProps =
  | { message: string }
  | {
      targetPlan: "pro" | "elite";
      featureName: string;
      featureDescription: string;
    };

function isLegacyProps(
  props: LockedFeaturePanelProps
): props is { message: string } {
  return "message" in props;
}

export function LockedFeaturePanel(props: LockedFeaturePanelProps) {
  const [pending, setPending] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const targetPlan = isLegacyProps(props) ? "pro" : props.targetPlan;
  const headline = isLegacyProps(props) ? props.message : props.featureName;
  const description = isLegacyProps(props) ? null : props.featureDescription;
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
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg",
        "bg-[#080a0f]/90 backdrop-blur-sm border border-[#1c2235]",
        "px-6 py-12 text-center"
      )}
    >
      <LockIcon />
      <p
        className="max-w-md font-mono font-bold uppercase text-[#8892a4]"
        style={{ fontSize: "10px", letterSpacing: "0.24em" }}
      >
        {headline}
      </p>
      {description ? (
        <p className="max-w-md font-body text-[13px] leading-relaxed text-[#4a5568]">
          {description}
        </p>
      ) : null}

      {paymentNotice ? (
        <div
          className="max-w-sm rounded-sm border border-[#f59e0b]/40 bg-[#f59e0b]/[0.08] px-4 py-3 text-[13px] text-[#f59e0b] font-sans leading-relaxed"
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
            "h-9 px-4 rounded-sm",
            "font-mono font-bold uppercase text-[#080a0f]",
            "bg-[#00ff88] hover:bg-[#00ff88]/90",
            "shadow-[0_0_18px_rgba(0,255,136,0.35)]",
            "transition-all active:scale-[0.98] disabled:opacity-60"
          )}
          style={{ fontSize: "10px", letterSpacing: "0.22em" }}
        >
          {pending ? "Loading…" : upgradeLabel}
        </button>
      )}
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
