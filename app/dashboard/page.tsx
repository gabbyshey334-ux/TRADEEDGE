import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EquityChart } from "@/components/EquityChart";
import { TradeTable } from "@/components/TradeTable";
import { WelcomeGreeting } from "@/components/WelcomeGreeting";
import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import {
  aggregatePnl,
  calcStats,
  cumulativeEquity,
  formatCurrency,
  groupBy,
} from "@/lib/utils";
export const dynamic = "force-dynamic";

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

  // Build small sparklines for stat cards
  const equity = cumulativeEquity(tradeList).map((p) => p.equity);

  const pnlTrend =
    stats.totalPnl > 0 ? "up" : stats.totalPnl < 0 ? "down" : "neutral";

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Dashboard"
        subtitle="Overview · live data"
        eyebrow="Workspace"
      />

      <div className="dashboard-page space-y-7">
        <WelcomeGreeting name={displayName} />

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total P&L"
            value={formatCurrency(stats.totalPnl)}
            sub={`${stats.tradeCount} trades logged`}
            color={stats.totalPnl >= 0 ? "#00e5b0" : "#ff4d6d"}
            trend={pnlTrend}
            spark={equity.length >= 2 ? equity : undefined}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            sub={`${stats.wins} wins · ${stats.losses} losses`}
            color="#0066ff"
            trend={stats.winRate >= 50 ? "up" : "down"}
          />
          <StatCard
            label="Avg R:R"
            value={stats.avgRR.toFixed(2)}
            sub="Risk to reward"
            color="#b466ff"
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
            color="#f0c040"
            trend={stats.profitFactor >= 1 ? "up" : "down"}
          />
        </div>

        {/* Two column layout — 65/35 */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-5">
          <div className="space-y-5 min-w-0">
            <EquityChart trades={tradeList} />

            <section className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="section-label">Activity</div>
                  <h2 className="section-heading mt-3">Recent Trades</h2>
                </div>
                <Link
                  href="/dashboard/journal"
                  className="font-mono uppercase text-[#8892a4] hover:text-[#00e5b0] active:scale-[0.98] transition-colors"
                  style={{ fontSize: "10px", letterSpacing: "0.24em" }}
                >
                  View all →
                </Link>
              </div>
              <TradeTable trades={recent} compact />
            </section>
          </div>

          <div className="space-y-5 min-w-0">
            <section className="space-y-4">
              <div>
                <div className="section-label">Breakdown</div>
                <h2 className="section-heading mt-3">Setup Performance</h2>
              </div>
              <SetupPerformancePanel setupPerf={setupPerf} />
            </section>

            <section className="space-y-4">
              <div>
                <div className="section-label">Shortcut</div>
                <h2 className="section-heading mt-3">Quick Add</h2>
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
    <div className="rounded-lg border border-[#1a2030] bg-[#0c1018] p-5 overflow-hidden">
      {setupPerf.length === 0 ? (
        <div className="py-10 text-center font-mono uppercase text-[10px] tracking-[0.24em] text-[#5a6580]">
          Log trades to see performance by setup.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {setupPerf.slice(0, 6).map((row) => {
            const pnlColor = row.pnl >= 0 ? "#00e5b0" : "#ff4d6d";
            const max = Math.max(
              ...setupPerf.map((r) => Math.abs(r.pnl)),
              1
            );
            const width = (Math.abs(row.pnl) / max) * 100;
            return (
              <li key={row.setup}>
                <div className="flex items-center justify-between font-mono text-[13px]">
                  <span className="text-[#e8edf5]">{row.setup}</span>
                  <span
                    className="data-value tabular"
                    style={{ color: pnlColor, fontSize: "14px" }}
                  >
                    {formatCurrency(row.pnl)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-[#080b11] overflow-hidden">
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{
                      width: `${width}%`,
                      background: pnlColor,
                      borderTopRightRadius: 2,
                      borderBottomRightRadius: 2,
                    }}
                  />
                </div>
                <div
                  className="mt-1.5 flex items-center justify-between font-mono uppercase text-[9px] tracking-[0.24em] text-[#5a6580]"
                >
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
      className="relative overflow-hidden rounded-lg border border-[#1a2030] bg-[#0c1018] p-6"
      style={{
        backgroundImage:
          "radial-gradient(600px 200px at 100% 0%, rgba(0,229,176,0.06), transparent 70%)",
      }}
    >
      <div className="section-label">Log a new trade</div>
      <p className="mt-4 text-[13px] text-[#a0afc0] font-sans leading-relaxed">
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
            className="flex items-center gap-2.5 text-[12px] font-mono text-[#8892a4]"
          >
            <span
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: "#00e5b0" }}
            />
            {label}
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard/journal"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#00e5b0] px-4 py-2.5 font-mono font-bold uppercase text-[#06080d] transition-all duration-150 hover:bg-[#00f5be] active:scale-[0.98]"
        style={{
          fontSize: "10px",
          letterSpacing: "0.24em",
          boxShadow: "0 0 20px rgba(0,229,176,0.35)",
        }}
      >
        Open Journal
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
