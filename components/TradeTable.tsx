"use client";

import { useState } from "react";
import type { Trade } from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface TradeTableProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void | Promise<void>;
  compact?: boolean;
  emptyMessage?: string;
}

export function TradeTable({
  trades,
  onEdit,
  onDelete,
  compact = false,
  emptyMessage = "No trades yet. Add your first trade to get started.",
}: TradeTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!trades.length) {
    return (
      <div className="rounded-xl border border-[#1c2235] bg-[#0c0f17] p-10 sm:p-14 text-center font-mono uppercase text-[11px] tracking-[0.24em] text-[#4a5568]">
        {emptyMessage}
      </div>
    );
  }

  async function handleDelete(t: Trade) {
    if (!onDelete) return;
    if (!confirm(`Delete ${t.symbol} trade from ${t.date}?`)) return;
    setDeletingId(t.id);
    try {
      await onDelete(t);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-[#1c2235] overflow-hidden bg-[#0c0f17]">
      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-[#1c2235]/50">
        {trades.map((t) => {
          const pnl = Number(t.pnl);
          const pnlPositive = pnl >= 0;
          return (
            <div
              key={t.id}
              className={cn(
                "group px-4 py-4 transition-colors duration-100",
                onEdit && "cursor-pointer hover:bg-[#111520] active:bg-[#111520]"
              )}
              onClick={() => onEdit?.(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[17px] font-semibold text-[#e8edf5] truncate">
                    {t.symbol}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <MarketBadge market={t.market} />
                    <DirectionBadge direction={t.direction} />
                  </div>
                </div>
                <div
                  className={cn(
                    "shrink-0 font-mono text-[18px] font-semibold text-right tabular-nums",
                    pnlPositive ? "text-[#00ff88]" : "text-[#ff3b5c]"
                  )}
                >
                  {formatCurrency(pnl)}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <span>
                  <span className="block font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
                    Date
                  </span>
                  <span className="mt-0.5 block font-mono text-[12px] text-[#4a5568]">
                    {formatDate(t.date)}
                  </span>
                </span>
                <span>
                  <span className="block font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
                    Entry
                  </span>
                  <span className="mt-0.5 block font-mono text-[12px] text-[#e8edf5]">
                    {Number(t.entry).toFixed(5)}
                  </span>
                </span>
                <span>
                  <span className="block font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
                    R:R
                  </span>
                  <span className="mt-0.5 block font-mono text-[12px] text-[#a78bfa]">
                    {t.rr != null ? Number(t.rr).toFixed(2) : "—"}
                  </span>
                </span>
                {!compact && t.setup && (
                  <span className="col-span-3 pt-1">
                    <span className="block font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
                      Setup
                    </span>
                    <span className="mt-0.5 block font-mono text-[12px] text-[#8892a4]">
                      {t.setup}
                    </span>
                  </span>
                )}
              </div>
              {(onEdit || onDelete) && (
                <div
                  className="mt-3 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      className="font-mono text-[10px] tracking-widest uppercase text-[#8892a4] hover:text-[#e8edf5] transition-colors duration-150"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t)}
                      className="font-mono text-[10px] tracking-widest uppercase text-[#8892a4] hover:text-[#ff3b5c] transition-colors duration-150 disabled:opacity-50"
                    >
                      {deletingId === t.id ? "…" : "Delete"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="bg-[#080a0f] border-b border-[#1c2235]">
              <Th>Date</Th>
              <Th>Symbol</Th>
              <Th>Market</Th>
              <Th>Dir</Th>
              {!compact && <Th>Setup</Th>}
              {!compact && <Th>Session</Th>}
              <Th align="right">Entry</Th>
              <Th align="right">Exit</Th>
              {!compact && <Th align="right">Size</Th>}
              <Th align="right">R:R</Th>
              <Th align="right">P&amp;L</Th>
              {!compact && <Th>Emotion</Th>}
              {(onEdit || onDelete) && <Th align="right">{""}</Th>}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const pnl = Number(t.pnl);
              const pnlPositive = pnl >= 0;
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "group border-b border-[#1c2235]/50 last:border-0",
                    "transition-colors duration-100 hover:bg-[#111520]",
                    onEdit && "cursor-pointer"
                  )}
                  onClick={() => onEdit?.(t)}
                >
                  <Td className="text-[#4a5568]">{formatDate(t.date)}</Td>
                  <Td className="text-[#e8edf5] font-semibold">{t.symbol}</Td>
                  <Td>
                    <MarketBadge market={t.market} />
                  </Td>
                  <Td>
                    <DirectionBadge direction={t.direction} />
                  </Td>
                  {!compact && (
                    <Td className="text-[#8892a4]">{t.setup ?? "—"}</Td>
                  )}
                  {!compact && (
                    <Td className="text-[#8892a4]">{t.session ?? "—"}</Td>
                  )}
                  <Td align="right" className="text-[#e8edf5] tabular-nums">
                    {Number(t.entry).toFixed(5)}
                  </Td>
                  <Td align="right" className="text-[#e8edf5] tabular-nums">
                    {t.exit_price != null ? Number(t.exit_price).toFixed(5) : "—"}
                  </Td>
                  {!compact && (
                    <Td align="right" className="text-[#8892a4] tabular-nums">
                      {t.size != null ? Number(t.size).toFixed(2) : "—"}
                    </Td>
                  )}
                  <Td align="right" className="text-[#a78bfa] tabular-nums">
                    {t.rr != null ? Number(t.rr).toFixed(2) : "—"}
                  </Td>
                  <Td
                    align="right"
                    className={cn(
                      "font-semibold tabular-nums",
                      pnlPositive ? "text-[#00ff88]" : "text-[#ff3b5c]"
                    )}
                  >
                    {formatCurrency(pnl)}
                  </Td>
                  {!compact && (
                    <Td className="font-body text-[11px] text-[#4a5568] italic">
                      {t.emotion ?? "—"}
                    </Td>
                  )}
                  {(onEdit || onDelete) && (
                    <Td align="right" onClick={(e) => e.stopPropagation()}>
                      <div
                        className={cn(
                          "flex items-center justify-end gap-3",
                          "opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        )}
                      >
                        {onEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(t);
                            }}
                            className="font-mono text-[10px] tracking-widest uppercase text-[#8892a4] hover:text-[#e8edf5] transition-colors duration-150"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            disabled={deletingId === t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(t);
                            }}
                            className="font-mono text-[10px] tracking-widest uppercase text-[#8892a4] hover:text-[#ff3b5c] transition-colors duration-150 disabled:opacity-50"
                          >
                            {deletingId === t.id ? "…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: "Long" | "Short" }) {
  const isLong = direction === "Long";
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded border",
        isLong
          ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
          : "bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/20"
      )}
    >
      {direction}
    </span>
  );
}

function MarketBadge({ market }: { market: "Forex" | "Futures" }) {
  const isForex = market === "Forex";
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded border",
        isForex
          ? "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20"
          : "bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20"
      )}
    >
      {market}
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase font-medium px-4 py-3 text-left"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className,
  style,
  onClick,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 font-mono text-[12px] text-[#8892a4]",
        className
      )}
      style={{ textAlign: align, ...style }}
      onClick={onClick}
    >
      {children}
    </td>
  );
}
