import type { Trade } from "./types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number, fractionDigits = 2): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export interface TradeStats {
  totalPnl: number;
  winRate: number;
  avgRR: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  tradeCount: number;
  wins: number;
  losses: number;
  grossProfit: number;
  grossLoss: number;
}

export function calcStats(trades: Trade[]): TradeStats {
  if (!trades.length) {
    return {
      totalPnl: 0,
      winRate: 0,
      avgRR: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      maxDrawdown: 0,
      tradeCount: 0,
      wins: 0,
      losses: 0,
      grossProfit: 0,
      grossLoss: 0,
    };
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl), 0);
  const grossProfit = wins.reduce((sum, t) => sum + Number(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.pnl), 0));

  const rrValues = trades
    .map((t) => Number(t.rr))
    .filter((v) => Number.isFinite(v) && v !== 0);
  const avgRR = rrValues.length
    ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length
    : 0;

  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const winRate = (wins.length / trades.length) * 100;

  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let peak = 0;
  let runningPnl = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    runningPnl += Number(t.pnl);
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return {
    totalPnl,
    winRate,
    avgRR,
    profitFactor,
    avgWin,
    avgLoss,
    maxDrawdown,
    tradeCount: trades.length,
    wins: wins.length,
    losses: losses.length,
    grossProfit,
    grossLoss,
  };
}

export function cumulativeEquity(trades: Trade[]): Array<{ date: string; equity: number }> {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let running = 0;
  return sorted.map((t) => {
    running += Number(t.pnl);
    return { date: t.date, equity: running };
  });
}

export function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K | null | undefined
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const k = keyFn(item);
    if (!k) continue;
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}

export function aggregatePnl(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + Number(t.pnl), 0);
}

export function buildTradeSummary(trades: Trade[]): string {
  if (!trades.length) return "No trades recorded yet.";
  const stats = calcStats(trades);
  const recent = trades.slice(0, 15);
  const lines = [
    `Total trades: ${stats.tradeCount}`,
    `Total P&L: ${formatCurrency(stats.totalPnl)}`,
    `Win rate: ${stats.winRate.toFixed(1)}%`,
    `Avg R:R: ${stats.avgRR.toFixed(2)}`,
    `Profit factor: ${Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"}`,
    `Avg win: ${formatCurrency(stats.avgWin)}`,
    `Avg loss: ${formatCurrency(stats.avgLoss)}`,
    `Max drawdown: ${formatCurrency(stats.maxDrawdown)}`,
    "",
    "Recent trades:",
    ...recent.map(
      (t) =>
        `- ${t.date} | ${t.market} ${t.symbol} ${t.direction} | setup=${t.setup ?? "-"} session=${t.session ?? "-"} emotion=${t.emotion ?? "-"} | P&L=${formatCurrency(Number(t.pnl))} R:R=${t.rr ?? "-"}`
    ),
  ];
  return lines.join("\n");
}
