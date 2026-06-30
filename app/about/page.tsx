import Link from "next/link";

export const metadata = {
  title: "About — TradeEdge AI",
  description:
    "Built by a 20-year Army veteran and trader to help serious traders see the patterns costing them money — before it costs them their account.",
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#080a0f]">
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-[#00ff88]/[0.04] blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-[#0ea5e9]/[0.04] blur-[120px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a5568]">
          ABOUT
        </p>

        <h1 className="mb-2 font-display text-4xl font-bold text-[#e8edf5]">
          Built by a Trader, For Traders
        </h1>

        <p className="mb-10 font-mono text-[12px] text-[#00ff88]">
          Anthony Brown · Founder, TradeEdge AI
        </p>

        <div className="mb-10 border-t border-[#1c2235]" />

        <div className="space-y-6 font-body text-[16px] leading-relaxed text-[#8892a4]">
          <p>
            I spent 20 years in the Army as an Airborne Ranger and 82nd Airborne
            paratrooper before I ever sat down seriously to trade. Military life
            teaches you something that took me a long time to fully understand —
            failure is rarely about ability. It&apos;s almost always about
            process, preparation, and the small decisions you make under pressure
            that nobody else ever sees.
          </p>

          <p className="font-body text-[18px] italic text-[#e8edf5]">
            Trading taught me that exact same lesson the hard way.
          </p>

          <p>
            I&apos;m tired of hearing the same statistic thrown around
            everywhere — that only a small percentage of traders are ever
            profitable — like it&apos;s some unchangeable law of nature. I
            don&apos;t believe that. I&apos;ve seen too many disciplined people
            fail not because they lacked skill, but because they had no real
            feedback loop on their own behavior. They could see their P&amp;L,
            but they couldn&apos;t see why.
          </p>

          <p>
            I built TradeEdge AI to change that. This isn&apos;t a money grab,
            and it&apos;s not another app promising easy profits. It&apos;s a
            real tool, built by a trader, for traders, designed to do one thing
            — help you see the patterns that are quietly costing you money
            before they cost you your account.
          </p>

          <p className="font-display text-xl font-bold text-[#00ff88]">
            My mission is simple: build better traders. Period.
          </p>
        </div>

        <p className="mt-10 border-t border-[#1c2235] pt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-[#4a5568]">
          Rangers Lead The Way.
        </p>

        <div className="mt-12 flex justify-center">
          <Link
            href="/signup"
            className="rounded-lg bg-[#00ff88] px-8 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-[#080a0f] transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,255,136,0.25)]"
          >
            START 14-DAY TRIAL
          </Link>
        </div>
      </div>
    </main>
  );
}
