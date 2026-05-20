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
      <div className="rounded-sm border border-[#1a2030] bg-[#0c1018] p-10 sm:p-14 text-center font-mono uppercase text-[11px] tracking-[0.24em] text-[#5a6580]">
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
    <div className="rounded-sm border border-[#1a2030] bg-[#0c1018] overflow-hidden">
      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-[#1a2030]/60">
        {trades.map((t, i) => {
          const pnl = Number(t.pnl);
          const pnlColor = pnl >= 0 ? "#00e5b0" : "#ff4d6d";
          return (
            <div
              key={t.id}
              className={cn(
                "group px-4 py-4 transition-colors duration-150",
                i % 2 === 0 ? "bg-transparent" : "bg-[#0c1018]",
                onEdit && "cursor-pointer active:bg-[#0f1420]"
              )}
              onClick={() => onEdit?.(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[17px] font-bold text-[#e8edf5] truncate tracking-[0.02em]">
                    {t.symbol}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <MarketBadge market={t.market} />
                    <DirectionBadge direction={t.direction} />
                  </div>
                </div>
                <div
                  className="shrink-0 data-value text-right"
                  style={{ color: pnlColor, fontSize: "18px" }}
                >
                  {formatCurrency(pnl)}
                </div>
              </div>
              <div
                className="mt-3 grid grid-cols-3 gap-2 font-mono uppercase text-[9px] tracking-[0.22em] text-[#5a6580]"
              >
                <span>
                  <span className="block text-[#3a4560]">Date</span>
                  <span className="mt-0.5 block text-[#8892a4]">
                    {formatDate(t.date)}
                  </span>
                </span>
                <span>
                  <span className="block text-[#3a4560]">Entry</span>
                  <span className="mt-0.5 block text-[#e8edf5]">
                    {Number(t.entry).toFixed(5)}
                  </span>
                </span>
                <span>
                  <span className="block text-[#3a4560]">R:R</span>
                  <span className="mt-0.5 block text-[#e8edf5]">
                    {t.rr != null ? Number(t.rr).toFixed(2) : "—"}
                  </span>
                </span>
                {!compact && t.setup && (
                  <span className="col-span-3 pt-1">
                    <span className="block text-[#3a4560]">Setup</span>
                    <span className="mt-0.5 block text-[#8892a4]">
                      {t.setup}
                    </span>
                  </span>
                )}
              </div>
              {(onEdit || onDelete) && (
                <div
                  className="mt-3 flex gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      className="font-mono uppercase text-[#8892a4] hover:text-[#00e5b0] active:scale-[0.98] transition-colors"
                      style={{ fontSize: "10px", letterSpacing: "0.24em" }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t)}
                      className="font-mono uppercase text-[#8892a4] hover:text-[#ff4d6d] active:scale-[0.98] disabled:opacity-50 transition-colors"
                      style={{ fontSize: "10px", letterSpacing: "0.24em" }}
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
            <tr className="bg-[#080b11] border-b border-[#1a2030]">
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
            {trades.map((t, i) => {
              const pnl = Number(t.pnl);
              const pnlColor = pnl >= 0 ? "#00e5b0" : "#ff4d6d";
              const zebra = i % 2 === 1;
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "group border-b border-[#1a2030]/60 last:border-b-0",
                    "transition-colors duration-150",
                    zebra ? "bg-[#0c1018]" : "bg-transparent",
                    onEdit && "cursor-pointer hover:bg-[#0f1420]"
                  )}
                  onClick={() => onEdit?.(t)}
                >
                  <Td className="text-[#5a6580]">{formatDate(t.date)}</Td>
                  <Td className="text-[#e8edf5] font-semibold tracking-[0.02em]">
                    {t.symbol}
                  </Td>
                  <Td>
                    <MarketBadge market={t.market} />
                  </Td>
                  <Td>
                    <DirectionBadge direction={t.direction} />
                  </Td>
                  {!compact && <Td className="text-[#8892a4]">{t.setup ?? "—"}</Td>}
                  {!compact && <Td className="text-[#8892a4]">{t.session ?? "—"}</Td>}
                  <Td align="right" className="text-[#e8edf5] tabular">
                    {Number(t.entry).toFixed(5)}
                  </Td>
                  <Td align="right" className="text-[#8892a4] tabular">
                    {t.exit_price != null ? Number(t.exit_price).toFixed(5) : "—"}
                  </Td>
                  {!compact && (
                    <Td align="right" className="text-[#8892a4] tabular">
                      {t.size != null ? Number(t.size).toFixed(2) : "—"}
                    </Td>
                  )}
                  <Td align="right" className="text-[#8892a4] tabular">
                    {t.rr != null ? Number(t.rr).toFixed(2) : "—"}
                  </Td>
                  <Td
                    align="right"
                    style={{ color: pnlColor }}
                    className="data-value tabular"
                  >
                    {formatCurrency(pnl)}
                  </Td>
                  {!compact && (
                    <Td className="text-[#8892a4]">{t.emotion ?? "—"}</Td>
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
                            className="font-mono uppercase text-[#8892a4] hover:text-[#00e5b0] active:scale-[0.98] transition-colors"
                            style={{
                              fontSize: "10px",
                              letterSpacing: "0.24em",
                            }}
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
                            className="font-mono uppercase text-[#8892a4] hover:text-[#ff4d6d] active:scale-[0.98] disabled:opacity-50 transition-colors"
                            style={{
                              fontSize: "10px",
                              letterSpacing: "0.24em",
                            }}
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
      className="inline-flex items-center font-mono font-bold uppercase"
      style={{
        fontSize: "9px",
        letterSpacing: "0.22em",
        padding: "3px 8px",
        borderRadius: "3px",
        backgroundColor: isLong
          ? "rgba(0, 229, 176, 0.1)"
          : "rgba(255, 77, 109, 0.1)",
        color: isLong ? "#00e5b0" : "#ff4d6d",
      }}
    >
      {direction}
    </span>
  );
}

function MarketBadge({ market }: { market: "Forex" | "Futures" }) {
  const isForex = market === "Forex";
  return (
    <span
      className="inline-flex items-center font-mono font-bold uppercase"
      style={{
        fontSize: "9px",
        letterSpacing: "0.22em",
        padding: "3px 8px",
        borderRadius: "3px",
        backgroundColor: isForex
          ? "rgba(0, 229, 176, 0.12)"
          : "rgba(0, 102, 255, 0.12)",
        color: isForex ? "#00e5b0" : "#0066ff",
      }}
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
      className="font-mono uppercase font-medium px-3 lg:px-4 py-3.5 first:pl-5 lg:first:pl-6 last:pr-5 lg:last:pr-6"
      style={{
        textAlign: align,
        fontSize: "9px",
        letterSpacing: "0.32em",
        color: "#5a6580",
      }}
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
        "px-3 lg:px-4 py-3.5 first:pl-5 lg:first:pl-6 last:pr-5 lg:last:pr-6",
        "font-mono text-[13px]",
        className
      )}
      style={{ textAlign: align, ...style }}
      onClick={onClick}
    >
      {children}
    </td>
  );
}
