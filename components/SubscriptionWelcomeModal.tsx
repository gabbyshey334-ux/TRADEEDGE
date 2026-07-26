"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ELITE_FEATURES,
  PRO_FEATURES,
} from "@/components/PlanUpgradeModal";
import { syncSubscriptionFromStripe } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";

export function SubscriptionWelcomeModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const upgraded = searchParams.get("upgraded") === "true";

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"pro" | "elite" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!upgraded) return;

    let cancelled = false;

    void (async () => {
      const result = await syncSubscriptionFromStripe();

      // Always clear the query so refresh / back won't re-trigger
      router.replace(pathname);

      if (cancelled) return;

      if (!result.ok) return;

      if (result.plan !== "pro" && result.plan !== "elite") return;

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase");
      }

      setPlan(result.plan);
      setOpen(true);
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [upgraded, pathname, router]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleClose() {
    setOpen(false);
  }

  if (!open || !mounted || !plan) return null;

  const features = plan === "pro" ? PRO_FEATURES : ELITE_FEATURES;
  const checkColor = plan === "pro" ? "text-[#00ff88]" : "text-[#f59e0b]";
  const headline = plan === "pro" ? "Welcome to Pro." : "Welcome to Elite.";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-welcome-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm sm:bg-black/75"
        onClick={handleClose}
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
        <div className="flex shrink-0 justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#2a3350]" aria-hidden />
        </div>

        <div className="relative shrink-0 border-b border-[#1c2235] bg-[#080a0f] px-5 pb-4 pt-3 sm:pt-5">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-[#4a5568] transition-colors duration-150 hover:text-[#e8edf5]"
          >
            <CloseIcon />
          </button>

          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00ff88]">
            UPGRADE CONFIRMED
          </p>
          <h2
            id="subscription-welcome-title"
            className="mt-2 font-display text-2xl font-bold text-[#e8edf5]"
          >
            {headline}
          </h2>
          <p className="mt-2 font-body text-[13px] leading-relaxed text-[#8892a4]">
            Your account&apos;s been upgraded — here&apos;s what&apos;s unlocked:
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ul className="space-y-3">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 font-body text-[14px] text-[#e8edf5]"
              >
                <span className={cn("mt-0.5 shrink-0 font-mono", checkColor)} aria-hidden>
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0 border-t border-[#1c2235] bg-[#080a0f] px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-[#00ff88] py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#080a0f] transition-all duration-200 hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.25)]"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
