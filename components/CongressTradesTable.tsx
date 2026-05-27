"use client";

import { useEffect, useMemo, useState } from "react";
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
        setRows(Array.isArray(json.data) ? json.data : []);
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
      if (typeFilter !== "all" && r.trade_type !== typeFilter) return false;
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
          className="rounded-sm border border-[#f0c040]/40 bg-[#f0c040]/[0.06] px-4 py-3 text-[12px] text-[#f0c040] font-sans leading-relaxed"
          role="status"
        >
          {meta.error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
          <SearchInput value={search} onChange={setSearch} />
          <TypeFilter value={typeFilter} onChange={setTypeFilter} />
        </div>
        <SourcePill source={meta?.source ?? "empty"} fetchedAt={meta?.fetched_at} />
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
          <div className="rounded-sm border border-[#1a2030] bg-[#0c1018] overflow-hidden">
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[#1a2030]/60">
              {visible.map((row) => (
                <MobileRow key={row.id} row={row} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr className="bg-[#080b11] border-b border-[#1a2030]">
                    <Th>Date</Th>
                    <Th>Member</Th>
                    <Th>Party</Th>
                    <Th>Ticker</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
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
    <div className="relative w-full sm:w-[260px]">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6580]"
        aria-hidden
      >
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ticker or member"
        className={cn(
          "w-full h-10 rounded-sm bg-[#080b11] border border-[#1a2030]",
          "pl-9 pr-3 text-[13px] text-[#e8edf5] font-mono",
          "placeholder:text-[#3a4560] focus:outline-none",
          "focus:border-[#00e5b0] focus:ring-1 focus:ring-[#00e5b0]/20"
        )}
      />
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
    <div className="inline-flex rounded-sm border border-[#1a2030] bg-[#080b11] p-1">
      {(["all", "Purchase", "Sale"] as const).map((opt) => {
        const active = value === opt;
        const color =
          opt === "Purchase" ? "#00e5b0" : opt === "Sale" ? "#ff4d6d" : "#e8edf5";
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "h-8 px-3 rounded-sm font-mono font-bold uppercase transition-colors duration-150",
              active
                ? "bg-[#0c1018] border border-[#1a2030]"
                : "border border-transparent text-[#5a6580] hover:text-[#e8edf5]"
            )}
            style={{
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: active ? color : undefined,
            }}
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
  fetchedAt,
}: {
  source: CongressionalTradesResponse["source"];
  fetchedAt?: string;
}) {
  if (source === "empty") return null;

  const dotColor = source === "live" ? "#00e5b0" : "#f0c040";
  const label =
    source === "live"
      ? "Live"
      : fetchedAt
        ? `Cached as of ${formatDate(fetchedAt)}`
        : "Cached";

  return (
    <div
      className="flex items-center gap-2 self-start sm:self-auto"
      role="status"
      aria-label={label}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: dotColor,
          boxShadow: `0 0 10px ${dotColor}`,
        }}
      />
      <span
        className="font-mono uppercase"
        style={{ fontSize: "10px", letterSpacing: "0.24em", color: dotColor }}
      >
        {label}
      </span>
    </div>
  );
}

function PartyDot({ party }: { party: string | null }) {
  if (party === "D") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[12px] text-[#a0afc0]">
        <span className="h-2 w-2 rounded-full bg-[#0066ff] shadow-[0_0_8px_rgba(0,102,255,0.5)]" />
        D
      </span>
    );
  }
  if (party === "R") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[12px] text-[#a0afc0]">
        <span className="h-2 w-2 rounded-full bg-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.5)]" />
        R
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[12px] text-[#a0afc0]">
      <span className="h-2 w-2 rounded-full bg-[#5a6580]" />
      {party || "—"}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  const isPurchase = type === "Purchase";
  const color = isPurchase ? "#00e5b0" : "#ff4d6d";
  const bg = isPurchase ? "rgba(0,229,176,0.1)" : "rgba(255,77,109,0.1)";
  return (
    <span
      className="inline-flex items-center font-mono font-bold uppercase"
      style={{
        fontSize: "9px",
        letterSpacing: "0.22em",
        padding: "3px 8px",
        borderRadius: "3px",
        backgroundColor: bg,
        color,
      }}
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
        "border-b border-[#1a2030]/60 last:border-b-0 transition-colors",
        zebra ? "bg-[#0c1018]" : "bg-transparent",
        "hover:bg-[#0f1420]"
      )}
    >
      <Td className="text-[#5a6580]">{date ? formatDate(date) : "—"}</Td>
      <Td className="text-[#e8edf5]">{row.member_name}</Td>
      <Td>
        <PartyDot party={row.party} />
      </Td>
      <Td className="text-[#e8edf5] font-semibold tracking-[0.02em]">
        {row.ticker}
      </Td>
      <Td>
        <TypePill type={row.trade_type} />
      </Td>
      <Td className="text-[#8892a4]">{row.amount_range || "—"}</Td>
    </tr>
  );
}

function MobileRow({ row }: { row: CongressionalTrade }) {
  const date = row.trade_date ?? row.disclosure_date;
  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[16px] font-bold text-[#e8edf5] tracking-[0.02em]">
            {row.ticker}
          </div>
          <div className="mt-1 text-[13px] text-[#e8edf5] font-sans truncate">
            {row.member_name}
          </div>
        </div>
        <TypePill type={row.trade_type} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 font-mono uppercase text-[9px] tracking-[0.22em] text-[#5a6580]">
        <span>
          <span className="block text-[#3a4560]">Date</span>
          <span className="mt-0.5 block text-[#8892a4]">
            {date ? formatDate(date) : "—"}
          </span>
        </span>
        <span>
          <span className="block text-[#3a4560]">Party</span>
          <span className="mt-0.5 block">
            <PartyDot party={row.party} />
          </span>
        </span>
        <span>
          <span className="block text-[#3a4560]">Amount</span>
          <span className="mt-0.5 block text-[#8892a4] normal-case tracking-normal">
            {row.amount_range || "—"}
          </span>
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
        className="font-mono uppercase text-[#5a6580]"
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
        "h-8 px-3 rounded-sm border border-[#1a2030] bg-[#080b11]",
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
      className="rounded-sm border border-[#1a2030] bg-[#0c1018] p-10 sm:p-14 text-center"
    >
      <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-full bg-[#080b11] border border-[#1a2030]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 11h6M9 15h6"
            stroke="#5a6580"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p
        className="font-mono uppercase text-[#5a6580] max-w-md mx-auto leading-relaxed"
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
      <div className="rounded-sm border border-[#1a2030] bg-[#0c1018] overflow-hidden">
        <div className="bg-[#080b11] border-b border-[#1a2030] px-5 py-3">
          <div className="skeleton h-3 w-32 rounded-sm" />
        </div>
        <div className="divide-y divide-[#1a2030]/60">
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

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="font-mono uppercase font-medium px-3 lg:px-4 py-3.5 first:pl-5 lg:first:pl-6 last:pr-5 lg:last:pr-6 text-left"
      style={{
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
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3 lg:px-4 py-3.5 first:pl-5 lg:first:pl-6 last:pr-5 lg:last:pr-6",
        "font-mono text-[13px]",
        className
      )}
    >
      {children}
    </td>
  );
}
