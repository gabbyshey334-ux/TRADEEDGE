"use client";

import { useMemo, useState } from "react";
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
        unit: "LOTS",
      };
    }

    const sl = Number(stopLossTicks) || 0;
    const tv = Number(tickValue) || 0;
    const contracts = sl > 0 && tv > 0 ? riskAmount / (sl * tv) : 0;
    return {
      riskAmount,
      positionSize: contracts,
      positionLabel: "Contracts",
      unit: "CONTRACTS",
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

  const formulaText =
    mode === "Forex"
      ? "Lots = (Account × Risk%) / (Stop Loss pips × Pip Value)"
      : "Contracts = (Account × Risk%) / (Stop Loss ticks × Tick Value)";

  return (
    <div className="animate-fadeIn">
      <div className="border-b border-[#1c2235] pb-6 mb-6">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
          POSITION SIZING
        </div>
        <h1 className="font-display text-3xl font-bold text-[#e8edf5] mt-1">
          Risk Calculator
        </h1>
        <p className="font-body text-[13px] text-[#8892a4] mt-2">
          Size your positions with precision
        </p>
      </div>

      <div className="dashboard-page">
        <div className="mx-auto w-full max-w-[640px] space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-lg border border-[#1c2235] bg-[#0c0f17] p-1">
              {(["Forex", "Futures"] as Mode[]).map((m) => {
                const active = mode === m;
                const isForex = m === "Forex";
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md px-6 py-2 font-mono text-[11px] tracking-[0.1em] uppercase",
                      "transition-all duration-150 active:scale-[0.98]",
                      active
                        ? isForex
                          ? "border border-[#0ea5e9]/20 bg-[#0ea5e9]/10 text-[#0ea5e9]"
                          : "border border-[#a78bfa]/20 bg-[#a78bfa]/10 text-[#a78bfa]"
                        : "border border-transparent text-[#4a5568] hover:bg-[#111520] hover:text-[#e8edf5]"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input panel */}
          <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
            <div className="flex items-center justify-between border-b border-[#1c2235] bg-[#080a0f] px-6 py-3">
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
                INPUTS
              </span>
              <span
                className={cn(
                  "font-mono text-[9px] tracking-[0.15em] uppercase",
                  mode === "Forex" ? "text-[#0ea5e9]" : "text-[#a78bfa]"
                )}
              >
                {mode === "Forex" ? "FOREX MODE" : "FUTURES MODE"}
              </span>
            </div>

            <div className="space-y-5 px-6 py-5">
              <TerminalInput
                label="Account Size"
                type="number"
                step="0.01"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                prefix="$"
              />
              <TerminalInput
                label="Risk Per Trade"
                type="number"
                step="0.01"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                suffix="%"
              />

              {mode === "Forex" ? (
                <>
                  <TerminalInput
                    label="Stop Loss"
                    type="number"
                    step="0.1"
                    value={stopLossPips}
                    onChange={(e) => setStopLossPips(e.target.value)}
                    suffix="PIPS"
                  />
                  <TerminalInput
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
                  <TerminalInput
                    label="Stop Loss"
                    type="number"
                    step="1"
                    value={stopLossTicks}
                    onChange={(e) => setStopLossTicks(e.target.value)}
                    suffix="TICKS"
                  />
                  <TerminalInput
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
          </div>

          {/* Results panel */}
          <div className="mt-4 overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
            <div className="border-b border-[#1c2235] bg-[#080a0f] px-6 py-3">
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
                OUTPUT
              </span>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ResultBox
                  label={calc.positionLabel}
                  value={formatNumber(calc.positionSize, 4)}
                  hint={calc.unit}
                  variant="position"
                />
                <ResultBox
                  label="Risk Amount"
                  value={formatCurrency(calc.riskAmount)}
                  hint="MAX LOSS PER TRADE"
                  variant="risk"
                />
              </div>
            </div>

            <div className="overflow-x-auto border-t border-[#1c2235] bg-[#080a0f] px-6 py-3">
              <div className="flex min-w-0 items-center whitespace-nowrap">
                <span className="font-mono text-[9px] tracking-widest text-[#4a5568] uppercase shrink-0">
                  FORMULA
                </span>
                <span className="mx-2 shrink-0 text-[#2a3350]">›</span>
                <span className="font-mono text-[11px] text-[#8892a4]">
                  {formulaText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalInput({
  label,
  hint,
  prefix,
  suffix,
  className,
  ...props
}: {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[10px] tracking-[0.15em] text-[#4a5568] uppercase">
        {label}
      </label>
      <div
        className={cn(
          "relative flex items-center rounded-lg border border-[#1c2235] bg-[#080a0f]",
          "transition-all duration-150",
          "focus-within:border-[#2a3350] focus-within:shadow-[0_0_0_1px_rgba(0,255,136,0.1)]"
        )}
      >
        {prefix && (
          <span className="select-none border-r border-[#1c2235] px-3 py-3 font-mono text-[13px] text-[#4a5568]">
            {prefix}
          </span>
        )}
        <input
          className={cn(
            "flex-1 bg-transparent px-3 py-3 font-mono text-[14px] text-[#e8edf5] outline-none placeholder:text-[#4a5568]",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="select-none border-l border-[#1c2235] px-3 py-3 font-mono text-[11px] text-[#4a5568] uppercase">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 font-body text-[11px] text-[#4a5568] italic">{hint}</p>
      )}
    </div>
  );
}

function ResultBox({
  label,
  value,
  hint,
  variant,
}: {
  label: string;
  value: string;
  hint: string;
  variant: "position" | "risk";
}) {
  const isPosition = variant === "position";

  return (
    <div className="rounded-xl border border-[#1c2235] bg-[#080a0f] p-5">
      <div className="mb-2 font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-3xl font-bold leading-none tabular-nums",
          isPosition ? "text-[#00ff88]" : "text-[#ff3b5c]"
        )}
        style={
          isPosition
            ? { textShadow: "0 0 20px rgba(0, 255, 136, 0.3)" }
            : undefined
        }
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] text-[#4a5568] uppercase tracking-[0.12em]">
        {hint}
      </div>
    </div>
  );
}
