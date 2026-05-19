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
      <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-12 text-center text-sm text-[#8892a4] font-mono">
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
    <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#080b11] border-b border-[#1a2030] text-[10px] uppercase tracking-[0.22em] text-[#5a6580] font-mono">
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
              {(onEdit || onDelete) && <Th align="right">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const pnl = Number(t.pnl);
              const pnlColor = pnl >= 0 ? "#00e5b0" : "#ff4d6d";
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-b border-[#1a2030] last:border-b-0 font-mono text-[13px] transition-colors duration-150",
                    onEdit && "cursor-pointer hover:bg-[#0f1420]"
                  )}
                  onClick={() => onEdit?.(t)}
                >
                  <Td className="text-[#8892a4]">{formatDate(t.date)}</Td>
                  <Td className="text-[#e8edf5] font-semibold">{t.symbol}</Td>
                  <Td>
                    <MarketBadge market={t.market} />
                  </Td>
                  <Td>
                    <DirectionBadge direction={t.direction} />
                  </Td>
                  {!compact && <Td className="text-[#8892a4]">{t.setup ?? "—"}</Td>}
                  {!compact && <Td className="text-[#8892a4]">{t.session ?? "—"}</Td>}
                  <Td align="right" className="text-[#e8edf5]">
                    {Number(t.entry).toFixed(5)}
                  </Td>
                  <Td align="right" className="text-[#8892a4]">
                    {t.exit_price != null ? Number(t.exit_price).toFixed(5) : "—"}
                  </Td>
                  {!compact && (
                    <Td align="right" className="text-[#8892a4]">
                      {t.size != null ? Number(t.size).toFixed(2) : "—"}
                    </Td>
                  )}
                  <Td align="right" className="text-[#8892a4]">
                    {t.rr != null ? Number(t.rr).toFixed(2) : "—"}
                  </Td>
                  <Td
                    align="right"
                    style={{ color: pnlColor }}
                    className="font-bold"
                  >
                    {formatCurrency(pnl)}
                  </Td>
                  {!compact && (
                    <Td className="text-[#8892a4]">{t.emotion ?? "—"}</Td>
                  )}
                  {(onEdit || onDelete) && (
                    <Td align="right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(t);
                            }}
                            className="text-[10px] uppercase tracking-[0.22em] text-[#8892a4] hover:text-[#00e5b0] transition-colors"
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
                            className="text-[10px] uppercase tracking-[0.22em] text-[#8892a4] hover:text-[#ff4d6d] disabled:opacity-50 transition-colors"
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
        "inline-flex items-center rounded-full px-2 py-0.5",
        "text-[9px] uppercase tracking-[0.22em] font-mono font-bold",
        isLong
          ? "bg-[#00e5b0]/10 text-[#00e5b0] border border-[#00e5b0]/30"
          : "bg-[#ff4d6d]/10 text-[#ff4d6d] border border-[#ff4d6d]/30"
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
        "inline-flex items-center rounded-md px-2 py-0.5",
        "text-[9px] uppercase tracking-[0.22em] font-mono font-bold",
        isForex
          ? "bg-[#0066ff]/10 text-[#0066ff] border border-[#0066ff]/30"
          : "bg-[#b466ff]/10 text-[#b466ff] border border-[#b466ff]/30"
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
      className="px-4 py-3.5 font-medium first:pl-6 last:pr-6"
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
        "px-4 py-3.5 whitespace-nowrap first:pl-6 last:pr-6",
        className
      )}
      style={{ textAlign: align, ...style }}
      onClick={onClick}
    >
      {children}
    </td>
  );
}
