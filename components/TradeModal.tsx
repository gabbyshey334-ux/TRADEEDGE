"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NewTrade, Trade } from "@/lib/types";
import {
  EMOTIONS,
  MARKETS,
  SESSIONS,
  SETUPS,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

interface TradeModalProps {
  trade: Trade | null;
  onClose: () => void;
  onSave: (data: NewTrade, id: string | null) => Promise<void> | void;
}

interface FormState {
  date: string;
  symbol: string;
  market: "Forex" | "Futures";
  direction: "Long" | "Short";
  session: string;
  setup: string;
  emotion: string;
  entry: string;
  stop_loss: string;
  exit_price: string;
  size: string;
  pnl: string;
  rr: string;
  notes: string;
  screenshot_url: string;
}

function getFuturesMultiplier(symbol: string): number {
  const sym = symbol.toUpperCase().trim();
  if (sym.includes("NQ")) {
    return sym.includes("M") ? 2 : 20;
  }
  if (sym.includes("ES")) {
    return sym.includes("M") ? 5 : 50;
  }
  if (sym.includes("YM")) {
    return sym.includes("M") ? 0.5 : 5;
  }
  if (sym.includes("CL")) {
    return sym.includes("M") ? 100 : 1000;
  }
  if (sym.includes("GC")) {
    return sym.includes("M") ? 10 : 100;
  }
  return 1;
}

function getForexMultiplier(symbol: string, size: number): number {
  if (size >= 1000) return 1;
  const sym = symbol.toUpperCase().trim();
  if (sym.includes("JPY")) {
    return 1000;
  }
  return 100000;
}

function emptyState(): FormState {
  return {
    date: new Date().toISOString().slice(0, 10),
    symbol: "",
    market: "Forex",
    direction: "Long",
    session: "London",
    setup: "Breakout",
    emotion: "Calm",
    entry: "",
    stop_loss: "",
    exit_price: "",
    size: "",
    pnl: "",
    rr: "",
    notes: "",
    screenshot_url: "",
  };
}

function fromTrade(t: Trade): FormState {
  let stopLossStr = "";
  if (t.entry && t.exit_price && t.rr && t.rr > 0) {
    const reward = t.direction === "Long" ? t.exit_price - t.entry : t.entry - t.exit_price;
    const risk = reward / t.rr;
    const sl = t.direction === "Long" ? t.entry - risk : t.entry + risk;
    stopLossStr = Number(sl.toFixed(5)).toString();
  }

  return {
    date: t.date.slice(0, 10),
    symbol: t.symbol,
    market: t.market,
    direction: t.direction,
    session: t.session ?? "London",
    setup: t.setup ?? "Breakout",
    emotion: t.emotion ?? "Calm",
    entry: String(t.entry ?? ""),
    stop_loss: stopLossStr,
    exit_price: t.exit_price != null ? String(t.exit_price) : "",
    size: t.size != null ? String(t.size) : "",
    pnl: String(t.pnl ?? ""),
    rr: t.rr != null ? String(t.rr) : "",
    notes: t.notes ?? "",
    screenshot_url: t.screenshot_url ?? "",
  };
}

export function TradeModal({ trade, onClose, onSave }: TradeModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    trade ? fromTrade(trade) : emptyState()
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pnlNum = form.pnl ? Number(form.pnl) : null;
  const pnlTone =
    pnlNum === null || Number.isNaN(pnlNum)
      ? "neutral"
      : pnlNum >= 0
        ? "win"
        : "loss";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-calculate P&L and R:R
  useEffect(() => {
    const entryVal = parseFloat(form.entry);
    const exitVal = parseFloat(form.exit_price);
    const sizeVal = parseFloat(form.size);
    const slVal = parseFloat(form.stop_loss);

    let nextPnl = form.pnl;
    let nextRr = form.rr;

    // Calculate PnL if entry, exit, and size are valid
    if (
      !isNaN(entryVal) &&
      !isNaN(exitVal) &&
      !isNaN(sizeVal) &&
      entryVal > 0 &&
      exitVal > 0 &&
      sizeVal > 0
    ) {
      const isLong = form.direction === "Long";
      const diff = isLong ? exitVal - entryVal : entryVal - exitVal;
      let multiplier = 1;
      if (form.market === "Forex") {
        multiplier = getForexMultiplier(form.symbol, sizeVal);
      } else if (form.market === "Futures") {
        multiplier = getFuturesMultiplier(form.symbol);
      }
      const calculatedPnl = Math.round(diff * sizeVal * multiplier * 100) / 100;
      nextPnl = String(calculatedPnl);
    }

    // Calculate R:R if entry, exit, and stop loss are valid
    if (
      !isNaN(entryVal) &&
      !isNaN(exitVal) &&
      !isNaN(slVal) &&
      entryVal > 0 &&
      exitVal > 0 &&
      slVal > 0 &&
      entryVal !== slVal
    ) {
      const reward = Math.abs(exitVal - entryVal);
      const risk = Math.abs(entryVal - slVal);
      const calculatedRr = Math.round((reward / risk) * 100) / 100;
      nextRr = String(calculatedRr);
    }

    // Only update if changed to avoid loop
    if (nextPnl !== form.pnl || nextRr !== form.rr) {
      setForm((f) => ({
        ...f,
        pnl: nextPnl !== f.pnl ? nextPnl : f.pnl,
        rr: nextRr !== f.rr ? nextRr : f.rr,
      }));
    }
  }, [
    form.entry,
    form.exit_price,
    form.size,
    form.stop_loss,
    form.direction,
    form.market,
    form.symbol,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.symbol.trim()) {
      setError("Symbol is required.");
      return;
    }
    if (!form.entry || Number.isNaN(Number(form.entry))) {
      setError("Entry price is required.");
      return;
    }
    if (!form.pnl || Number.isNaN(Number(form.pnl))) {
      setError("P&L is required.");
      return;
    }

    const payload: NewTrade = {
      date: form.date,
      symbol: form.symbol.trim().toUpperCase(),
      market: form.market,
      direction: form.direction,
      session: form.session || null,
      setup: form.setup || null,
      emotion: form.emotion || null,
      entry: Number(form.entry),
      exit_price: form.exit_price ? Number(form.exit_price) : null,
      size: form.size ? Number(form.size) : null,
      pnl: Number(form.pnl),
      rr: form.rr ? Number(form.rr) : null,
      notes: form.notes.trim() || null,
      screenshot_url: form.screenshot_url.trim() || null,
    };

    setSaving(true);
    try {
      await onSave(payload, trade?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trade.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-modal-title"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-[#04060a]/90 backdrop-blur-md animate-fadeInSoft"
        onClick={onClose}
      />

      <div
        className="relative z-10 flex w-full max-w-[720px] max-h-[min(85vh,820px)] flex-col rounded-xl border border-[#1c2235] bg-[#0c0f17] shadow-[0_32px_64px_rgba(0,0,0,0.55)] animate-fadeInSoft overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00ff88] via-[#0ea5e9] to-transparent"
        />

        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#1c2235] bg-[#080a0f] px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#00ff88] uppercase mb-2">
              {trade ? "Edit entry" : "New entry"}
            </p>
            <h2
              id="trade-modal-title"
              className="font-display text-2xl font-bold text-[#e8edf5] leading-tight"
            >
              {trade ? "Edit Trade" : "Log Trade"}
            </h2>
            <p className="mt-2 font-body text-[13px] text-[#8892a4] leading-relaxed">
              {trade
                ? "Update the details for this journal entry."
                : "Capture execution, context, and outcome in one place."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-[#1c2235] bg-[#111520] text-[#8892a4] hover:text-[#e8edf5] hover:border-[#2a3350] active:scale-[0.96] transition-all duration-200"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6 sm:space-y-8">
            {/* Direction + market */}
            <section className="space-y-4">
              <FormSectionLabel accent="#00e5b0">Position</FormSectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <DirectionToggle
                  label="Long"
                  sublabel="Buy"
                  active={form.direction === "Long"}
                  variant="long"
                  onClick={() => update("direction", "Long")}
                />
                <DirectionToggle
                  label="Short"
                  sublabel="Sell"
                  active={form.direction === "Short"}
                  variant="short"
                  onClick={() => update("direction", "Short")}
                />
              </div>
              <div className="inline-flex w-full rounded-sm border border-[#1a2030] bg-[#080b11] p-1">
                {(["Forex", "Futures"] as const).map((m) => {
                  const active = form.market === m;
                  const isForex = m === "Forex";
                  // FOREX → green tone; FUTURES → blue tone (matches table)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => update("market", m)}
                      className={cn(
                        "flex-1 h-10 rounded-sm font-mono font-bold uppercase transition-all duration-150 active:scale-[0.98]",
                        active
                          ? isForex
                            ? "bg-[#00e5b0]/15 text-[#00e5b0] border border-[#00e5b0]/40 shadow-[0_0_14px_rgba(0,229,176,0.18)]"
                            : "bg-[#0066ff]/15 text-[#0066ff] border border-[#0066ff]/40 shadow-[0_0_14px_rgba(0,102,255,0.18)]"
                          : "text-[#5a6580] hover:text-[#8892a4] border border-transparent"
                      )}
                      style={{ fontSize: "10px", letterSpacing: "0.24em" }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Instrument */}
            <section className="space-y-4">
              <FormSectionLabel accent="#0066ff">Instrument</FormSectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4">
                <Input
                  label="Symbol"
                  name="symbol"
                  placeholder="EURUSD · NQ · ES"
                  value={form.symbol}
                  onChange={(e) =>
                    update("symbol", e.target.value.toUpperCase())
                  }
                  className="font-heading text-lg tracking-wide uppercase"
                  required
                />
                <Input
                  label="Date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  required
                />
              </div>
            </section>

            {/* Execution */}
            <section className="space-y-4">
              <FormSectionLabel accent="#f0c040">Execution</FormSectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Input
                  label="Entry"
                  name="entry"
                  type="number"
                  step="0.00001"
                  placeholder="0.00000"
                  value={form.entry}
                  onChange={(e) => update("entry", e.target.value)}
                  required
                />
                <Input
                  label="Stop Loss"
                  name="stop_loss"
                  type="number"
                  step="0.00001"
                  placeholder="0.00000"
                  value={form.stop_loss}
                  onChange={(e) => update("stop_loss", e.target.value)}
                  hint="Optional — auto-calcs R:R"
                />
                <Input
                  label="Exit"
                  name="exit_price"
                  type="number"
                  step="0.00001"
                  placeholder="0.00000"
                  value={form.exit_price}
                  onChange={(e) => update("exit_price", e.target.value)}
                />
                <Input
                  label="Size"
                  name="size"
                  type="number"
                  step="0.0001"
                  placeholder="1.00"
                  value={form.size}
                  onChange={(e) => update("size", e.target.value)}
                />
                <Input
                  label="R : R"
                  name="rr"
                  type="number"
                  step="0.01"
                  placeholder="2.00"
                  value={form.rr}
                  onChange={(e) => update("rr", e.target.value)}
                />
              </div>
              <div
                className={cn(
                  "rounded-sm border-l-2 border p-4 transition-colors duration-150",
                  pnlTone === "win" &&
                    "border-[#00e5b0]/40 bg-[#00e5b0]/[0.04]",
                  pnlTone === "loss" &&
                    "border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.04]",
                  pnlTone === "neutral" && "border-[#1a2030] bg-[#080b11]"
                )}
                style={{
                  borderLeftColor:
                    pnlTone === "win"
                      ? "#00e5b0"
                      : pnlTone === "loss"
                        ? "#ff4d6d"
                        : "#1a2030",
                }}
              >
                <Input
                  label="Profit & Loss"
                  name="pnl"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.pnl}
                  onChange={(e) => update("pnl", e.target.value)}
                  required
                  prefix="$"
                  hint="Required — net result for this trade"
                />
              </div>
            </section>

            {/* Context */}
            <section className="space-y-4">
              <FormSectionLabel accent="#b466ff">Context</FormSectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Session"
                  name="session"
                  options={SESSIONS as unknown as string[]}
                  value={form.session}
                  onChange={(e) => update("session", e.target.value)}
                />
                <Select
                  label="Setup"
                  name="setup"
                  options={SETUPS as unknown as string[]}
                  value={form.setup}
                  onChange={(e) => update("setup", e.target.value)}
                />
                <Select
                  label="Emotion"
                  name="emotion"
                  options={EMOTIONS as unknown as string[]}
                  value={form.emotion}
                  onChange={(e) => update("emotion", e.target.value)}
                />
              </div>
            </section>

            {/* Notes */}
            <section className="space-y-4">
              <FormSectionLabel accent="#8892a4">Notes</FormSectionLabel>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="notes"
                    className="text-[10px] uppercase tracking-[0.18em] text-[#5a6580] font-mono"
                  >
                    Trade notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Setup thesis, execution quality, lessons learned…"
                    className={cn(
                      "w-full rounded-lg bg-[#080b11] border border-[#1a2030] px-4 py-3",
                      "text-sm text-[#e8edf5] font-sans leading-relaxed placeholder:text-[#3a4560]",
                      "focus:outline-none focus:border-[#00e5b0] focus:ring-1 focus:ring-[#00e5b0]/20",
                      "transition-colors duration-150 resize-none"
                    )}
                  />
                </div>
                <Input
                  label="Screenshot URL"
                  name="screenshot_url"
                  placeholder="https://tradingview.com/x/…"
                  value={form.screenshot_url}
                  onChange={(e) => update("screenshot_url", e.target.value)}
                  hint="Optional — link to your chart screenshot"
                />
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono animate-fadeInSoft">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch gap-3 border-t border-[#1c2235] bg-[#080a0f] px-5 py-4 sm:px-7 sm:py-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className={cn(
                "sm:w-[140px] rounded-lg border-[#1c2235] bg-transparent text-[#8892a4]",
                "hover:text-[#e8edf5] hover:border-[#2a3350] hover:bg-[#111520]",
                "transition-all duration-200"
              )}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={cn(
                "flex-1 rounded-lg bg-[#00ff88] text-[#080a0f] border-[#00ff88]",
                "hover:bg-[#00ff88]/90 hover:shadow-[0_0_16px_rgba(0,255,136,0.25)]",
                "transition-all duration-200"
              )}
            >
              {saving
                ? "Saving…"
                : trade
                  ? "Save Changes"
                  : "Save Trade"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function FormSectionLabel({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-px flex-1 max-w-[24px]"
        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
      />
      <span
        className="text-[10px] uppercase tracking-[0.28em] font-mono font-bold"
        style={{ color: accent }}
      >
        {children}
      </span>
      <span className="h-px flex-1 bg-[#1a2030]" />
    </div>
  );
}

function DirectionToggle({
  label,
  sublabel,
  active,
  variant,
  onClick,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  variant: "long" | "short";
  onClick: () => void;
}) {
  const isLong = variant === "long";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-[76px] flex-col items-center justify-center gap-1 rounded-sm border transition-all duration-150",
        "active:scale-[0.98]",
        active
          ? isLong
            ? "border-[#00e5b0] bg-[#00e5b0]/10 shadow-[0_0_24px_rgba(0,229,176,0.22)]"
            : "border-[#ff4d6d] bg-[#ff4d6d]/10 shadow-[0_0_24px_rgba(255,77,109,0.22)]"
          : "border-[#1a2030] bg-[#080b11] hover:border-[#2a3050] hover:bg-[#0f1420]"
      )}
    >
      <span
        className={cn(
          "font-heading text-2xl tracking-wide leading-none transition-colors",
          active
            ? isLong
              ? "text-[#00e5b0]"
              : "text-[#ff4d6d]"
            : "text-[#5a6580] group-hover:text-[#8892a4]"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[9px] uppercase tracking-[0.24em] font-mono transition-colors",
          active ? "text-[#e8edf5]" : "text-[#5a6580]"
        )}
      >
        {sublabel}
      </span>
      {active && (
        <span
          aria-hidden
          className={cn(
            "absolute top-0 left-4 right-4 h-[2px] rounded-full",
            isLong ? "bg-[#00e5b0]" : "bg-[#ff4d6d]"
          )}
        />
      )}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 2l10 10M12 2L2 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
