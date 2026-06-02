"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, TriangleAlert } from "lucide-react";
import { normalizeTradeType } from "@/lib/congressional-trades";
import { cn, formatDate } from "@/lib/utils";
import type {
  CongressionalTrade,
  CongressionalTradesResponse,
} from "@/app/api/congressional-trades/route";

type TradeTypeFilter = "all" | "Purchase" | "Sale";

const PAGE_SIZE = 20;

export function CongressTradesTable() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CongressionalTrade[]>([]);
  const [meta, setMeta] = useState<{
    source: CongressionalTradesResponse["source"];
    error: string | null;
    fetched_at: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TradeTypeFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/congressional-trades", {
          cache: "no-store",
        });
        const json = (await res.json()) as CongressionalTradesResponse;
        if (cancelled) return;
        setRows(
          Array.isArray(json.data)
            ? json.data.map((r) => ({
                ...r,
                trade_type: normalizeTradeType(r.trade_type),
              }))
            : []
        );
        setMeta({
          source: json.source,
          error: json.error,
          fetched_at: json.fetched_at,
        });
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setMeta({
          source: "empty",
          error:
            err instanceof Error
              ? err.message
              : "Failed to load congressional trades.",
          fetched_at: new Date().toISOString(),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && normalizeTradeType(r.trade_type) !== typeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        r.ticker.toLowerCase().includes(q) ||
        r.member_name.toLowerCase().includes(q)
      );
    });
  }, [rows, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {meta?.error && (
        <div
          className="rounded-lg bg-[#f59e0b]/[0.06] border border-[#f59e0b]/20 px-4 py-3"
          role="status"
        >
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-[#f59e0b] shrink-0" />
            <p className="font-mono text-[11px] text-[#f59e0b]">
              {meta.error}
            </p>
          </div>
        </div>
      )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
          <SearchInput value={search} onChange={setSearch} />
          <TypeFilter value={typeFilter} onChange={setTypeFilter} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={
            rows.length === 0
              ? meta?.source === "empty"
                ? "No congressional trade disclosures are available right now. Check back later — the feed refreshes hourly."
                : "No congressional trades in this snapshot. The feed refreshes every hour."
              : "No trades match your filters."
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-[#1c2235] bg-[#0c0f17] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#1c2235] bg-[#080a0f] flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              {meta?.fetched_at && (
                <span className="font-mono text-[9px] text-[#4a5568] tracking-wide">
                  Refreshed {formatDate(meta.fetched_at)}
                </span>
              )}
              <SourcePill source={meta?.source ?? "empty"} />
            </div>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-[#1c2235]">
              {visible.map((row) => (
                <MobileRow key={row.id} row={row} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="hidden sm:table w-full min-w-[680px] border-collapse">
                <thead>
                  <tr className="bg-[#080a0f] border-b border-[#1c2235]">
                    <Th>Date</Th>
                    <Th>Member</Th>
                    <Th>Party</Th>
                    <Th>Ticker</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
                    <Th>State</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row, i) => (
                    <DesktopRow key={row.id} row={row} zebra={i % 2 === 1} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalRows={filtered.length}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-full sm:w-[300px]">
      <div className="bg-[#0c0f17] border border-[#1c2235] rounded-lg px-3 py-2.5 flex items-center gap-2 focus-within:border-[#2a3350] focus-within:shadow-[0_0_0_1px_rgba(0,255,136,0.08)] transition-all duration-150">
        <Search className="text-[#4a5568] w-4 h-4" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ticker or member"
        className={cn(
          "flex-1 bg-transparent outline-none",
          "font-mono text-[13px] text-[#e8edf5]",
          "placeholder:text-[#4a5568]"
        )}
      />
      </div>
    </div>
  );
}

function TypeFilter({
  value,
  onChange,
}: {
  value: TradeTypeFilter;
  onChange: (v: TradeTypeFilter) => void;
}) {
  return (
    <div className="inline-flex gap-2">
      {(["all", "Purchase", "Sale"] as const).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "px-4 py-1.5 rounded font-mono text-[11px] tracking-wider uppercase border transition-all duration-150",
              active
                ? opt === "all"
                  ? "bg-[#111520] border-[#2a3350] text-[#e8edf5]"
                  : opt === "Purchase"
                    ? "bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]"
                    : "bg-[#ff3b5c]/10 border-[#ff3b5c]/20 text-[#ff3b5c]"
                : "border-[#1c2235] bg-transparent text-[#4a5568] hover:text-[#e8edf5] hover:border-[#2a3350]"
            )}
          >
            {opt === "all" ? "All" : opt}
          </button>
        );
      })}
    </div>
  );
}

function SourcePill({
  source,
}: {
  source: CongressionalTradesResponse["source"];
}) {
  if (source === "empty") return null;

  const dotColor = source === "live" ? "#00ff88" : "#f59e0b";
  const label = source === "live" ? "LIVE" : "CACHED";

  return (
    <div className="flex items-center gap-2 self-start sm:self-auto" role="status" aria-label={label}>
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", source === "live" && "animate-pulse")}
        style={{ backgroundColor: dotColor }}
      />
      <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: dotColor }}>
        {label}
      </span>
    </div>
  );
}

function PartyBadge({ party }: { party: string | null }) {
  const p = party === "N/A" ? null : party;
  if (p === "D") {
    return (
      <span className="inline-flex items-center font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20 uppercase">
        DEM
      </span>
    );
  }
  if (p === "R") {
    return (
      <span className="inline-flex items-center font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/20 uppercase">
        REP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border bg-[#1c2235] text-[#4a5568] border-[#1c2235] uppercase">
      {p || "—"}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  const isPurchase = type === "Purchase";
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border uppercase",
        isPurchase
          ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
          : "bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/20"
      )}
    >
      {type}
    </span>
  );
}

function DesktopRow({
  row,
  zebra,
}: {
  row: CongressionalTrade;
  zebra: boolean;
}) {
  const date = row.trade_date ?? row.disclosure_date;
  return (
    <tr
      className={cn(
        "border-b border-[#1c2235]/50 last:border-b-0 transition-colors duration-100",
        zebra ? "bg-[#0c0f17]" : "bg-transparent",
        "hover:bg-[#111520]"
      )}
    >
      <Td className="text-[#4a5568]">{date ? formatDate(date) : "—"}</Td>
      <Td className="text-[#e8edf5] font-body text-[13px] font-medium">{row.member_name}</Td>
      <Td>
        <PartyBadge party={row.party} />
      </Td>
      <Td className="text-[#e8edf5] font-semibold tracking-[0.02em]">
        {row.ticker}
      </Td>
      <Td>
        <TypePill type={normalizeTradeType(row.trade_type)} />
      </Td>
      <Td className="text-[#f59e0b]">{row.amount_range || "—"}</Td>
      <Td className="text-[#4a5568] text-[11px]">{row.state || "—"}</Td>
    </tr>
  );
}

function MobileRow({ row }: { row: CongressionalTrade }) {
  const date = row.trade_date ?? row.disclosure_date;
  return (
    <div className="px-4 py-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-body text-[13px] font-medium text-[#e8edf5] truncate">
          {row.member_name}
        </span>
        <TypePill type={normalizeTradeType(row.trade_type)} />
      </div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[13px] font-semibold text-[#e8edf5]">
          {row.ticker}
        </span>
        <span className="font-mono text-[12px] text-[#f59e0b] shrink-0">
          {row.amount_range || "—"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <PartyBadge party={row.party} />
        <span className="font-mono text-[10px] text-[#4a5568]">
          {row.state || "—"}
        </span>
        <span className="ml-auto font-mono text-[10px] text-[#4a5568]">
          {date ? formatDate(date) : "—"}
        </span>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalRows,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalRows: number;
  onChange: (p: number) => void;
}) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalRows);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
      className="font-mono uppercase text-[#4a5568]"
        style={{ fontSize: "10px", letterSpacing: "0.24em" }}
      >
        Showing {start}–{end} of {totalRows}
      </div>
      <div className="inline-flex items-center gap-2">
        <PageButton
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          label="Prev"
        />
        <span
          className="font-mono text-[#8892a4]"
          style={{ fontSize: "12px", letterSpacing: "0.06em" }}
        >
          {page} / {totalPages}
        </span>
        <PageButton
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          label="Next"
        />
      </div>
    </div>
  );
}

function PageButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 px-3 rounded border border-[#1c2235] bg-[#080a0f]",
        "font-mono font-bold uppercase text-[#8892a4]",
        "transition-colors duration-150",
        "hover:text-[#e8edf5] hover:border-[#2a3050]",
        "disabled:opacity-40 disabled:cursor-not-allowed"
      )}
      style={{ fontSize: "10px", letterSpacing: "0.22em" }}
    >
      {label}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-[#1c2235] bg-[#0c0f17] p-10 sm:p-14 text-center"
    >
      <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-full bg-[#080a0f] border border-[#1c2235]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 11h6M9 15h6"
            stroke="#4a5568"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p
        className="font-mono uppercase text-[#4a5568] max-w-md mx-auto leading-relaxed"
        style={{ fontSize: "11px", letterSpacing: "0.24em" }}
      >
        {message}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="skeleton h-10 w-full sm:w-[260px] rounded-sm" />
        <div className="skeleton h-10 w-[180px] hidden sm:block rounded-sm" />
      </div>
      <div className="rounded-xl border border-[#1c2235] bg-[#0c0f17] overflow-hidden">
        <div className="bg-[#080a0f] border-b border-[#1c2235] px-5 py-3">
          <div className="skeleton h-3 w-32 rounded-sm" />
        </div>
        <div className="divide-y divide-[#1c2235]/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="skeleton h-3 w-16 rounded-sm" />
              <div className="skeleton h-3 flex-1 rounded-sm" />
              <div className="skeleton h-3 w-10 rounded-sm" />
              <div className="skeleton h-3 w-14 rounded-sm" />
              <div className="skeleton h-3 w-20 rounded-sm hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase font-medium px-4 py-3 text-left"
      style={{
        fontSize: "9px",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        "font-mono text-[12px] text-[#8892a4]",
        className
      )}
    >
      {children}
    </td>
  );
}
