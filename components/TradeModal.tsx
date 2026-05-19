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
  exit_price: string;
  size: string;
  pnl: string;
  rr: string;
  notes: string;
  screenshot_url: string;
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
    exit_price: "",
    size: "",
    pnl: "",
    rr: "",
    notes: "",
    screenshot_url: "",
  };
}

function fromTrade(t: Trade): FormState {
  return {
    date: t.date.slice(0, 10),
    symbol: t.symbol,
    market: t.market,
    direction: t.direction,
    session: t.session ?? "London",
    setup: t.setup ?? "Breakout",
    emotion: t.emotion ?? "Calm",
    entry: String(t.entry ?? ""),
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
        className="relative z-10 flex w-full max-w-[720px] max-h-[min(85vh,820px)] flex-col rounded-2xl border border-[#2a3050] bg-[#0c1018] shadow-[0_32px_64px_rgba(0,0,0,0.55)] animate-fadeInSoft overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00e5b0] via-[#0066ff] to-transparent"
        />

        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#1a2030] px-8 py-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#00e5b0] font-mono mb-2">
              {trade ? "Edit entry" : "New entry"}
            </p>
            <h2
              id="trade-modal-title"
              className="font-heading text-3xl tracking-wide text-[#e8edf5] leading-none"
            >
              {trade ? "Edit Trade" : "Log Trade"}
            </h2>
            <p className="mt-2 text-sm text-[#8892a4] font-sans">
              {trade
                ? "Update the details for this journal entry."
                : "Capture execution, context, and outcome in one place."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2030] bg-[#080b11] text-[#8892a4] hover:text-[#e8edf5] hover:border-[#2a3050] transition-all duration-150"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
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
              <div className="inline-flex w-full rounded-lg border border-[#1a2030] bg-[#080b11] p-1">
                {(["Forex", "Futures"] as const).map((m) => {
                  const active = form.market === m;
                  const isForex = m === "Forex";
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => update("market", m)}
                      className={cn(
                        "flex-1 h-10 rounded-md text-[10px] font-mono font-bold uppercase tracking-[0.22em] transition-all duration-150",
                        active
                          ? isForex
                            ? "bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/40 shadow-[0_0_12px_rgba(0,102,255,0.15)]"
                            : "bg-[#b466ff]/20 text-[#b466ff] border border-[#b466ff]/40 shadow-[0_0_12px_rgba(180,102,255,0.15)]"
                          : "text-[#5a6580] hover:text-[#8892a4] border border-transparent"
                      )}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  "rounded-xl border p-4 transition-colors duration-150",
                  pnlTone === "win" &&
                    "border-[#00e5b0]/40 bg-[#00e5b0]/[0.04]",
                  pnlTone === "loss" &&
                    "border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.04]",
                  pnlTone === "neutral" && "border-[#1a2030] bg-[#080b11]"
                )}
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
          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch gap-3 border-t border-[#1a2030] bg-[#080b11]/80 px-8 py-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="sm:w-[140px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 shadow-[0_0_20px_rgba(0,229,176,0.25)]"
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
        "group relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-150",
        "active:scale-[0.98]",
        active
          ? isLong
            ? "border-[#00e5b0] bg-[#00e5b0]/10 shadow-[0_0_24px_rgba(0,229,176,0.2)]"
            : "border-[#ff4d6d] bg-[#ff4d6d]/10 shadow-[0_0_24px_rgba(255,77,109,0.2)]"
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
