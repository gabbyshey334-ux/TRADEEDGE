"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface PropFirmClientProps {
  initialAccounts: PropFirmAccount[];
  initialError?: string | null;
}

const PHASE_STYLES: Record<
  ChallengePhase,
  { color: string; bg: string; border: string; label?: string }
> = {
  Evaluation: {
    color: "#f0c040",
    bg: "rgba(240,192,64,0.1)",
    border: "rgba(240,192,64,0.4)",
  },
  "Phase 1": {
    color: "#0066ff",
    bg: "rgba(0,102,255,0.12)",
    border: "rgba(0,102,255,0.4)",
  },
  "Phase 2": {
    color: "#b466ff",
    bg: "rgba(180,102,255,0.12)",
    border: "rgba(180,102,255,0.4)",
  },
  Funded: {
    color: "#00e5b0",
    bg: "rgba(0,229,176,0.12)",
    border: "rgba(0,229,176,0.4)",
  },
  Failed: {
    color: "#ff4d6d",
    bg: "rgba(255,77,109,0.12)",
    border: "rgba(255,77,109,0.4)",
  },
  Passed: {
    color: "#00e5b0",
    bg: "rgba(0,229,176,0.12)",
    border: "rgba(0,229,176,0.4)",
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="font-mono uppercase text-[#5a6580]"
          style={{ fontSize: "11px", letterSpacing: "0.24em" }}
        >
          {accounts.length === 0
            ? "No accounts tracked yet"
            : `${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
        </div>
        <Button onClick={openCreate} size="md">
          + Add Account
        </Button>
      </div>

      {error && (
        <div
          className="rounded-sm border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-[12px] text-[#ff4d6d] font-sans leading-relaxed"
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
      className="relative flex flex-col gap-5 rounded-lg border border-[#1a2030] bg-[#0c1018] p-5 sm:p-6 overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.012) 0%, transparent 60%)",
      }}
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
            className="font-heading text-[#e8edf5] leading-none truncate"
            style={{ fontSize: "28px", letterSpacing: "0.05em" }}
          >
            {account.firm_name}
          </h3>
          <p
            className="mt-2 font-mono uppercase text-[#5a6580]"
            style={{ fontSize: "10px", letterSpacing: "0.28em" }}
          >
            {formatCurrency(Number(account.account_size), 0)} account
          </p>
        </div>
        <PhaseBadge phase={account.challenge_phase} />
      </header>

      <ProgressBar progress={progress} />

      <DrawdownGrid account={account} />

      <footer className="flex items-center justify-between gap-3 border-t border-[#1a2030] pt-4">
        <span
          className="font-mono uppercase text-[#5a6580]"
          style={{ fontSize: "10px", letterSpacing: "0.24em" }}
        >
          {daysSinceStart === null
            ? "No start date"
            : daysSinceStart === 0
              ? "Started today"
              : `${daysSinceStart} day${daysSinceStart === 1 ? "" : "s"} in`}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="font-mono uppercase text-[#8892a4] hover:text-[#00e5b0] active:scale-[0.98] transition-colors"
            style={{ fontSize: "10px", letterSpacing: "0.24em" }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            disabled={deleting}
            className="font-mono uppercase text-[#8892a4] hover:text-[#ff4d6d] active:scale-[0.98] disabled:opacity-50 transition-colors"
            style={{ fontSize: "10px", letterSpacing: "0.24em" }}
          >
            {deleting ? "…" : "Delete"}
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
      className="shrink-0 inline-flex items-center rounded-sm font-mono font-bold uppercase"
      style={{
        fontSize: "9px",
        letterSpacing: "0.24em",
        padding: "4px 10px",
        color: styles.color,
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
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
      ? "#00e5b0"
      : progress.state === "behind"
        ? "#ff4d6d"
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

      <div className="h-2 rounded-full bg-[#080b11] border border-[#1a2030] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: progress.hasData ? `${progress.pct}%` : "0%",
            background:
              progress.state === "ahead"
                ? "linear-gradient(90deg, #00e5b0, #0066ff)"
                : progress.state === "behind"
                  ? "linear-gradient(90deg, #ff4d6d, #b466ff)"
                  : "#1a2030",
            boxShadow:
              progress.state === "ahead"
                ? "0 0 14px rgba(0,229,176,0.45)"
                : progress.state === "behind"
                  ? "0 0 14px rgba(255,77,109,0.35)"
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
      label: "Max DD",
      value: account.max_drawdown != null ? `${Number(account.max_drawdown)}%` : "—",
    },
    {
      label: "Daily DD",
      value:
        account.daily_drawdown != null ? `${Number(account.daily_drawdown)}%` : "—",
    },
    {
      label: "Target",
      value:
        account.profit_target != null ? `${Number(account.profit_target)}%` : "—",
    },
    {
      label: "Start",
      value: account.start_date ? formatDate(account.start_date) : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-sm border border-[#1a2030] bg-[#080b11] px-3 py-2.5"
        >
          <div
            className="font-mono uppercase text-[#3a4560]"
            style={{ fontSize: "9px", letterSpacing: "0.24em" }}
          >
            {item.label}
          </div>
          <div
            className={cn(
              "mt-1 font-mono text-[#e8edf5] tabular truncate",
              "text-[13px] font-bold"
            )}
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
    <div className="rounded-lg border border-dashed border-[#1a2030] bg-[#0c1018] p-10 sm:p-14 text-center">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#080b11] border border-[#1a2030]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="7" width="18" height="13" rx="2" stroke="#00e5b0" strokeWidth="1.6" />
          <path
            d="M8 7V5a4 4 0 0 1 8 0v2M12 12v4M10 14h4"
            stroke="#00e5b0"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3
        className="font-heading text-[#e8edf5]"
        style={{ fontSize: "26px", letterSpacing: "0.05em" }}
      >
        Track your first prop firm account
      </h3>
      <p className="mx-auto mt-3 max-w-md text-[13px] text-[#a0afc0] font-sans leading-relaxed">
        Add your evaluation or funded account to monitor profit targets, drawdown
        rules, and current balance in one place.
      </p>
      <div className="mt-6">
        <Button onClick={onAdd}>+ Add First Account</Button>
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
