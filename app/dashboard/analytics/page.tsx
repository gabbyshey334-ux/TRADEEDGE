import { PageHeader } from "@/components/PageHeader";
import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import { StatCard } from "@/components/StatCard";
import {
  aggregatePnl,
  calcStats,
  formatCurrency,
  groupBy,
} from "@/lib/utils";
import type { Trade } from "@/lib/types";

export const dynamic = "force-dynamic";

interface BarRow {
  label: string;
  pnl: number;
  count: number;
  winRate: number;
}

function buildBars(trades: Trade[], keyFn: (t: Trade) => string | null): BarRow[] {
  const groups = groupBy(trades, (t) => keyFn(t) ?? "Unspecified");
  return Object.entries(groups)
    .map(([label, list]) => ({
      label,
      pnl: aggregatePnl(list),
      count: list.length,
      winRate:
        (list.filter((t) => Number(t.pnl) > 0).length / list.length) * 100,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

function Panel({
  title,
  eyebrow,
  accent,
  rows,
  emptyHint,
}: {
  title: string;
  eyebrow: string;
  accent: string;
  rows: BarRow[];
  emptyHint: string;
}) {
  const max = Math.max(...rows.map((r) => Math.abs(r.pnl)), 1);
  return (
    <div className="relative rounded-xl border border-[#1a2030] bg-[#0c1018] p-6 overflow-hidden transition-colors duration-150 hover:border-[#2a3050]">
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, ${accent}, ${accent}00)`,
        }}
      />
      <div className="mb-5">
        <div
          className="text-[10px] uppercase tracking-[0.32em] font-mono"
          style={{ color: accent }}
        >
          {eyebrow}
        </div>
        <h2 className="mt-2 font-heading text-2xl tracking-wide text-[#e8edf5] leading-none">
          {title}
        </h2>
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#8892a4] font-mono">
          {emptyHint}
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {rows.map((row) => {
            const positive = row.pnl >= 0;
            const pnlColor = positive ? "#00e5b0" : "#ff4d6d";
            const width = (Math.abs(row.pnl) / max) * 100;
            return (
              <li key={row.label}>
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-[#e8edf5]">{row.label}</span>
                  <span
                    className="font-bold"
                    style={{ color: pnlColor }}
                  >
                    {formatCurrency(row.pnl)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-[#5a6580] font-mono uppercase tracking-[0.22em]">
                  <span>{row.count} trades</span>
                  <span>{row.winRate.toFixed(0)}% win</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#080b11] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(to right, ${pnlColor}, ${pnlColor}55)`,
                      boxShadow: `0 0 12px ${pnlColor}44`,
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

export default async function AnalyticsPage() {
  const user = await requireAuthUser();
  const trades = await getTradesForUser(user.id);
  const stats = calcStats(trades);

  const bySetup = buildBars(trades, (t) => t.setup);
  const byEmotion = buildBars(trades, (t) => t.emotion);
  const bySession = buildBars(trades, (t) => t.session);
  const byMarket = buildBars(trades, (t) => t.market);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Analytics"
        subtitle={`${stats.tradeCount} trades · ${stats.winRate.toFixed(1)}% win rate`}
      />

      <div className="dashboard-page space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Avg Win"
            value={formatCurrency(stats.avgWin)}
            sub={`${stats.wins} winning trades`}
            color="#00e5b0"
            trend="up"
          />
          <StatCard
            label="Avg Loss"
            value={formatCurrency(stats.avgLoss)}
            sub={`${stats.losses} losing trades`}
            color="#ff4d6d"
            trend="down"
          />
          <StatCard
            label="Profit Factor"
            value={
              Number.isFinite(stats.profitFactor)
                ? stats.profitFactor.toFixed(2)
                : "∞"
            }
            sub={`${formatCurrency(stats.grossProfit)} / ${formatCurrency(stats.grossLoss)}`}
            color="#b466ff"
            trend={stats.profitFactor >= 1 ? "up" : "down"}
          />
          <StatCard
            label="Max Drawdown"
            value={formatCurrency(stats.maxDrawdown)}
            sub="peak-to-trough"
            color="#f0c040"
            trend="neutral"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel
            title="Setup Performance"
            eyebrow="By Setup"
            accent="#00e5b0"
            rows={bySetup}
            emptyHint="Tag your trades with setups to see what works."
          />
          <Panel
            title="Emotion vs P&L"
            eyebrow="Psychology"
            accent="#b466ff"
            rows={byEmotion}
            emptyHint="Log emotions to spot psychological patterns."
          />
          <Panel
            title="Session Performance"
            eyebrow="Time of Day"
            accent="#0066ff"
            rows={bySession}
            emptyHint="Tag your trades with sessions for time-of-day insights."
          />
          <Panel
            title="Market Breakdown"
            eyebrow="By Market"
            accent="#f0c040"
            rows={byMarket}
            emptyHint="Trade Forex and Futures to compare markets."
          />
        </div>
      </div>
    </div>
  );
}
