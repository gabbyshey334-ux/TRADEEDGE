"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChallengePhase } from "@/lib/prop-firms";
import type { Plan } from "@/lib/types";

export interface ChallengeRiskBannerProps {
  accountId: string;
  firmName: string;
  challengeType: string;
  challengePhase: ChallengePhase;
  dailyDrawdown: number;
  maxDrawdown: number;
  profitTarget: number;
  minTradingDays: number;
  accountSize: number;
  currentBalance: number;
  startDate: string | null;
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

function lowRiskMessage(data: ChallengeRiskData, firmName: string): string {
  const dailyUsed = Math.round(data.dailyLimitUsed);
  const maxUsed = Math.round(data.maxDrawdownUsed);
  return `Patterns look healthy for ${firmName}. Daily limit ${dailyUsed}% used · Max drawdown ${maxUsed}% used — no rule-break triggers detected.`;
}

export function ChallengeRiskBanner({
  accountId,
  firmName,
  challengeType,
  challengePhase,
  dailyDrawdown,
  maxDrawdown,
  profitTarget,
  minTradingDays,
  accountSize,
  currentBalance,
  startDate,
  plan,
}: ChallengeRiskBannerProps) {
  const [data, setData] = useState<ChallengeRiskData | null>(null);
  const [loading, setLoading] = useState(plan === "elite");
  const [dismissed, setDismissed] = useState(false);

  const fetchRisk = useCallback(async () => {
    if (plan !== "elite") return;

    setLoading(true);

    try {
      const res = await fetch("/api/ai/challenge-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          firmName,
          challengeType,
          challengePhase,
          dailyDrawdown,
          maxDrawdown,
          profitTarget,
          minTradingDays,
          accountSize,
          currentBalance,
          startDate,
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
    } finally {
      setLoading(false);
    }
  }, [
    plan,
    accountId,
    firmName,
    challengeType,
    challengePhase,
    dailyDrawdown,
    maxDrawdown,
    profitTarget,
    minTradingDays,
    accountSize,
    currentBalance,
    startDate,
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

  if (plan !== "elite") {
    return null;
  }

  if (loading && !data) {
    return (
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#1c2235] bg-[#111520]/80 px-4 py-3">
        <span className="shrink-0 animate-pulse font-mono text-sm text-[#4a5568]">
          ◌
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#4a5568]">
            Rule Break Prediction
          </div>
          <p className="animate-pulse font-body text-[12px] text-[#4a5568]">
            Analyzing journal patterns against challenge rules…
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#1c2235] bg-[#111520]/80 px-4 py-3">
        <span className="shrink-0 font-mono text-sm text-[#4a5568]">◌</span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#4a5568]">
            Rule Break Prediction
          </div>
          <p className="font-body text-[12px] text-[#4a5568]">
            Monitoring active — log trades to update your rule-break risk.
          </p>
        </div>
      </div>
    );
  }

  if (data.riskLevel === "high" && dismissed) {
    return (
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/[0.06] px-4 py-3">
        <span className="shrink-0 font-mono text-sm text-[#00ff88]">●</span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#00ff88]">
            Rule Break Prediction
          </div>
          <p className="font-body text-[12px] text-[#8892a4]">
            High-risk alert dismissed. Updates automatically when you log a
            trade.
          </p>
        </div>
      </div>
    );
  }

  if (data.riskLevel === "low") {
    return (
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/[0.06] px-4 py-3">
        <span className="shrink-0 font-mono text-sm text-[#00ff88]">●</span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#00ff88]">
            Rule Break Prediction
          </div>
          <p className="font-body text-[12px] leading-relaxed text-[#8892a4]">
            <span className="font-medium text-[#00ff88]">Low risk</span>
            {" — "}
            {lowRiskMessage(data, firmName)}
          </p>
        </div>
      </div>
    );
  }

  if (data.riskLevel === "medium") {
    return (
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/[0.08] px-4 py-3">
        <span className="shrink-0 font-mono text-lg text-[#f59e0b]">▲</span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#f59e0b]">
            Rule Break Prediction
          </div>
          <p className="font-body text-[12px] leading-relaxed text-[#f59e0b]/80">
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
      <div className="min-w-0 flex-1 pr-6">
        <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#ff3b5c]">
          Rule Break Prediction — High Risk
        </div>
        <p className="font-body text-[12px] leading-relaxed text-[#ff3b5c]/80">
          {data.warning}
        </p>
      </div>
    </div>
  );
}
