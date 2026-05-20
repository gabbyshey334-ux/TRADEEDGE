import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader
        title="Calendar"
        eyebrow="Monthly View"
        subtitle={`${monthlyCount} trades · ${formatCurrency(monthlyTotal)} net this month`}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <NavArrow
              href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`}
              direction="prev"
            />
            <div
              className="h-9 sm:h-10 flex-1 sm:flex-none px-3 sm:px-5 rounded-sm border border-[#1a2030] bg-[#080b11] inline-flex items-center justify-center min-w-0 sm:min-w-[180px] truncate font-mono font-bold uppercase text-[#e8edf5]"
              style={{
                fontSize: "11px",
                letterSpacing: "0.28em",
              }}
            >
              {monthName}
            </div>
            <NavArrow
              href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`}
              direction="next"
            />
          </div>
        }
      />

      <div className="dashboard-page space-y-6">
        {/* Monthly summary bar */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden border-y border-[#1a2030] bg-[#1a2030]"
          style={{ marginLeft: "-1px", marginRight: "-1px" }}
        >
          <SummaryItem
            label="Net P&L"
            value={formatCurrency(monthlyTotal)}
            color={monthlyTotal >= 0 ? "#00e5b0" : "#ff4d6d"}
          />
          <SummaryItem
            label="Trading Days"
            value={String(tradingDays)}
            color="#e8edf5"
          />
          <SummaryItem label="Win Days" value={String(winDays)} color="#00e5b0" />
          <SummaryItem
            label="Loss Days"
            value={String(lossDays)}
            color="#ff4d6d"
          />
        </div>

        <div className="rounded-lg border border-[#1a2030] bg-[#0c1018] overflow-hidden">
          <div className="hidden sm:block px-5 py-4 border-b border-[#1a2030]/60 bg-[#080b11]/60">
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="font-mono uppercase text-center"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.32em",
                    color: "#5a6580",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-7 gap-1.5 p-4 sm:gap-2 sm:p-5">
            {cells.map(({ date, key }) => {
              if (!date) {
                return (
                  <div
                    key={key}
                    className="aspect-square rounded-sm border border-dashed border-[#1a2030]/40 bg-transparent"
                  />
                );
              }
              const isoDate = date.toISOString().slice(0, 10);
              const dayData = byDay.get(isoDate);
              const isToday =
                date.toISOString().slice(0, 10) ===
                new Date().toISOString().slice(0, 10);

              let bg = "#080b11";
              let borderColor = "rgba(26,32,48,0.6)";
              let textColor = "#5a6580";
              if (dayData) {
                const intensity = Math.min(
                  0.55,
                  0.14 + (Math.abs(dayData.pnl) / maxAbsPnl) * 0.42
                );
                const color = dayData.pnl >= 0 ? "0,229,176" : "255,77,109";
                bg = `rgba(${color}, ${intensity})`;
                borderColor = `rgba(${color}, ${Math.min(0.6, intensity + 0.18)})`;
                textColor = "#e8edf5";
              }
              if (isToday) {
                borderColor = "#00e5b0";
              }

              return (
                <div
                  key={key}
                  className="aspect-square rounded-sm p-2 sm:p-2.5 flex flex-col border transition-all duration-150 hover:-translate-y-[1px] cursor-default"
                  style={{ background: bg, borderColor }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "11px",
                        color: isToday ? "#00e5b0" : textColor,
                        fontWeight: isToday || dayData ? 700 : 400,
                      }}
                    >
                      {date.getUTCDate()}
                    </div>
                    {dayData && (
                      <span
                        className="inline-flex items-center bg-[#06080d]/50 px-1.5 py-0.5 font-mono uppercase text-[#e8edf5]"
                        style={{
                          fontSize: "8px",
                          letterSpacing: "0.22em",
                          borderRadius: "2px",
                        }}
                      >
                        {dayData.count}
                      </span>
                    )}
                  </div>
                  {dayData && (
                    <div className="mt-auto">
                      <div
                        className="data-value tabular"
                        style={{
                          color: dayData.pnl >= 0 ? "#00e5b0" : "#ff4d6d",
                          fontSize: "13px",
                          lineHeight: 1,
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

          {/* Mobile list */}
          <div className="sm:hidden flex flex-col divide-y divide-[#1a2030]/60">
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
                      className="data-value tabular"
                      style={{
                        color: dayData.pnl >= 0 ? "#00e5b0" : "#ff4d6d",
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
                className="text-center font-mono uppercase py-8 text-[#5a6580]"
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
    <div className="bg-[#080b11] px-5 py-5">
      <div
        className="font-mono uppercase"
        style={{
          fontSize: "9px",
          letterSpacing: "0.32em",
          color: "#5a6580",
        }}
      >
        {label}
      </div>
      <div
        className="data-value tabular mt-2"
        style={{
          color,
          fontSize: "clamp(20px, 2.6vw, 26px)",
          lineHeight: 1,
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
      className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#1a2030] text-[#8892a4] hover:text-[#e8edf5] hover:border-[#2a3050] hover:bg-[#0f1420] active:scale-[0.98] transition-all"
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
