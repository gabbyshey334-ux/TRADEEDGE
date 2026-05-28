"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { PropFirmModal } from "@/components/PropFirmModal";
import {
  createPropFirmAccount,
  deletePropFirmAccount,
  updatePropFirmAccount,
} from "@/lib/actions/prop-firms";
import {
  type ChallengePhase,
  type NewPropFirmAccount,
  type PropFirmAccount,
} from "@/lib/prop-firms";
import { cn, formatCurrency } from "@/lib/utils";

interface PropFirmClientProps {
  initialAccounts: PropFirmAccount[];
  initialError?: string | null;
}

const PHASE_STYLES: Record<
  ChallengePhase,
  { color: string; bg: string; border: string; label?: string }
> = {
  Evaluation: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
  },
  "Phase 1": {
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.1)",
    border: "rgba(14,165,233,0.2)",
  },
  "Phase 2": {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.2)",
  },
  Funded: {
    color: "#00ff88",
    bg: "rgba(0,255,136,0.1)",
    border: "rgba(0,255,136,0.2)",
  },
  Failed: {
    color: "#ff3b5c",
    bg: "rgba(255,59,92,0.1)",
    border: "rgba(255,59,92,0.2)",
  },
  Passed: {
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.1)",
    border: "rgba(14,165,233,0.2)",
  },
};

export function PropFirmClient({
  initialAccounts,
  initialError = null,
}: PropFirmClientProps) {
  const [accounts, setAccounts] = useState<PropFirmAccount[]>(initialAccounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PropFirmAccount | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(account: PropFirmAccount) {
    setEditing(account);
    setModalOpen(true);
  }

  async function handleSave(data: NewPropFirmAccount, id: string | null) {
    setError(null);
    if (id) {
      const res = await updatePropFirmAccount(id, data);
      if (res.error) {
        throw new Error(res.error);
      }
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? (res.data as PropFirmAccount) : a))
      );
    } else {
      const res = await createPropFirmAccount(data);
      if (res.error) {
        throw new Error(res.error);
      }
      setAccounts((prev) => [res.data as PropFirmAccount, ...prev]);
    }
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete(account: PropFirmAccount) {
    if (
      !confirm(
        `Delete ${account.firm_name} (${formatCurrency(account.account_size, 0)})?`
      )
    )
      return;

    setDeletingId(account.id);
    setError(null);
    startTransition(async () => {
      const res = await deletePropFirmAccount(account.id);
      if (res.error) {
        setError(res.error);
        setDeletingId(null);
        return;
      }
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-5 pb-24 sm:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="font-mono uppercase text-[#5a6580]"
          style={{ fontSize: "11px", letterSpacing: "0.24em" }}
        >
          {accounts.length === 0
            ? "No accounts tracked yet"
            : `${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className={cn(
            "hidden sm:inline-flex bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[12px]",
            "tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg",
            "hover:bg-[#00ff88]/90 hover:shadow-[0_0_16px_rgba(0,255,136,0.25)]",
            "transition-all duration-200 active:scale-[0.98]"
          )}
        >
          + Add Account
        </button>
      </div>

      {error && (
        <div
          className="rounded-xl border border-[#ff3b5c]/20 bg-[#ff3b5c]/10 px-4 py-3 text-[12px] text-[#ff3b5c] font-body leading-relaxed"
          role="alert"
        >
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={openEdit}
              onDelete={handleDelete}
              deleting={deletingId === account.id}
            />
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#1c2235] bg-[#080a0f]/95 p-4 backdrop-blur-sm sm:hidden">
        <button
          type="button"
          onClick={openCreate}
          className={cn(
            "w-full rounded-lg bg-[#00ff88] py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-[#080a0f]",
            "transition-all duration-200 hover:bg-[#00ff88]/90 active:scale-[0.98]"
          )}
        >
          + Add Account
        </button>
      </div>

      {modalOpen && (
        <PropFirmModal
          account={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function AccountCard({
  account,
  onEdit,
  onDelete,
  deleting,
}: {
  account: PropFirmAccount;
  onEdit: (a: PropFirmAccount) => void;
  onDelete: (a: PropFirmAccount) => void;
  deleting: boolean;
}) {
  const phase = PHASE_STYLES[account.challenge_phase];
  const progress = useMemo(
    () => computeProgress(account),
    [account]
  );
  const daysSinceStart = useMemo(
    () => computeDaysSinceStart(account.start_date),
    [account.start_date]
  );

  return (
    <article
      className="group relative flex flex-col gap-5 rounded-xl border border-[#1c2235] bg-[#0c0f17] p-5 sm:p-6 overflow-hidden hover:border-[#2a3350] transition-colors duration-200"
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${phase.color}, transparent)`,
        }}
      />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
          className="font-display text-lg font-bold text-[#e8edf5] leading-none truncate"
          >
            {account.firm_name}
          </h3>
          <p className="mt-3 font-mono text-2xl font-bold text-[#e8edf5] tabular-nums">
            {formatCurrency(Number(account.account_size), 0)}
          </p>
        </div>
        <PhaseBadge phase={account.challenge_phase} />
      </header>

      <ProgressBar progress={progress} />

      <DrawdownGrid account={account} />

      <footer className="flex items-center justify-between gap-3 border-t border-[#1c2235] pt-4">
        <span
          className="font-mono uppercase text-[#4a5568]"
          style={{ fontSize: "10px", letterSpacing: "0.24em" }}
        >
          {daysSinceStart === null
            ? "No start date"
            : daysSinceStart === 0
              ? "Started today"
              : `${daysSinceStart} day${daysSinceStart === 1 ? "" : "s"} in`}
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="h-8 w-8 rounded-md grid place-items-center text-[#4a5568] hover:text-[#e8edf5] transition-colors duration-150"
            aria-label="Edit account"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            disabled={deleting}
            className="h-8 w-8 rounded-md grid place-items-center text-[#4a5568] hover:text-[#ff3b5c] disabled:opacity-50 transition-colors duration-150"
            aria-label="Delete account"
          >
            {deleting ? "…" : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </footer>
    </article>
  );
}

function PhaseBadge({ phase }: { phase: ChallengePhase }) {
  const styles = PHASE_STYLES[phase];
  return (
    <span
      className="shrink-0 inline-flex items-center rounded font-mono text-[9px] tracking-widest px-2 py-0.5 uppercase border"
      style={{
        color: styles.color,
        backgroundColor: styles.bg,
        borderColor: styles.border,
      }}
    >
      {phase}
    </span>
  );
}

interface Progress {
  hasData: boolean;
  pct: number;
  startBalance: number;
  currentBalance: number;
  targetBalance: number;
  delta: number;
  deltaPct: number | null;
  state: "ahead" | "behind" | "neutral";
}

function computeProgress(account: PropFirmAccount): Progress {
  const startBalance = Number(account.account_size);
  const target = account.profit_target != null ? Number(account.profit_target) : null;
  const current =
    account.current_balance != null ? Number(account.current_balance) : null;

  if (
    !Number.isFinite(startBalance) ||
    startBalance <= 0 ||
    current === null ||
    !Number.isFinite(current)
  ) {
    return {
      hasData: false,
      pct: 0,
      startBalance,
      currentBalance: current ?? startBalance,
      targetBalance: target ? startBalance * (1 + target / 100) : startBalance,
      delta: 0,
      deltaPct: null,
      state: "neutral",
    };
  }

  const delta = current - startBalance;
  const deltaPct = (delta / startBalance) * 100;

  if (target == null || target <= 0) {
    return {
      hasData: true,
      pct: delta >= 0 ? Math.min(100, Math.max(0, deltaPct)) : 0,
      startBalance,
      currentBalance: current,
      targetBalance: startBalance,
      delta,
      deltaPct,
      state: delta >= 0 ? "ahead" : "behind",
    };
  }

  const targetBalance = startBalance * (1 + target / 100);
  const denom = targetBalance - startBalance;
  const numer = current - startBalance;
  const pct = denom > 0 ? Math.max(0, Math.min(100, (numer / denom) * 100)) : 0;

  return {
    hasData: true,
    pct,
    startBalance,
    currentBalance: current,
    targetBalance,
    delta,
    deltaPct,
    state: delta >= 0 ? "ahead" : "behind",
  };
}

function ProgressBar({ progress }: { progress: Progress }) {
  const accent =
    progress.state === "ahead"
      ? "#00ff88"
      : progress.state === "behind"
        ? "#ff3b5c"
        : "#5a6580";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="font-mono uppercase text-[#5a6580]"
          style={{ fontSize: "10px", letterSpacing: "0.24em" }}
        >
          Progress to Target
        </span>
        {progress.hasData ? (
          <span
            className="font-mono font-bold tabular"
            style={{ fontSize: "12px", color: accent, letterSpacing: "0.04em" }}
          >
            {progress.pct.toFixed(1)}%
          </span>
        ) : (
          <span
            className="font-mono uppercase text-[#3a4560]"
            style={{ fontSize: "10px", letterSpacing: "0.24em" }}
          >
            Set balance
          </span>
        )}
      </div>

      <div className="h-1.5 rounded-full bg-[#1c2235] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: progress.hasData ? `${progress.pct}%` : "0%",
            background:
              progress.state === "ahead"
                ? "#00ff88"
                : progress.state === "behind"
                  ? "#ff3b5c"
                  : "#f59e0b",
            boxShadow:
              progress.state === "ahead"
                ? "0 0 8px rgba(0,255,136,0.3)"
                : progress.state === "behind"
                  ? "0 0 8px rgba(255,59,92,0.3)"
                  : undefined,
          }}
        />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span
          className="font-mono text-[#8892a4] tabular"
          style={{ fontSize: "12px" }}
        >
          {progress.hasData
            ? formatCurrency(progress.currentBalance, 0)
            : "—"}
          <span className="text-[#3a4560]">
            {" "}/ {formatCurrency(progress.targetBalance, 0)}
          </span>
        </span>
        {progress.hasData && progress.deltaPct !== null && (
          <span
            className="font-mono font-bold tabular"
            style={{ fontSize: "11px", color: accent }}
          >
            {progress.delta >= 0 ? "+" : ""}
            {formatCurrency(progress.delta, 0)} ({progress.deltaPct >= 0 ? "+" : ""}
            {progress.deltaPct.toFixed(2)}%)
          </span>
        )}
      </div>
    </div>
  );
}

function DrawdownGrid({ account }: { account: PropFirmAccount }) {
  const items: Array<{ label: string; value: string }> = [
    {
      label: "Profit Target",
      value:
        account.profit_target != null ? `${Number(account.profit_target)}%` : "—",
    },
    {
      label: "Max DD",
      value: account.max_drawdown != null ? `${Number(account.max_drawdown)}%` : "—",
    },
    {
      label: "Daily DD",
      value:
        account.daily_drawdown != null ? `${Number(account.daily_drawdown)}%` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-[#1c2235] bg-[#111520] px-3 py-3"
        >
          <div
            className="font-mono text-[9px] text-[#4a5568] tracking-widest uppercase"
            style={{ fontSize: "9px", letterSpacing: "0.24em" }}
          >
            {item.label}
          </div>
          <div
            className={cn("mt-1 font-mono text-[13px] text-[#8892a4] tabular-nums truncate")}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-[#0c0f17] border border-dashed border-[#1c2235] rounded-xl py-20 px-6 flex flex-col items-center text-center">
      <span className="font-mono text-4xl text-[#2a3350]">&gt;</span>
      <h3 className="font-display text-xl font-bold text-[#e8edf5] mt-6">
        Track Your First Prop Firm Account
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-[13px] text-[#8892a4] font-body leading-relaxed">
        Add your evaluation or funded account to monitor profit targets, drawdown
        rules, and current balance in one place.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            "bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[12px]",
            "tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg",
            "hover:bg-[#00ff88]/90 hover:shadow-[0_0_16px_rgba(0,255,136,0.25)]",
            "transition-all duration-200 active:scale-[0.98]"
          )}
        >
          + Add First Account
        </button>
      </div>
    </div>
  );
}

function computeDaysSinceStart(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((nowUtc - startUtc) / 86_400_000));
}
