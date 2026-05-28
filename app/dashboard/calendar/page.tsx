import Link from "next/link";
import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForMonth } from "@/lib/data/trades";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const user = await requireAuthUser();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);
  const trades = await getTradesForMonth(user.id, startIso, endIso);

  const byDay = new Map<string, { pnl: number; count: number }>();
  for (const t of trades) {
    const key = t.date.slice(0, 10);
    const cur = byDay.get(key) ?? { pnl: 0, count: 0 };
    cur.pnl += Number(t.pnl);
    cur.count += 1;
    byDay.set(key, cur);
  }

  const maxAbsPnl = Math.max(
    1,
    ...Array.from(byDay.values()).map((d) => Math.abs(d.pnl))
  );

  const monthName = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const firstWeekday = start.getUTCDay();
  const daysInMonth = end.getUTCDate();

  const cells: Array<{ date: Date | null; key: string }> = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ date: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    cells.push({ date, key: date.toISOString() });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `tail-${cells.length}` });
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const monthlyTotal = Array.from(byDay.values()).reduce(
    (s, d) => s + d.pnl,
    0
  );
  const monthlyCount = trades.length;

  const winDays = Array.from(byDay.values()).filter((d) => d.pnl > 0).length;
  const lossDays = Array.from(byDay.values()).filter((d) => d.pnl < 0).length;
  const tradingDays = byDay.size;

  return (
    <div className="animate-fadeIn">
      <div className="border-b border-[#1c2235] pb-6 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
            MONTHLY VIEW
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold text-[#e8edf5]">
            Calendar
          </h1>
          <p className="mt-2 font-mono text-[11px] text-[#4a5568] uppercase">
            {monthlyCount} TRADES · {formatCurrency(monthlyTotal)} NET THIS MONTH
          </p>
        </div>

        <div className="inline-flex items-center gap-1 border border-[#1c2235] rounded-lg bg-[#0c0f17] p-1">
          <NavArrow
            href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`}
            direction="prev"
          />
          <div className="px-6 py-2 font-mono text-[13px] font-medium text-[#e8edf5] tracking-[0.05em] min-w-[120px] text-center uppercase">
            {monthName}
          </div>
          <NavArrow
            href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`}
            direction="next"
          />
        </div>
      </div>

      <div className="dashboard-page space-y-6">
        {/* Monthly summary bar */}
        <div className="grid grid-cols-4 overflow-hidden border border-[#1c2235] rounded-xl bg-[#0c0f17] divide-x divide-[#1c2235]">
          <SummaryItem
            label="Net P&L"
            value={formatCurrency(monthlyTotal)}
            color={monthlyTotal >= 0 ? "#00ff88" : "#ff3b5c"}
          />
          <SummaryItem
            label="Trading Days"
            value={String(tradingDays)}
            color="#e8edf5"
          />
          <SummaryItem label="Win Days" value={String(winDays)} color="#00ff88" />
          <SummaryItem
            label="Loss Days"
            value={String(lossDays)}
            color="#ff3b5c"
          />
        </div>

        <div className="rounded-xl border border-[#1c2235] bg-[#0c0f17] overflow-hidden">
          <div className="hidden sm:block border-b border-[#1c2235] bg-[#080a0f]">
            <div className="grid grid-cols-7">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase text-center py-3"
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-7">
            {cells.map(({ date, key }) => {
              if (!date) {
                return (
                  <div
                    key={key}
                    className="min-h-[100px] p-2 border-r border-b border-[#1c2235] [&:nth-child(7n)]:border-r-0"
                  />
                );
              }
              const isoDate = date.toISOString().slice(0, 10);
              const dayData = byDay.get(isoDate);
              const isToday =
                date.toISOString().slice(0, 10) ===
                new Date().toISOString().slice(0, 10);

              const hasTrades = Boolean(dayData);
              const isWin = Boolean(dayData && dayData.pnl > 0);
              const isLoss = Boolean(dayData && dayData.pnl < 0);
              const isFlat = Boolean(dayData && dayData.pnl === 0);

              let bg = "transparent";
              let dateColor = "#2a3350";
              let dateWeight = "400";
              let pnlColor = "#8892a4";
              let badgeClass = "bg-[#1c2235] text-[#4a5568]";

              if (dayData) {
                if (isWin) {
                  bg = "rgba(0,255,136,0.06)";
                  dateColor = "#00ff88";
                  dateWeight = "600";
                  pnlColor = "#00ff88";
                  badgeClass = "bg-[#00ff88]/20 text-[#00ff88]";
                } else if (isLoss) {
                  bg = "rgba(255,59,92,0.06)";
                  dateColor = "#ff3b5c";
                  dateWeight = "600";
                  pnlColor = "#ff3b5c";
                  badgeClass = "bg-[#ff3b5c]/20 text-[#ff3b5c]";
                } else if (isFlat) {
                  bg = "#111520";
                  dateColor = "#8892a4";
                  pnlColor = "#8892a4";
                  badgeClass = "bg-[#1c2235] text-[#4a5568]";
                }
              }

              return (
                <div
                  key={key}
                  className="min-h-[100px] p-2 relative border-r border-b border-[#1c2235] [&:nth-child(7n)]:border-r-0"
                  style={{
                    background: bg,
                    boxShadow: isToday && !hasTrades ? "inset 0 0 0 1px #2a3350" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="font-mono text-[12px]"
                      style={{
                        color: isToday && !hasTrades ? "#e8edf5" : dateColor,
                        fontWeight: dateWeight,
                      }}
                    >
                      {date.getUTCDate()}
                    </div>
                    {dayData && (
                      <span
                        className={`absolute top-2 right-2 font-mono text-[9px] px-1.5 rounded-full ${badgeClass}`}
                      >
                        {dayData.count}
                      </span>
                    )}
                  </div>
                  {dayData && (
                    <div className="absolute bottom-2 left-2">
                      <div className="font-mono text-[12px] font-bold tabular-nums" style={{ color: pnlColor }}>
                        {formatCurrency(dayData.pnl, 0)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile list */}
          <div className="sm:hidden flex flex-col divide-y divide-[#1c2235]/60">
            {cells
              .filter((c) => c.date)
              .map(({ date, key }) => {
                if (!date) return null;
                const isoDate = date.toISOString().slice(0, 10);
                const dayData = byDay.get(isoDate);
                if (!dayData) return null;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div
                      className="font-mono text-[#8892a4]"
                      style={{ fontSize: "12px" }}
                    >
                      {date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                      <span className="ml-2 text-[#5a6580]">
                        {dayData.count} trade{dayData.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      className="font-mono font-bold tabular-nums"
                      style={{
                        color: dayData.pnl >= 0 ? "#00ff88" : "#ff3b5c",
                        fontSize: "15px",
                      }}
                    >
                      {formatCurrency(dayData.pnl, 0)}
                    </div>
                  </div>
                );
              })}
            {tradingDays === 0 && (
              <p
                className="text-center font-mono uppercase py-8 text-[#4a5568]"
                style={{ fontSize: "10px", letterSpacing: "0.24em" }}
              >
                No trades this month yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
        {label}
      </div>
      <div
        className="font-mono text-xl font-bold tabular-nums mt-1"
        style={{
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function NavArrow({
  href,
  direction,
}: {
  href: string;
  direction: "prev" | "next";
}) {
  const isPrev = direction === "prev";
  return (
    <Link
      href={href}
      className="w-8 h-8 flex items-center justify-center text-[#4a5568] hover:text-[#e8edf5] hover:bg-[#111520] rounded-md transition-all duration-150"
      aria-label={isPrev ? "Previous month" : "Next month"}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d={isPrev ? "M9 2L4 7l5 5" : "M5 2l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
