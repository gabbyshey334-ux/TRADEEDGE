"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

export interface ChallengeRiskBannerProps {
  accountId: string;
  firmName: string;
  dailyDrawdown: number;
  maxDrawdown: number;
  profitTarget: number;
  accountSize: number;
  currentBalance: number;
  plan: Plan;
}

interface ChallengeRiskData {
  riskLevel: "low" | "medium" | "high";
  warning: string | null;
  dailyLimitUsed: number;
  maxDrawdownUsed: number;
  todayPnl: number;
  revengeTradingRate: number;
}

export function ChallengeRiskBanner({
  accountId,
  firmName,
  dailyDrawdown,
  maxDrawdown,
  profitTarget,
  accountSize,
  currentBalance,
  plan,
}: ChallengeRiskBannerProps) {
  const [data, setData] = useState<ChallengeRiskData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchRisk = useCallback(async () => {
    if (plan !== "elite") return;

    try {
      const res = await fetch("/api/ai/challenge-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          firmName,
          dailyDrawdown,
          maxDrawdown,
          profitTarget,
          accountSize,
          currentBalance,
        }),
      });

      if (!res.ok) return;

      const body = (await res.json()) as ChallengeRiskData;
      setData(body);
      if (body.riskLevel === "high") {
        setDismissed(false);
      }
    } catch {
      setData(null);
    }
  }, [
    plan,
    accountId,
    firmName,
    dailyDrawdown,
    maxDrawdown,
    profitTarget,
    accountSize,
    currentBalance,
  ]);

  useEffect(() => {
    void fetchRisk();
  }, [fetchRisk]);

  useEffect(() => {
    function onTradeLogged() {
      setDismissed(false);
      void fetchRisk();
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        void fetchRisk();
      }
    }

    window.addEventListener("tradeedge:trade-logged", onTradeLogged);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("tradeedge:trade-logged", onTradeLogged);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchRisk]);

  if (plan !== "elite" || !data || data.riskLevel === "low") {
    return null;
  }

  if (data.riskLevel === "high" && dismissed) {
    return null;
  }

  if (data.riskLevel === "medium") {
    return (
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/[0.08] px-4 py-3">
        <span className="shrink-0 font-mono text-lg text-[#f59e0b]">▲</span>
        <div>
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#f59e0b]">
            RULE BREAK RISK DETECTED
          </div>
          <p className="font-body text-[12px] text-[#f59e0b]/80">
            {data.warning}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative mt-3 flex items-start gap-3 rounded-lg border border-[#ff3b5c]/30",
        "bg-[#ff3b5c]/[0.08] px-4 py-3 animate-pulse"
      )}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 font-mono text-[12px] text-[#ff3b5c]/70 transition-colors hover:text-[#ff3b5c]"
        aria-label="Dismiss warning"
      >
        ✕
      </button>
      <span className="shrink-0 font-mono text-lg text-[#ff3b5c]">⚠</span>
      <div className="pr-6">
        <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#ff3b5c]">
          HIGH RISK — STOP TRADING
        </div>
        <p className="font-body text-[12px] text-[#ff3b5c]/80">{data.warning}</p>
      </div>
    </div>
  );
}
