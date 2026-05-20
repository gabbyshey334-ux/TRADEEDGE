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
        eyebrow="Performance"
        subtitle={`${stats.tradeCount} trades · ${stats.winRate.toFixed(1)}% win rate`}
      />

      <div className="dashboard-page space-y-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            sub="Peak-to-trough"
            color="#f0c040"
            trend="neutral"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SetupPanel rows={bySetup} />
          <EmotionPanel rows={byEmotion} />
          <SessionPanel rows={bySession} />
          <MarketPanel rows={byMarket} />
        </div>
      </div>
    </div>
  );
}

function PanelShell({
  children,
  eyebrow,
  title,
  accent,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  accent: string;
}) {
  return (
    <div className="relative rounded-lg border border-[#1a2030] bg-[#0c1018] overflow-hidden transition-colors duration-150 hover:border-[#2a3050]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2030]/60 bg-[#080b11]/50">
        <div>
          <div
            className="font-mono uppercase"
            style={{
              fontSize: "9px",
              letterSpacing: "0.32em",
              color: accent,
            }}
          >
            {eyebrow}
          </div>
          <h2 className="section-heading mt-2">{title}</h2>
        </div>
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: accent,
            boxShadow: `0 0 12px ${accent}88`,
          }}
        />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function emptyHint(text: string) {
  return (
    <div className="py-10 text-center font-mono uppercase text-[10px] tracking-[0.24em] text-[#5a6580]">
      {text}
    </div>
  );
}

// ─── Setup Performance: horizontal bar chart with rounded right cap ─────────
function SetupPanel({ rows }: { rows: BarRow[] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.pnl)), 1);
  return (
    <PanelShell eyebrow="By Setup" title="Setup Performance" accent="#00e5b0">
      {rows.length === 0
        ? emptyHint("Tag your trades with setups to see what works.")
        : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const positive = row.pnl >= 0;
              const color = positive ? "#00e5b0" : "#ff4d6d";
              const width = (Math.abs(row.pnl) / max) * 100;
              return (
                <li
                  key={row.label}
                  className="grid grid-cols-[100px_minmax(0,1fr)_110px] items-center gap-4"
                >
                  <span
                    className="font-mono text-[12px] text-[#e8edf5] truncate"
                    title={row.label}
                  >
                    {row.label}
                  </span>
                  <div className="relative h-3 bg-[#080b11] overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-300"
                      style={{
                        width: `${width}%`,
                        background: color,
                        borderTopRightRadius: 999,
                        borderBottomRightRadius: 999,
                        boxShadow: `0 0 10px ${color}55`,
                      }}
                    />
                  </div>
                  <span
                    className="data-value tabular text-right"
                    style={{ color, fontSize: "13px" }}
                  >
                    {formatCurrency(row.pnl)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
    </PanelShell>
  );
}

// ─── Emotion vs P&L: a scatter strip (one row, plotted by P&L) ──────────────
function EmotionPanel({ rows }: { rows: BarRow[] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.pnl)), 1);
  return (
    <PanelShell eyebrow="Psychology" title="Emotion vs P&L" accent="#b466ff">
      {rows.length === 0
        ? emptyHint("Log emotions to spot psychological patterns.")
        : (
          <div className="space-y-5">
            <div className="relative h-[140px] overflow-hidden">
              {/* Center axis */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[#1a2030]" />
              <div
                className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-[#2a3050]"
                aria-hidden
              />
              {rows.map((row, i) => {
                const positive = row.pnl >= 0;
                const color = positive ? "#00e5b0" : "#ff4d6d";
                // Map -max..max to 0..100 along X
                const xPct = 50 + (row.pnl / max) * 45;
                // Spread vertically using count as a secondary axis
                const yPct = 50 + ((i % 2 === 0 ? -1 : 1) * 18) + (i * 4 - 8);
                return (
                  <div
                    key={row.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{
                      left: `${Math.max(6, Math.min(94, xPct))}%`,
                      top: `${Math.max(8, Math.min(92, yPct))}%`,
                    }}
                  >
                    <span
                      className="block rounded-full"
                      style={{
                        width: 10 + Math.min(14, row.count),
                        height: 10 + Math.min(14, row.count),
                        background: color,
                        boxShadow: `0 0 14px ${color}88`,
                      }}
                    />
                    <span
                      className="mt-1.5 font-mono uppercase text-[#e8edf5]"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.16em",
                      }}
                    >
                      {row.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between font-mono uppercase text-[9px] tracking-[0.24em] text-[#3a4560]">
              <span>Loss</span>
              <span>Neutral</span>
              <span>Win</span>
            </div>
          </div>
        )}
    </PanelShell>
  );
}

// ─── Session Performance: intensity blocks ─────────────────────────────────
function SessionPanel({ rows }: { rows: BarRow[] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.pnl)), 1);
  return (
    <PanelShell
      eyebrow="Time of Day"
      title="Session Performance"
      accent="#0066ff"
    >
      {rows.length === 0
        ? emptyHint("Tag your trades with sessions for time-of-day insights.")
        : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {rows.map((row) => {
                const positive = row.pnl >= 0;
                const intensity = Math.max(0.1, Math.abs(row.pnl) / max);
                const rgb = positive ? "0,229,176" : "255,77,109";
                return (
                  <div
                    key={row.label}
                    className="rounded-sm p-3.5 border transition-colors duration-150"
                    style={{
                      background: `rgba(${rgb}, ${0.06 + intensity * 0.15})`,
                      borderColor: `rgba(${rgb}, ${0.2 + intensity * 0.3})`,
                    }}
                  >
                    <div
                      className="font-mono uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.24em",
                        color: "#a0afc0",
                      }}
                    >
                      {row.label}
                    </div>
                    <div
                      className="data-value tabular mt-2"
                      style={{
                        color: positive ? "#00e5b0" : "#ff4d6d",
                        fontSize: "20px",
                      }}
                    >
                      {formatCurrency(row.pnl)}
                    </div>
                    <div
                      className="mt-2 font-mono uppercase"
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.24em",
                        color: "#3a4560",
                      }}
                    >
                      {row.count} trades · {row.winRate.toFixed(0)}% win
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </PanelShell>
  );
}

// ─── Market Breakdown: clear visual comparison ─────────────────────────────
function MarketPanel({ rows }: { rows: BarRow[] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.pnl)), 1);
  const colorFor = (label: string) =>
    label === "Forex" ? "#00e5b0" : label === "Futures" ? "#0066ff" : "#f0c040";
  return (
    <PanelShell eyebrow="By Market" title="Market Breakdown" accent="#f0c040">
      {rows.length === 0
        ? emptyHint("Trade Forex and Futures to compare markets.")
        : (
          <div className="space-y-4">
            {rows.map((row) => {
              const color = colorFor(row.label);
              const width = (Math.abs(row.pnl) / max) * 100;
              const pnlColor = row.pnl >= 0 ? "#00e5b0" : "#ff4d6d";
              return (
                <div
                  key={row.label}
                  className="rounded-sm border border-[#1a2030] bg-[#080b11] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono uppercase font-bold"
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.28em",
                        color,
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="data-value tabular"
                      style={{ color: pnlColor, fontSize: "18px" }}
                    >
                      {formatCurrency(row.pnl)}
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-[#06080d] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${width}%`,
                        background: color,
                        boxShadow: `0 0 12px ${color}55`,
                      }}
                    />
                  </div>
                  <div
                    className="mt-2 flex items-center justify-between font-mono uppercase"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.24em",
                      color: "#5a6580",
                    }}
                  >
                    <span>{row.count} trades</span>
                    <span>{row.winRate.toFixed(0)}% win rate</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </PanelShell>
  );
}
