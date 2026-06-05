"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import {
  CHALLENGE_PHASES,
  PROP_FIRM_DATA,
  PROP_FIRM_NAMES,
  type ChallengePhase,
  type NewPropFirmAccount,
  type PropFirmAccount,
  type PropFirmName,
} from "@/lib/prop-firms";

const FIRM_NAMES = PROP_FIRM_NAMES;
type FirmName = PropFirmName;

interface PropFirmModalProps {
  account: PropFirmAccount | null;
  onClose: () => void;
  onSave: (
    data: NewPropFirmAccount,
    id: string | null
  ) => Promise<void> | void;
}

interface FormState {
  selected_firm: FirmName | "";
  selected_challenge: string;
  firm_name: string;
  account_size: string;
  challenge_phase: ChallengePhase;
  profit_target: string;
  max_drawdown: string;
  daily_drawdown: string;
  current_balance: string;
  start_date: string;
  notes: string;
}

function emptyState(): FormState {
  return {
    selected_firm: "",
    selected_challenge: "",
    firm_name: "",
    account_size: "",
    challenge_phase: "Evaluation",
    profit_target: "",
    max_drawdown: "",
    daily_drawdown: "",
    current_balance: "",
    start_date: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function fromAccount(a: PropFirmAccount): FormState {
  let selectedChallenge = "";
  let userNotes = a.notes ?? "";

  if (a.notes?.startsWith("challenge:")) {
    const parts = a.notes.replace("challenge:", "").split("|");
    selectedChallenge = parts[0]?.trim() ?? "";
    userNotes = parts.slice(1).join("|").trim();
  }

  const firmName = FIRM_NAMES.includes(a.firm_name as FirmName)
    ? (a.firm_name as FirmName)
    : "";

  return {
    selected_firm: firmName,
    selected_challenge: selectedChallenge,
    firm_name: a.firm_name,
    account_size: String(a.account_size ?? ""),
    challenge_phase: a.challenge_phase,
    profit_target: a.profit_target != null ? String(a.profit_target) : "",
    max_drawdown: a.max_drawdown != null ? String(a.max_drawdown) : "",
    daily_drawdown: a.daily_drawdown != null ? String(a.daily_drawdown) : "",
    current_balance:
      a.current_balance != null ? String(a.current_balance) : "",
    start_date: a.start_date ? a.start_date.slice(0, 10) : "",
    notes: userNotes,
  };
}

export function PropFirmModal({ account, onClose, onSave }: PropFirmModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    account ? fromAccount(account) : emptyState()
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function handleFirmChange(firm: FirmName | "") {
    if (!firm) {
      setForm((f) => ({
        ...f,
        selected_firm: "",
        selected_challenge: "",
        account_size: "",
        profit_target: "",
        max_drawdown: "",
        daily_drawdown: "",
      }));
      return;
    }
    setForm((f) => ({
      ...f,
      selected_firm: firm,
      selected_challenge: "",
      account_size: "",
      profit_target: "",
      max_drawdown: "",
      daily_drawdown: "",
    }));
  }

  function handleChallengeChange(challenge: string) {
    if (!challenge || !form.selected_firm) return;
    const firm = PROP_FIRM_DATA[form.selected_firm];
    const rules = firm.rules;
    const size =
      firm.accountSizes[challenge as keyof typeof firm.accountSizes];
    setForm((f) => ({
      ...f,
      selected_challenge: challenge,
      account_size: String(size ?? ""),
      profit_target: String(rules.profit_target),
      max_drawdown: String(rules.max_drawdown),
      daily_drawdown: String(rules.daily_drawdown),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.selected_firm) {
      setError("Please select a prop firm.");
      return;
    }
    if (!form.selected_challenge) {
      setError("Please select a challenge type.");
      return;
    }

    const accountSize = Number(form.account_size);
    if (!form.account_size || Number.isNaN(accountSize)) {
      setError("Account size is required.");
      return;
    }

    const numOrNull = (v: string) => {
      if (!v.trim()) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const payload: NewPropFirmAccount = {
      firm_name: form.selected_firm,
      account_size: accountSize,
      challenge_phase: form.challenge_phase,
      profit_target: numOrNull(form.profit_target),
      max_drawdown: numOrNull(form.max_drawdown),
      daily_drawdown: numOrNull(form.daily_drawdown),
      current_balance: numOrNull(form.current_balance),
      start_date: form.start_date || null,
      notes: form.selected_challenge
        ? `challenge:${form.selected_challenge}${
            form.notes.trim() ? `|${form.notes.trim()}` : ""
          }`
        : form.notes.trim() || null,
    };

    setSaving(true);
    try {
      await onSave(payload, account?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account.");
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
      aria-labelledby="prop-firm-modal-title"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-[#04060a]/90 backdrop-blur-md animate-fadeInSoft"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 flex w-full max-w-[680px] max-h-[min(85vh,820px)] flex-col rounded-xl",
          "border border-[#1c2235] bg-[#0c0f17]",
          "shadow-[0_32px_64px_rgba(0,0,0,0.55)] animate-fadeInSoft overflow-hidden"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00ff88] via-[#0ea5e9] to-transparent"
        />

        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#1c2235] bg-[#080a0f] px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#00ff88] uppercase mb-2">
              {account ? "Edit account" : "New account"}
            </p>
            <h2
              id="prop-firm-modal-title"
              className="font-display text-2xl font-bold text-[#e8edf5] leading-tight"
            >
              {account ? "Edit Prop Firm" : "Add Prop Firm"}
            </h2>
            <p className="mt-2 text-[13px] text-[#8892a4] font-body leading-relaxed">
              Track your evaluation, drawdown rules, and current balance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-[#1c2235] bg-[#111520] text-[#8892a4] hover:text-[#e8edf5] hover:border-[#2a3350] active:scale-[0.96] transition-all duration-150"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6 sm:space-y-8">
            <section className="space-y-4">
              <FormSectionLabel accent="#00e5b0">Account</FormSectionLabel>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-[0.18em] text-[#5a6580] uppercase">
                  Firm Name
                </label>
                <select
                  value={form.selected_firm}
                  onChange={(e) =>
                    handleFirmChange(e.target.value as FirmName | "")
                  }
                  required
                  className="w-full rounded-lg bg-[#080b11] border border-[#1a2030] px-4 py-3 font-mono text-[13px] text-[#e8edf5] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-colors duration-150 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                    paddingRight: "40px",
                  }}
                >
                  <option value="" disabled className="text-[#4a5568]">
                    Select a prop firm...
                  </option>
                  {FIRM_NAMES.map((firm) => (
                    <option key={firm} value={firm} className="bg-[#0c0f17]">
                      {firm}
                    </option>
                  ))}
                </select>
              </div>

              {form.selected_firm && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#5a6580] uppercase">
                    Challenge Type
                  </label>
                  <select
                    value={form.selected_challenge}
                    onChange={(e) => handleChallengeChange(e.target.value)}
                    required
                    className="w-full rounded-lg bg-[#080b11] border border-[#1a2030] px-4 py-3 font-mono text-[13px] text-[#e8edf5] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-colors duration-150 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      paddingRight: "40px",
                    }}
                  >
                    <option value="" disabled className="text-[#4a5568]">
                      Select a challenge...
                    </option>
                    {PROP_FIRM_DATA[form.selected_firm].challenges.map(
                      (ch) => (
                        <option key={ch} value={ch} className="bg-[#0c0f17]">
                          {ch}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {form.selected_firm && form.selected_challenge && (
                <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.03] px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                    <span className="font-mono text-[9px] tracking-[0.2em] text-[#00ff88] uppercase">
                      Auto-populated challenge rules
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-[#1c2235] bg-[#080a0f] px-3 py-3">
                      <div className="font-mono text-[9px] tracking-widest text-[#4a5568] uppercase mb-1">
                        Profit Target
                      </div>
                      <div className="font-mono text-[15px] font-bold text-[#00ff88]">
                        {form.profit_target}%
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#1c2235] bg-[#080a0f] px-3 py-3">
                      <div className="font-mono text-[9px] tracking-widest text-[#4a5568] uppercase mb-1">
                        Daily Loss Limit
                      </div>
                      <div className="font-mono text-[15px] font-bold text-[#ff3b5c]">
                        {form.daily_drawdown}%
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#1c2235] bg-[#080a0f] px-3 py-3">
                      <div className="font-mono text-[9px] tracking-widest text-[#4a5568] uppercase mb-1">
                        Max Drawdown
                      </div>
                      <div className="font-mono text-[15px] font-bold text-[#f59e0b]">
                        {form.max_drawdown}%
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#1c2235] bg-[#080a0f] px-3 py-3">
                      <div className="font-mono text-[9px] tracking-widest text-[#4a5568] uppercase mb-1">
                        Min Trading Days
                      </div>
                      <div className="font-mono text-[15px] font-bold text-[#e8edf5]">
                        {PROP_FIRM_DATA[form.selected_firm].rules
                          .min_trading_days === 0
                          ? "None"
                          : `${PROP_FIRM_DATA[form.selected_firm].rules.min_trading_days} days`}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#1c2235] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#4a5568] tracking-wider uppercase">
                      Account Size
                    </span>
                    <span className="font-mono text-[13px] font-bold text-[#e8edf5]">
                      ${Number(form.account_size).toLocaleString()}
                    </span>
                  </div>

                  <p className="font-mono text-[9px] text-[#4a5568] tracking-[0.1em]">
                    These rules are set by {form.selected_firm} and cannot be
                    modified.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Challenge Phase"
                  name="challenge_phase"
                  options={CHALLENGE_PHASES as unknown as string[]}
                  value={form.challenge_phase}
                  onChange={(e) =>
                    update(
                      "challenge_phase",
                      e.target.value as ChallengePhase
                    )
                  }
                />
                <Input
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => update("start_date", e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-4">
              <FormSectionLabel accent="#0066ff">Performance</FormSectionLabel>
              <Input
                label="Current Balance"
                name="current_balance"
                type="number"
                step="0.01"
                placeholder="52500"
                prefix="$"
                value={form.current_balance}
                onChange={(e) => update("current_balance", e.target.value)}
                hint="Optional — used to compute progress vs target"
              />
            </section>

            <section className="space-y-4">
              <FormSectionLabel accent="#8892a4">Notes</FormSectionLabel>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="notes"
                  className="text-[10px] uppercase tracking-[0.18em] text-[#5a6580] font-mono"
                >
                  Account notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Payout schedule, scaling plan, broker notes..."
                  className={cn(
                    "w-full rounded-lg bg-[#080b11] border border-[#1a2030] px-4 py-3",
                    "text-sm text-[#e8edf5] font-sans leading-relaxed placeholder:text-[#3a4560]",
                    "focus:outline-none focus:border-[#00e5b0] focus:ring-1 focus:ring-[#00e5b0]/20",
                    "transition-colors duration-150 resize-none"
                  )}
                />
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono animate-fadeInSoft">
                {error}
              </div>
            )}
          </div>

          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch gap-3 border-t border-[#1c2235] bg-[#080a0f] px-5 py-4 sm:px-7 sm:py-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="sm:w-[140px] rounded-lg border-[#1c2235] bg-transparent text-[#8892a4] hover:text-[#e8edf5] hover:border-[#2a3350] hover:bg-[#111520] transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#00ff88] text-[#080a0f] border-[#00ff88] hover:bg-[#00ff88]/90 hover:shadow-[0_0_16px_rgba(0,255,136,0.25)] transition-all duration-200"
            >
              {saving
                ? "Saving…"
                : account
                  ? "Save Changes"
                  : "Save Account"}
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
