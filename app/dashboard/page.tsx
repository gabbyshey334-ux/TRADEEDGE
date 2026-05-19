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
  const recent = tradeList.slice(0, 8);

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

  const pnlTrend =
    stats.totalPnl > 0 ? "up" : stats.totalPnl < 0 ? "down" : "neutral";

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Dashboard" subtitle="Overview · live data" />

      <div className="px-8 py-8 space-y-8">
        <WelcomeGreeting name={displayName} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total P&L"
            value={formatCurrency(stats.totalPnl)}
            sub={`${stats.tradeCount} trades logged`}
            color={stats.totalPnl >= 0 ? "#00e5b0" : "#ff4d6d"}
            trend={pnlTrend}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            sub={`${stats.wins}W · ${stats.losses}L`}
            color="#0066ff"
            trend={stats.winRate >= 50 ? "up" : "down"}
          />
          <StatCard
            label="Avg R:R"
            value={stats.avgRR.toFixed(2)}
            sub="risk to reward"
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

        <EquityChart trades={tradeList} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-[#5a6580] font-mono">
                  Recent
                </div>
                <h2 className="mt-1 font-heading text-2xl tracking-wide text-[#e8edf5] leading-none">
                  Recent Trades
                </h2>
              </div>
              <Link
                href="/dashboard/journal"
                className="text-[10px] uppercase tracking-[0.22em] text-[#8892a4] hover:text-[#00e5b0] font-mono transition-colors"
              >
                View all →
              </Link>
            </div>
            <TradeTable trades={recent} compact />
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#5a6580] font-mono">
                Breakdown
              </div>
              <h2 className="mt-1 font-heading text-2xl tracking-wide text-[#e8edf5] leading-none">
                Setup Performance
              </h2>
            </div>
            <SetupPerformancePanel setupPerf={setupPerf} />
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
    <div className="relative rounded-xl border border-[#1a2030] bg-[#0c1018] p-6 overflow-hidden">
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: "linear-gradient(to right, #b466ff, transparent)",
        }}
      />
      {setupPerf.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#8892a4] font-mono">
          Log trades to see performance by setup.
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {setupPerf.slice(0, 6).map((row) => {
            const pnlColor = row.pnl >= 0 ? "#00e5b0" : "#ff4d6d";
            const max = Math.max(
              ...setupPerf.map((r) => Math.abs(r.pnl)),
              1
            );
            const width = (Math.abs(row.pnl) / max) * 100;
            return (
              <li key={row.setup}>
                <div className="flex items-center justify-between text-[13px] font-mono">
                  <span className="text-[#e8edf5]">{row.setup}</span>
                  <span className="font-bold" style={{ color: pnlColor }}>
                    {formatCurrency(row.pnl)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-[#5a6580] font-mono uppercase tracking-[0.22em]">
                  <span>{row.count} trades</span>
                  <span>{row.winRate.toFixed(0)}% win</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[#080b11] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(to right, ${pnlColor}, ${pnlColor}66)`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
