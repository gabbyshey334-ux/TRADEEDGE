/**
 * Static sample challenge cards for locked Prop Firm Tracker preview.
 * Numbers are invented — not a real account.
 */
export function PropFirmPreviewSample() {
  return (
    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
      <SampleCard
        firmName="FTMO"
        accountSize="$100,000"
        phase="Phase 1"
        phaseColor="#0ea5e9"
        phaseBg="rgba(14,165,233,0.1)"
        phaseBorder="rgba(14,165,233,0.2)"
        progressPct={62}
        currentBalance="$106,200"
        targetBalance="$110,000"
        dailyLoss="5%"
        maxDrawdown="10%"
        tradingDays="12 / 4 min"
      />
      <SampleCard
        firmName="Topstep"
        accountSize="$50,000"
        phase="Evaluation"
        phaseColor="#f59e0b"
        phaseBg="rgba(245,158,11,0.1)"
        phaseBorder="rgba(245,158,11,0.2)"
        progressPct={38}
        currentBalance="$51,900"
        targetBalance="$53,000"
        dailyLoss="2%"
        maxDrawdown="4%"
        tradingDays="8 / 5 min"
      />
    </div>
  );
}

function SampleCard({
  firmName,
  accountSize,
  phase,
  phaseColor,
  phaseBg,
  phaseBorder,
  progressPct,
  currentBalance,
  targetBalance,
  dailyLoss,
  maxDrawdown,
  tradingDays,
}: {
  firmName: string;
  accountSize: string;
  phase: string;
  phaseColor: string;
  phaseBg: string;
  phaseBorder: string;
  progressPct: number;
  currentBalance: string;
  targetBalance: string;
  dailyLoss: string;
  maxDrawdown: string;
  tradingDays: string;
}) {
  return (
    <article className="relative flex flex-col gap-5 rounded-xl border border-[#1c2235] bg-[#0c0f17] p-5 sm:p-6 overflow-hidden">
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${phaseColor}, transparent)`,
        }}
      />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-[#e8edf5] leading-none truncate">
            {firmName}
          </h3>
          <p className="mt-3 font-mono text-2xl font-bold text-[#e8edf5] tabular-nums">
            {accountSize}
          </p>
        </div>
        <span
          className="shrink-0 inline-flex items-center rounded font-mono text-[9px] tracking-widest px-2 py-0.5 uppercase border"
          style={{
            color: phaseColor,
            backgroundColor: phaseBg,
            borderColor: phaseBorder,
          }}
        >
          {phase}
        </span>
      </header>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="font-mono uppercase text-[#8892a4]"
            style={{ fontSize: "10px", letterSpacing: "0.24em" }}
          >
            Progress to Target
          </span>
          <span
            className="font-mono font-bold tabular"
            style={{ fontSize: "12px", color: "#00ff88", letterSpacing: "0.04em" }}
          >
            {progressPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1c2235] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              background: "#00ff88",
              boxShadow: "0 0 8px rgba(0,255,136,0.3)",
            }}
          />
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-[#8892a4] tabular" style={{ fontSize: "12px" }}>
            {currentBalance}
            <span className="text-[#4a5568]"> / {targetBalance}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Daily Loss", value: dailyLoss },
          { label: "Max DD", value: maxDrawdown },
          { label: "Trading Days", value: tradingDays },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[#1c2235] bg-[#111520] px-3 py-3"
          >
            <div
              className="font-mono text-[9px] text-[#4a5568] tracking-widest uppercase"
              style={{ fontSize: "9px", letterSpacing: "0.24em" }}
            >
              {item.label}
            </div>
            <div className="mt-1 font-mono text-[13px] text-[#8892a4] tabular-nums truncate">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-[#1c2235] bg-[#111520] py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#4a5568]"
      >
        ★ GET READINESS SCORE
      </div>
    </article>
  );
}
