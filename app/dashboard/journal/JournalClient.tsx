"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TradeTable } from "@/components/TradeTable";
import { TradeModal } from "@/components/TradeModal";
import {
  createTrade,
  deleteTrade,
  getTrades,
  updateTrade,
} from "@/lib/actions/trades";
import type { NewTrade, Trade } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type Filter = "All" | "Forex" | "Futures";

interface JournalClientProps {
  initialTrades: Trade[];
}

export function JournalClient({ initialTrades }: JournalClientProps) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [editing, setEditing] = useState<Trade | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "All") return trades;
    return trades.filter((t) => t.market === filter);
  }, [trades, filter]);

  const totals = useMemo(() => {
    const sum = filtered.reduce((s, t) => s + Number(t.pnl), 0);
    const wins = filtered.filter((t) => Number(t.pnl) > 0).length;
    const losses = filtered.filter((t) => Number(t.pnl) < 0).length;
    const winRate = filtered.length ? (wins / filtered.length) * 100 : 0;
    return { count: filtered.length, pnl: sum, wins, losses, winRate };
  }, [filtered]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: Trade) {
    setEditing(t);
    setModalOpen(true);
  }

  async function handleSave(data: NewTrade, id: string | null) {
    if (id) {
      const res = await updateTrade(id, data);
      if (res.error) throw new Error(res.error);
      setTrades((list) =>
        list.map((t) => (t.id === id ? (res.data as Trade) : t))
      );
    } else {
      const res = await createTrade(data);
      if (res.error) throw new Error(res.error);
      setTrades((list) => [res.data as Trade, ...list]);
      window.dispatchEvent(new CustomEvent("tradeedge:trade-logged"));
    }
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete(t: Trade) {
    startTransition(async () => {
      const res = await deleteTrade(t.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      setTrades((list) => list.filter((x) => x.id !== t.id));
    });
  }

  async function refresh() {
    const res = await getTrades();
    if (res.error !== null) setError(res.error);
    else setTrades(res.data);
  }

  const pnlClass =
    totals.pnl > 0
      ? "text-[#00ff88]"
      : totals.pnl < 0
        ? "text-[#ff3b5c]"
        : "text-[#e8edf5]";

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Journal"
        eyebrow="Trade Log"
        subtitle={`${totals.count} trades · ${formatCurrency(totals.pnl)} net`}
        actions={
          <button
            type="button"
            onClick={openNew}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[12px]",
              "tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg",
              "hover:bg-[#00ff88]/90 hover:shadow-[0_0_16px_rgba(0,255,136,0.25)]",
              "transition-all duration-200 active:scale-[0.98]"
            )}
          >
            <PlusIcon />
            Add Trade
          </button>
        }
      />

      <div className="dashboard-page space-y-6">
        <div className="flex overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
          <SummaryStat
            label="Trades"
            value={String(totals.count)}
            valueClass="text-[#e8edf5]"
            className="flex-1 border-r border-[#1c2235]"
          />
          <SummaryStat
            label="Net P&L"
            value={formatCurrency(totals.pnl)}
            valueClass={pnlClass}
            className="flex-1 border-r border-[#1c2235]"
          />
          <SummaryStat
            label="Win Rate"
            value={`${totals.winRate.toFixed(1)}%`}
            valueClass="text-[#0ea5e9]"
            className="flex-1 border-r border-[#1c2235] sm:border-r"
          />
          <SummaryStat
            label="Wins"
            value={String(totals.wins)}
            valueClass="text-[#00ff88]"
            hideMobile
            className="hidden sm:block flex-1 border-r border-[#1c2235]"
          />
          <SummaryStat
            label="Losses"
            value={String(totals.losses)}
            valueClass="text-[#ff3b5c]"
            hideMobile
            className="hidden sm:block flex-1"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Forex", "Futures"] as Filter[]).map((f) => {
            const active = filter === f;
            const counts =
              f === "All"
                ? trades.length
                : trades.filter((t) => t.market === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex items-center border font-mono text-[11px] tracking-wider uppercase",
                  "px-4 py-1.5 rounded transition-all duration-150 active:scale-[0.98]",
                  active
                    ? "bg-[#111520] border-[#2a3350] text-[#e8edf5]"
                    : "bg-transparent border-[#1c2235] text-[#4a5568] hover:text-[#8892a4] hover:border-[#2a3350]"
                )}
              >
                <span>{f}</span>
                <span className="bg-[#1c2235] text-[#4a5568] font-mono text-[9px] px-1.5 rounded ml-1.5 tabular-nums">
                  {counts}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-[#ff3b5c]/20 bg-[#ff3b5c]/10 px-4 py-3 text-xs text-[#ff3b5c] font-mono animate-fadeInSoft">
            {error}
            <button
              type="button"
              onClick={() => void refresh()}
              className="ml-3 underline transition-colors duration-150 hover:text-[#e8edf5]"
            >
              Retry
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            hasTrades={trades.length > 0}
            onAdd={openNew}
            filter={filter}
          />
        ) : (
          <TradeTable
            trades={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {modalOpen && (
        <TradeModal
          trade={editing}
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

function SummaryStat({
  label,
  value,
  valueClass,
  hideMobile,
  className,
}: {
  label: string;
  value: string;
  valueClass: string;
  hideMobile?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 px-4 py-4",
        hideMobile && "hidden sm:block",
        className
      )}
    >
      <div className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
        {label}
      </div>
      <div className={cn("font-mono text-xl font-bold tabular-nums", valueClass)}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  hasTrades,
  onAdd,
  filter,
}: {
  hasTrades: boolean;
  onAdd: () => void;
  filter: Filter;
}) {
  return (
    <div className="rounded-xl border border-[#1c2235] bg-[#0c0f17] py-16 px-6 flex flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#080a0f] border border-[#1c2235] mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"
            stroke="#00ff88"
            strokeWidth="1.6"
          />
          <path
            d="M8 9h8M8 13h8M8 17h5"
            stroke="#00ff88"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="font-display text-2xl font-bold text-[#e8edf5]">
        {hasTrades
          ? `No ${filter.toLowerCase()} trades yet`
          : "Your journal is empty"}
      </h3>
      <p className="mt-2 font-body text-[13px] text-[#8892a4] max-w-sm leading-relaxed">
        {hasTrades
          ? "Switch filters or log a new trade in this market."
          : "Log your first trade to start building your edge. Every trade leaves a clue."}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "mt-6 inline-flex items-center justify-center gap-2",
          "bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[12px]",
          "tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg",
          "hover:bg-[#00ff88]/90 hover:shadow-[0_0_16px_rgba(0,255,136,0.25)]",
          "transition-all duration-200 active:scale-[0.98]"
        )}
      >
        <PlusIcon />
        Add Trade
      </button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6 1.5v9M1.5 6h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
