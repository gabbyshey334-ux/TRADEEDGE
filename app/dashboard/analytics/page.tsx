import { requireAuthUser } from "@/lib/auth/server";
import { getTradesForUser } from "@/lib/data/trades";
import {
  aggregatePnl,
  calcStats,
  cn,
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
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }).toUpperCase();

  const bySetup = buildBars(trades, (t) => t.setup);
  const byEmotion = buildBars(trades, (t) => t.emotion);
  const bySession = buildBars(trades, (t) => t.session);
  const byMarket = buildBars(trades, (t) => t.market);

  return (
    <div className="animate-fadeIn">
      <div className="border-b border-[#1c2235] pb-6 mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
            PERFORMANCE
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold text-[#e8edf5]">
            Analytics
          </h1>
          <div className="mt-2 font-mono text-[11px] text-[#4a5568] uppercase">
            {stats.tradeCount} TRADES · {stats.winRate.toFixed(1)}% WIN RATE
          </div>
        </div>
        <div className="font-mono text-[11px] text-[#4a5568]">{currentMonth}</div>
      </div>

      <div className="dashboard-page space-y-7">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsStatCard
            label="Avg Win"
            value={formatCurrency(stats.avgWin)}
            sub={`${stats.wins} winning trades`}
            color="#00ff88"
          />
          <AnalyticsStatCard
            label="Avg Loss"
            value={formatCurrency(stats.avgLoss)}
            sub={`${stats.losses} losing trades`}
            color="#ff3b5c"
          />
          <AnalyticsStatCard
            label="Profit Factor"
            value={
              Number.isFinite(stats.profitFactor)
                ? stats.profitFactor.toFixed(2)
                : "∞"
            }
            sub={`${formatCurrency(stats.grossProfit)} / ${formatCurrency(stats.grossLoss)}`}
            color="#a78bfa"
          />
          <AnalyticsStatCard
            label="Max Drawdown"
            value={formatCurrency(stats.maxDrawdown)}
            sub="Peak-to-trough"
            color="#f59e0b"
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
    <div className="relative rounded-xl border border-[#1c2235] bg-[#0c0f17] overflow-hidden transition-colors duration-200 hover:border-[#2a3350]">
      <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-[#1c2235]">
        <div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
            {eyebrow}
          </div>
          <h2 className="mt-2 font-display text-lg font-bold text-[#e8edf5]">
            {title}
          </h2>
        </div>
        <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
      </div>
      <div className="px-5 py-4">{children}</div>
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
    <PanelShell eyebrow="By Setup" title="Setup Performance" accent="#00ff88">
      {rows.length === 0
        ? emptyHint("Tag your trades with setups to see what works.")
        : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const positive = row.pnl >= 0;
              const color = positive ? "#00ff88" : "#ff3b5c";
              const width = (Math.abs(row.pnl) / max) * 100;
              return (
                <li key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-[13px] text-[#e8edf5] truncate" title={row.label}>
                      {row.label}
                    </span>
                    <span className="font-mono text-[13px] text-[#00ff88] font-medium tabular-nums">
                      {formatCurrency(row.pnl)}
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-[#1c2235] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00ff88] transition-[width] duration-300 rounded-full"
                      style={{
                        width: `${width}%`,
                        boxShadow: "0 0 8px rgba(0,255,136,0.3)",
                      }}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-[#4a5568]">
                    {row.count} trades · {row.winRate.toFixed(0)}% win
                  </div>
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
    <PanelShell eyebrow="Psychology" title="Emotion vs P&L" accent="#a78bfa">
      {rows.length === 0
        ? emptyHint("Log emotions to spot psychological patterns.")
        : (
          <div className="space-y-5">
            <div className="relative h-[140px] overflow-hidden">
              {/* Center axis */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[#1c2235]" />
              <div
                className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-[#1c2235]"
                aria-hidden
              />
              {rows.map((row, i) => {
                const positive = row.pnl >= 0;
                const color = positive ? "#00ff88" : "#ff3b5c";
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
                        fontSize: "9px",
                        letterSpacing: "0.16em",
                      }}
                    >
                      {row.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between font-mono uppercase text-[9px] tracking-widest text-[#4a5568]">
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
      accent="#0ea5e9"
    >
      {rows.length === 0
        ? emptyHint("Tag your trades with sessions for time-of-day insights.")
        : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {rows.map((row) => {
                const positive = row.pnl >= 0;
                return (
                  <div
                    key={row.label}
                    className="rounded-lg p-3 border border-[#1c2235] bg-[#111520] transition-colors duration-150"
                  >
                    <div className="font-mono text-[10px] tracking-widest text-[#4a5568] uppercase">
                      {row.label}
                    </div>
                    <div className={cn(
                      "font-mono text-xl font-bold tabular-nums mt-2",
                      positive ? "text-[#00ff88]" : "text-[#ff3b5c]"
                    )}>
                      {formatCurrency(row.pnl)}
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-[#4a5568]">
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
    label === "Forex" ? "#0ea5e9" : label === "Futures" ? "#a78bfa" : "#f59e0b";
  return (
    <PanelShell eyebrow="By Market" title="Market Breakdown" accent="#f59e0b">
      {rows.length === 0
        ? emptyHint("Trade Forex and Futures to compare markets.")
        : (
          <div className="space-y-4">
            {rows.map((row) => {
              const color = colorFor(row.label);
              const width = (Math.abs(row.pnl) / max) * 100;
              const pnlColor = row.pnl >= 0 ? "#00ff88" : "#ff3b5c";
              return (
                <div
                  key={row.label}
                  className="rounded-xl border border-[#1c2235] bg-[#080a0f] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-widest text-[#8892a4] uppercase">
                      {row.label}
                    </span>
                    <span className={cn(
                      "font-mono text-[13px] font-semibold tabular-nums",
                      row.pnl >= 0 ? "text-[#00ff88]" : "text-[#ff3b5c]"
                    )}>
                      {formatCurrency(row.pnl)}
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-[#1c2235] overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-[#4a5568]">
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

function AnalyticsStatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-[#0c0f17] border border-[#1c2235] rounded-xl p-5 hover:border-[#2a3350] transition-colors duration-200">
      <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
        {label}
      </div>
      <div className="mt-4 font-mono text-3xl font-bold tracking-tight tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="mt-2 pt-2 border-t border-[#1c2235] font-mono text-[11px] text-[#4a5568]">
        {sub}
      </div>
    </div>
  );
}
