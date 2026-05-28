import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { EquityChart } from "@/components/EquityChart";
import { TradeTable } from "@/components/TradeTable";
import { WelcomeGreeting } from "@/components/WelcomeGreeting";
import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import {
  aggregatePnl,
  calcStats,
  cn,
  cumulativeEquity,
  formatCurrency,
  groupBy,
} from "@/lib/utils";
export const dynamic = "force-dynamic";

function formatHeaderDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const user = await requireAuthUser();

  const [tradeList, profile] = await Promise.all([
    getTradesForUser(user.id),
    getUserProfile(user.id),
  ]);

  const displayName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Trader";

  const stats = calcStats(tradeList);
  const recent = tradeList.slice(0, 6);

  const bySetup = groupBy(tradeList, (t) => t.setup ?? "Unspecified");
  const setupPerf = Object.entries(bySetup)
    .map(([setup, list]) => ({
      setup,
      count: list.length,
      pnl: aggregatePnl(list),
      winRate:
        (list.filter((t) => Number(t.pnl) > 0).length / list.length) * 100,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const equity = cumulativeEquity(tradeList).map((p) => p.equity);

  const pnlTrend =
    stats.totalPnl > 0 ? "up" : stats.totalPnl < 0 ? "down" : "neutral";

  return (
    <div className="animate-fadeIn">
      <div className="border-b border-[#1c2235] pb-4 mb-6 flex flex-wrap items-end justify-between gap-3 px-4 md:px-0">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
            WORKSPACE
          </div>
          <h1 className="font-display text-3xl font-bold text-[#e8edf5] mt-1">
            Dashboard
          </h1>
        </div>
        <div className="font-mono text-[11px] text-[#4a5568]">
          {formatHeaderDate()}
        </div>
      </div>

      <div className="dashboard-page space-y-7">
        <WelcomeGreeting name={displayName} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total P&L"
            value={formatCurrency(stats.totalPnl)}
            sub={`${stats.tradeCount} trades logged`}
            color={stats.totalPnl >= 0 ? "#00ff88" : "#ff3b5c"}
            trend={pnlTrend}
            spark={equity.length >= 2 ? equity : undefined}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            sub={`${stats.wins} wins · ${stats.losses} losses`}
            color="#0ea5e9"
            trend={stats.winRate >= 50 ? "up" : "down"}
          />
          <StatCard
            label="Avg R:R"
            value={stats.avgRR.toFixed(2)}
            sub="Risk to reward"
            color="#a78bfa"
            trend={stats.avgRR >= 1 ? "up" : "down"}
          />
          <StatCard
            label="Profit Factor"
            value={
              Number.isFinite(stats.profitFactor)
                ? stats.profitFactor.toFixed(2)
                : "∞"
            }
            sub={`${formatCurrency(stats.grossProfit)} / ${formatCurrency(stats.grossLoss)}`}
            color="#f59e0b"
            trend={stats.profitFactor >= 1 ? "up" : "down"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-5">
          <div className="space-y-5 min-w-0">
            <EquityChart trades={tradeList} />

            <section className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
                    Activity
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#e8edf5] mt-2">
                    Recent Trades
                  </h2>
                </div>
                <Link
                  href="/dashboard/journal"
                  className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#8892a4] hover:text-[#00ff88] active:scale-[0.98] transition-colors duration-150"
                >
                  View all →
                </Link>
              </div>
              <TradeTable trades={recent} compact />
            </section>
          </div>

          <div className="space-y-5 min-w-0">
            <section className="space-y-4">
              <SetupPerformancePanel setupPerf={setupPerf} />
            </section>

            <section className="space-y-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
                  Shortcut
                </div>
                <h2 className="font-display text-2xl font-bold text-[#e8edf5] mt-2">
                  Quick Add
                </h2>
              </div>
              <QuickAddCard />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupPerformancePanel({
  setupPerf,
}: {
  setupPerf: Array<{
    setup: string;
    count: number;
    pnl: number;
    winRate: number;
  }>;
}) {
  return (
    <div className="rounded-xl border border-[#1c2235] bg-[#0c0f17] p-5 overflow-hidden">
      <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase mb-4">
        SETUP PERFORMANCE
      </div>
      {setupPerf.length === 0 ? (
        <div className="py-10 text-center font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
          Log trades to see performance by setup.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {setupPerf.slice(0, 6).map((row) => {
            const pnlPositive = row.pnl >= 0;
            const max = Math.max(
              ...setupPerf.map((r) => Math.abs(r.pnl)),
              1
            );
            const width = (Math.abs(row.pnl) / max) * 100;
            return (
              <li key={row.setup}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-body text-[13px] text-[#e8edf5] truncate">
                    {row.setup}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[13px] shrink-0",
                      pnlPositive ? "text-[#00ff88]" : "text-[#ff3b5c]"
                    )}
                  >
                    {formatCurrency(row.pnl)}
                  </span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-[#1c2235] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${width}%`,
                      backgroundColor: pnlPositive ? "#00ff88" : "#ff3b5c",
                      boxShadow: pnlPositive
                        ? "0 0 8px rgba(0, 255, 136, 0.35)"
                        : "0 0 8px rgba(255, 59, 92, 0.25)",
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-[#4a5568]">
                  <span>{row.count} trades</span>
                  <span>{row.winRate.toFixed(0)}% win</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function QuickAddCard() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17] p-6"
      style={{
        backgroundImage:
          "radial-gradient(600px 200px at 100% 0%, rgba(0,255,136,0.06), transparent 70%)",
      }}
    >
      <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
        Log a new trade
      </div>
      <p className="mt-4 font-body text-[13px] text-[#8892a4] leading-relaxed">
        Capture your next trade in seconds. Track entry, exit, setup, emotion,
        and outcome in one place.
      </p>

      <ul className="mt-5 space-y-2.5">
        {[
          "Long / Short",
          "Setup & Session",
          "P&L + R:R",
          "Notes & Screenshot",
        ].map((label) => (
          <li
            key={label}
            className="flex items-center gap-2.5 font-mono text-[12px] text-[#8892a4]"
          >
            <span className="h-1 w-1 rounded-full bg-[#00ff88]" />
            {label}
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard/journal"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00ff88] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#080a0f] transition-all duration-200 hover:bg-[#00ff88]/90 glow-green active:scale-[0.98]"
      >
        Open Journal
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
