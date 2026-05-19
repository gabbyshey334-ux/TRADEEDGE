"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
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
    return { count: filtered.length, pnl: sum, wins, losses };
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

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Journal"
        subtitle={`${totals.count} trades · ${formatCurrency(totals.pnl)} net`}
        actions={
          <Button
            onClick={openNew}
            className="shadow-[0_0_18px_rgba(0,229,176,0.35)]"
          >
            <PlusIcon /> Add Trade
          </Button>
        }
      />

      <div className="px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center rounded-full border border-[#1a2030] bg-[#080b11] p-1">
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
                    "relative h-8 px-4 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.22em]",
                    "transition-all duration-150 inline-flex items-center gap-2",
                    active
                      ? "bg-[#00e5b0] text-[#06080d] shadow-[0_0_16px_rgba(0,229,176,0.3)]"
                      : "text-[#8892a4] hover:text-[#e8edf5]"
                  )}
                >
                  <span>{f}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px]",
                      active
                        ? "bg-[#06080d]/20 text-[#06080d]"
                        : "bg-[#0c1018] text-[#5a6580]"
                    )}
                  >
                    {counts}
                  </span>
                </button>
              );
            })}
          </div>

          {totals.count > 0 && (
            <div className="flex items-center gap-5 font-mono text-[11px] text-[#5a6580] uppercase tracking-[0.18em]">
              <div>
                <span className="text-[#00e5b0]">{totals.wins}W</span>
                <span className="mx-1.5 text-[#3a4560]">·</span>
                <span className="text-[#ff4d6d]">{totals.losses}L</span>
              </div>
              <div>
                Net{" "}
                <span
                  className="font-bold"
                  style={{
                    color: totals.pnl >= 0 ? "#00e5b0" : "#ff4d6d",
                  }}
                >
                  {formatCurrency(totals.pnl)}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono animate-fadeInSoft">
            {error}
            <button
              type="button"
              onClick={() => void refresh()}
              className="ml-3 underline"
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
    <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] py-16 px-6 flex flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#080b11] border border-[#1a2030] mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"
            stroke="#00e5b0"
            strokeWidth="1.6"
          />
          <path
            d="M8 9h8M8 13h8M8 17h5"
            stroke="#00e5b0"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="font-heading text-2xl tracking-wide text-[#e8edf5]">
        {hasTrades
          ? `No ${filter.toLowerCase()} trades yet`
          : "Your journal is empty"}
      </h3>
      <p className="mt-2 text-sm text-[#8892a4] font-mono max-w-sm">
        {hasTrades
          ? "Switch filters or log a new trade in this market."
          : "Log your first trade to start building your edge. Every trade leaves a clue."}
      </p>
      <div className="mt-6">
        <Button onClick={onAdd}>
          <PlusIcon /> Add Trade
        </Button>
      </div>
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
