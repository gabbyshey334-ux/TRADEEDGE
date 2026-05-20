"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

type Mode = "Forex" | "Futures";

export default function RiskCalcPage() {
  const [mode, setMode] = useState<Mode>("Forex");
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [stopLossPips, setStopLossPips] = useState("20");
  const [pipValue, setPipValue] = useState("10");
  const [tickValue, setTickValue] = useState("12.50");
  const [stopLossTicks, setStopLossTicks] = useState("8");

  const calc = useMemo(() => {
    const acct = Number(accountSize) || 0;
    const pct = Number(riskPct) || 0;
    const riskAmount = (acct * pct) / 100;

    if (mode === "Forex") {
      const sl = Number(stopLossPips) || 0;
      const pip = Number(pipValue) || 0;
      const lotSize = sl > 0 && pip > 0 ? riskAmount / (sl * pip) : 0;
      return {
        riskAmount,
        positionSize: lotSize,
        positionLabel: "Lot Size",
        unit: "lots",
      };
    }

    const sl = Number(stopLossTicks) || 0;
    const tv = Number(tickValue) || 0;
    const contracts = sl > 0 && tv > 0 ? riskAmount / (sl * tv) : 0;
    return {
      riskAmount,
      positionSize: contracts,
      positionLabel: "Contracts",
      unit: "contracts",
    };
  }, [
    mode,
    accountSize,
    riskPct,
    stopLossPips,
    pipValue,
    tickValue,
    stopLossTicks,
  ]);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Risk Calculator"
        eyebrow="Position Sizing"
        subtitle="Size your positions with precision"
      />

      <div className="dashboard-page">
        <div className="mx-auto w-full max-w-[640px] space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-sm border border-[#1a2030] bg-[#080b11] p-1">
              {(["Forex", "Futures"] as Mode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "h-10 px-7 rounded-sm",
                      "font-mono font-bold uppercase",
                      "transition-all duration-150 active:scale-[0.98]",
                      active
                        ? "bg-[#00e5b0] text-[#06080d] shadow-[0_0_18px_rgba(0,229,176,0.35)]"
                        : "text-[#8892a4] hover:text-[#e8edf5]"
                    )}
                    style={{ fontSize: "10px", letterSpacing: "0.28em" }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#1a2030] bg-[#0c1018] overflow-hidden">
            <div className="px-5 sm:px-8 py-5 border-b border-[#1a2030]/60 bg-[#080b11]/50">
              <div className="section-label">Inputs</div>
              <h2 className="section-heading mt-3">Position Sizing</h2>
            </div>

            <div className="px-5 sm:px-8 py-6 space-y-4">
              <Input
                label="Account Size"
                type="number"
                step="0.01"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                prefix="$"
              />
              <Input
                label="Risk Per Trade"
                type="number"
                step="0.01"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                suffix="%"
              />

              {mode === "Forex" ? (
                <>
                  <Input
                    label="Stop Loss"
                    type="number"
                    step="0.1"
                    value={stopLossPips}
                    onChange={(e) => setStopLossPips(e.target.value)}
                    suffix="pips"
                  />
                  <Input
                    label="Pip Value per Lot"
                    type="number"
                    step="0.01"
                    value={pipValue}
                    onChange={(e) => setPipValue(e.target.value)}
                    prefix="$"
                    hint="Standard lot pip value (e.g. $10 for most majors)"
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Stop Loss"
                    type="number"
                    step="1"
                    value={stopLossTicks}
                    onChange={(e) => setStopLossTicks(e.target.value)}
                    suffix="ticks"
                  />
                  <Input
                    label="Tick Value"
                    type="number"
                    step="0.01"
                    value={tickValue}
                    onChange={(e) => setTickValue(e.target.value)}
                    prefix="$"
                    hint="e.g. $12.50 for ES, $5 for NQ"
                  />
                </>
              )}
            </div>

            <div className="px-5 sm:px-8 py-5 border-y border-[#1a2030]/60 bg-[#080b11]/50">
              <div className="section-label">Output</div>
              <h2 className="section-heading mt-3">Results</h2>
            </div>

            <div className="px-5 sm:px-8 py-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ResultBox
                  label={calc.positionLabel}
                  value={formatNumber(calc.positionSize, 4)}
                  hint={calc.unit}
                  accent="#00e5b0"
                />
                <ResultBox
                  label="Risk Amount"
                  value={formatCurrency(calc.riskAmount)}
                  hint="max loss per trade"
                  accent="#0066ff"
                />
              </div>

              <div
                className="rounded-sm border border-[#1a2030] bg-[#080b11] px-4 py-3 font-mono text-[#8892a4] leading-relaxed"
                style={{ fontSize: "11px" }}
              >
                <span
                  className="font-bold uppercase"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.28em",
                    color: "#00e5b0",
                  }}
                >
                  Formula
                </span>{" "}
                <span className="text-[#5a6580] mx-1">›</span>{" "}
                {mode === "Forex"
                  ? "Lots = (Account × Risk%) / (Stop Loss pips × Pip Value)"
                  : "Contracts = (Account × Risk%) / (Stop Loss ticks × Tick Value)"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultBox({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-sm border-l-2 border border-[#1a2030] p-5 overflow-hidden transition-colors duration-150"
      style={{
        borderLeftColor: accent,
        backgroundColor: "#0c1018",
        backgroundImage: `linear-gradient(180deg, ${accent}10 0%, transparent 80%)`,
      }}
    >
      <div
        className="font-mono uppercase"
        style={{
          fontSize: "9px",
          letterSpacing: "0.32em",
          color: "#5a6580",
        }}
      >
        {label}
      </div>
      <div
        className="data-value tabular mt-3 leading-none"
        style={{ color: accent, fontSize: "clamp(28px, 4vw, 36px)" }}
      >
        {value}
      </div>
      <div
        className="mt-3 font-mono uppercase"
        style={{
          fontSize: "10px",
          letterSpacing: "0.24em",
          color: "#3a4560",
        }}
      >
        {hint}
      </div>
    </div>
  );
}
