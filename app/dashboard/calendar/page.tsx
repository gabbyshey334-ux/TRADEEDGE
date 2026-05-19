import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForMonth } from "@/lib/data/trades";
import { formatCurrency } from "@/lib/utils";
import type { Trade } from "@/lib/types";

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
      <PageHeader
        title="Calendar"
        subtitle={`${monthlyCount} trades · ${formatCurrency(monthlyTotal)} net this month`}
        actions={
          <div className="flex items-center gap-2">
            <NavArrow
              href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`}
              direction="prev"
            />
            <div className="h-10 px-5 rounded-lg border border-[#1a2030] bg-[#080b11] text-xs font-mono font-bold uppercase tracking-[0.22em] text-[#e8edf5] inline-flex items-center min-w-[180px] justify-center">
              {monthName}
            </div>
            <NavArrow
              href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`}
              direction="next"
            />
          </div>
        }
      />

      <div className="px-8 py-8 space-y-6">
        <div className="relative rounded-xl border border-[#1a2030] bg-[#0c1018] p-6 overflow-hidden">
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: "linear-gradient(to right, #00e5b0, transparent)",
            }}
          />
          <div className="grid grid-cols-7 gap-2 mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-[10px] uppercase tracking-[0.32em] text-[#5a6580] font-mono text-center py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map(({ date, key }) => {
              if (!date) {
                return (
                  <div
                    key={key}
                    className="aspect-square rounded-lg border border-dashed border-[#1a2030]/50 bg-transparent"
                  />
                );
              }
              const isoDate = date.toISOString().slice(0, 10);
              const dayData = byDay.get(isoDate);
              const isToday =
                date.toISOString().slice(0, 10) ===
                new Date().toISOString().slice(0, 10);

              let bg = "#080b11";
              let borderColor = "#1a2030";
              let textColor = "#5a6580";
              if (dayData) {
                const intensity = Math.min(
                  0.5,
                  0.12 + (Math.abs(dayData.pnl) / maxAbsPnl) * 0.38
                );
                const color =
                  dayData.pnl >= 0 ? "0,229,176" : "255,77,109";
                bg = `rgba(${color}, ${intensity})`;
                borderColor = `rgba(${color}, ${Math.min(0.5, intensity + 0.15)})`;
                textColor = "#e8edf5";
              }
              if (isToday) {
                borderColor = "#00e5b0";
              }

              return (
                <div
                  key={key}
                  className="aspect-square rounded-lg p-2.5 flex flex-col border transition-all duration-150 hover:scale-[1.02] cursor-default"
                  style={{ background: bg, borderColor }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="text-[11px] font-mono"
                      style={{
                        color: isToday ? "#00e5b0" : textColor,
                        fontWeight: isToday || dayData ? 700 : 400,
                      }}
                    >
                      {date.getUTCDate()}
                    </div>
                    {dayData && (
                      <span className="inline-flex items-center rounded-full bg-[#06080d]/40 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-[0.18em] text-[#e8edf5]">
                        {dayData.count}
                      </span>
                    )}
                  </div>
                  {dayData && (
                    <div className="mt-auto">
                      <div
                        className="text-[12px] font-mono font-bold"
                        style={{
                          color:
                            dayData.pnl >= 0 ? "#00e5b0" : "#ff4d6d",
                        }}
                      >
                        {formatCurrency(dayData.pnl, 0)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-[#1a2030] bg-[#0c1018] p-5">
          <SummaryItem label="Net P&L" value={formatCurrency(monthlyTotal)} color={monthlyTotal >= 0 ? "#00e5b0" : "#ff4d6d"} />
          <SummaryItem label="Trading Days" value={String(tradingDays)} color="#e8edf5" />
          <SummaryItem label="Win Days" value={String(winDays)} color="#00e5b0" />
          <SummaryItem label="Loss Days" value={String(lossDays)} color="#ff4d6d" />
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
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#5a6580] font-mono">
        {label}
      </div>
      <div
        className="mt-1 font-heading text-2xl tracking-wide leading-none"
        style={{ color }}
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
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2030] text-[#8892a4] hover:text-[#e8edf5] hover:border-[#2a3050] hover:bg-[#0f1420] transition-colors"
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
