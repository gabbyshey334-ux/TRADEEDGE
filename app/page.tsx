import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Check, X } from "lucide-react";
import { FaqAccordion } from "@/components/LandingFaqAccordion";
import { LandingViewTracker } from "@/components/LandingViewTracker";
import { LiveTickerBar } from "@/components/LiveTickerBar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StatCard } from "@/components/StatCard";
import { TrustLogos } from "@/components/TrustLogos";

const pricingRows = [
  ["Free trial (14 days)", "check", "check", "check"],
  ["Trades per month", "50 trades", "Unlimited", "Unlimited"],
  ["Basic analytics", "check", "check", "check"],
  ["Risk calculator", "check", "check", "check"],
  ["Trade calendar", "check", "check", "check"],
  ["Psychology tracker", "x", "check", "check"],
  ["AI Coaching reports per month", "x", "10 per month", "Unlimited"],
  ["Congress trades feed", "x", "check", "check"],
  ["Prop firm tracker", "x", "check", "check"],
  ["AI Readiness Score", "x", "x", "check-new"],
  ["Rule Break Prediction", "x", "x", "check-new"],
  ["Daily Coaching Reports", "x", "x", "check-new"],
  ["Multi-account support", "x", "x", "Up to 5 accounts"],
  ["API access", "x", "x", "check"],
  ["Support level", "Email", "Priority", "Dedicated"],
] as const;

type PlanId = "starter" | "pro" | "elite";

const plans: Array<{
  id: PlanId;
  name: string;
  price: string;
  badge?: string;
  nameColor: string;
  borderColor: string;
  bg: string;
  glow?: string;
  cta: "ghost" | "green" | "gold";
  orderClass: string;
  scaleClass?: string;
}> = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    nameColor: "#e8edf5",
    borderColor: "#1a2030",
    bg: "#0c1018",
    cta: "ghost",
    orderClass: "lg:order-1",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    badge: "Most Popular",
    nameColor: "#00e5b0",
    borderColor: "#00e5b0",
    bg: "linear-gradient(180deg, rgba(0,229,176,0.06) 0%, #0c1018 55%)",
    glow: "0 0 40px rgba(0,229,176,0.18), 0 0 0 1px rgba(0,229,176,0.25)",
    cta: "green",
    orderClass: "lg:order-2",
    scaleClass: "lg:scale-[1.04] lg:-my-2",
  },
  {
    id: "elite",
    name: "Elite",
    price: "$99",
    badge: "Most Powerful",
    nameColor: "#f0c040",
    borderColor: "#f0c040",
    bg: "linear-gradient(180deg, rgba(240,192,64,0.08) 0%, #0c1018 55%)",
    glow: "0 0 48px rgba(240,192,64,0.12), 0 0 0 1px rgba(240,192,64,0.2)",
    cta: "gold",
    orderClass: "lg:order-3",
  },
];

const congressRows = [
  ["May 15", "Nancy Pelosi", "D", "NVDA", "Purchase", "$500K-$1M"],
  ["May 12", "Dan Crenshaw", "R", "MSFT", "Purchase", "$15K-$50K"],
  ["May 10", "Josh Gottheimer", "D", "GOOGL", "Sale", "$100K-$250K"],
  ["May 8", "Tommy Tuberville", "R", "AMD", "Purchase", "$50K-$100K"],
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logos/TRADEEDGE.PNG"
        alt="TradeEdge AI"
        width={40}
        height={40}
        className="rounded-xl shadow-[0_0_24px_rgba(0,255,136,0.25)]"
      />
      <span className="font-display font-bold text-2xl tracking-tight text-[#e8edf5]">
        TRADE<span className="text-[#00ff88]">EDGE</span>
      </span>
    </div>
  );
}

function CheckMark({ withNew = false }: { withNew?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <Check size={16} color="#00e5b0" strokeWidth={3} aria-hidden />
      {withNew ? (
        <span className="rounded-full border border-[#00e5b0]/35 bg-[#00e5b0]/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-[#00e5b0]">
          NEW
        </span>
      ) : null}
    </span>
  );
}

function CrossMark() {
  return <X size={16} color="#ff4d6d" strokeWidth={2.5} aria-hidden className="shrink-0" />;
}

function CongressTypeBadge({ type }: { type: string }) {
  const isPurchase = type === "Purchase";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
        isPurchase
          ? "border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]"
          : "border-[#ff3b5c]/20 bg-[#ff3b5c]/10 text-[#ff3b5c]"
      }`}
    >
      {type}
    </span>
  );
}

function PricingValue({
  value,
  plan,
}: {
  value: (typeof pricingRows)[number][number];
  plan: PlanId;
}) {
  if (value === "check") return <CheckMark />;
  if (value === "check-new") return <CheckMark withNew />;
  if (value === "x") return <CrossMark />;

  const eliteGold = plan === "elite" && value === "Dedicated";
  const green =
    plan !== "starter" &&
    (value === "Unlimited" ||
      value === "10 per month" ||
      value === "Priority" ||
      value === "Up to 5 accounts");

  return (
    <span
      className={`text-right font-mono text-[11px] sm:text-xs ${green || eliteGold ? "font-bold" : ""}`}
      style={{ color: eliteGold ? "#f0c040" : green ? "#00e5b0" : "#5a6580" }}
    >
      {value}
    </span>
  );
}

function PricingCard({
  plan,
}: {
  plan: (typeof plans)[number];
}) {
  const columnIndex = plan.id === "starter" ? 1 : plan.id === "pro" ? 2 : 3;
  const badgeBg = plan.id === "pro" ? "#00e5b0" : "#f0c040";

  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-5 sm:p-6 ${plan.badge ? "pt-8" : ""} ${plan.orderClass} ${plan.scaleClass ?? ""}`}
      style={{
        borderColor: plan.id === "pro" ? "rgba(0,255,136,0.3)" : plan.borderColor,
        background: plan.bg,
        boxShadow: plan.id === "pro" ? "0 0 40px rgba(0,255,136,0.08)" : plan.glow,
      }}
    >
      {plan.badge ? (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#06080d] sm:text-[10px]"
          style={{ backgroundColor: badgeBg }}
        >
          {plan.badge}
        </span>
      ) : null}

      <div className="text-center">
        <div className="font-display font-bold text-3xl sm:text-4xl" style={{ color: plan.nameColor }}>
          {plan.name}
        </div>
        <div className="mt-1 font-mono text-3xl font-bold text-[#e8edf5] sm:text-4xl">
          {plan.price}
          <span className="text-sm font-normal text-[#5a6580]">/mo</span>
        </div>
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-[#1a2030]/70 pt-5">
        {pricingRows.map(([feature, starter, pro, elite]) => {
          const value = columnIndex === 1 ? starter : columnIndex === 2 ? pro : elite;

          return (
            <li key={feature} className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 text-left font-body text-[13px] leading-snug text-[#8892a4]">
                {feature}
              </span>
              <span className="shrink-0">
                <PricingValue value={value} plan={plan.id} />
              </span>
            </li>
          );
        })}
      </ul>

      <Link
        href="/signup"
        className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-2.5 transition-all duration-200 ${
          plan.cta === "green"
            ? "bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[11px] tracking-[0.1em] uppercase hover:shadow-[0_0_16px_rgba(0,255,136,0.25)]"
            : plan.cta === "gold"
              ? "border border-[#1c2235] bg-transparent font-mono text-[11px] tracking-[0.1em] uppercase text-[#8892a4] hover:border-[#2a3350] hover:text-[#e8edf5]"
              : "border border-[#1c2235] bg-transparent font-mono text-[11px] tracking-[0.1em] uppercase text-[#8892a4] hover:border-[#2a3350] hover:text-[#e8edf5]"
        }`}
      >
        Start trial
      </Link>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#00e5b0]">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-heading text-[36px] leading-[0.95] tracking-[0.05em] text-[#e8edf5] sm:text-[44px] md:text-[70px]">
        {title}
      </h2>
      {body ? <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-7 text-[#a0afc0]">{body}</p> : null}
    </div>
  );
}

/** Illustrative trade card — mirrors TradeTable mobile row chrome. Non-interactive. */
function HeroTradeExample() {
  return (
    <div className="pointer-events-none mx-auto mt-14 w-full max-w-xl select-none">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#4a5568]">
          Illustrative example
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-mono text-[17px] font-semibold text-[#e8edf5]">
                EUR/USD
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded border border-[#0ea5e9]/20 bg-[#0ea5e9]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#0ea5e9]">
                  Forex
                </span>
                <span className="inline-flex items-center rounded border border-[#00ff88]/20 bg-[#00ff88]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#00ff88]">
                  Long
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right font-mono text-[18px] font-semibold tabular-nums text-[#00ff88]">
              +$86.40
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                Date
              </span>
              <span className="mt-0.5 block font-mono text-[12px] text-[#4a5568]">
                Jul 24, 2026
              </span>
            </span>
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                Entry
              </span>
              <span className="mt-0.5 block font-mono text-[12px] text-[#e8edf5]">
                1.08420
              </span>
            </span>
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                R:R
              </span>
              <span className="mt-0.5 block font-mono text-[12px] text-[#a78bfa]">
                1.40
              </span>
            </span>
          </div>
        </div>
        <div className="border-t border-[#1c2235] bg-[#080a0f] px-4 py-3">
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
            Coach&apos;s insight
          </div>
          <p className="font-body text-[13px] leading-relaxed text-[#8892a4]">
            You&apos;ve cut winners early 4 of your last 5 trades on this pair.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Finding 01 visual — TradeTable card chrome + StatCard strip. Non-interactive. */
function FindingJournalVisual() {
  return (
    <div className="pointer-events-none select-none space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-mono text-[17px] font-semibold text-[#e8edf5]">
                NQ1!
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded border border-[#a78bfa]/20 bg-[#a78bfa]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#a78bfa]">
                  Futures
                </span>
                <span className="inline-flex items-center rounded border border-[#00ff88]/20 bg-[#00ff88]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#00ff88]">
                  Long
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right font-mono text-[18px] font-semibold tabular-nums text-[#00ff88]">
              +$420.00
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                Date
              </span>
              <span className="mt-0.5 block font-mono text-[12px] text-[#4a5568]">
                Jul 22, 2026
              </span>
            </span>
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                Setup
              </span>
              <span className="mt-0.5 block font-mono text-[12px] text-[#8892a4]">
                VWAP Reclaim
              </span>
            </span>
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                Session
              </span>
              <span className="mt-0.5 block font-mono text-[12px] text-[#8892a4]">
                NY Open
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Win Rate"
          value="61%"
          sub="By setup · last 30 days"
          color="#00ff88"
          trend="up"
          spark={[0.4, 0.45, 0.5, 0.48, 0.55, 0.62, 0.58, 0.61]}
        />
        <StatCard
          label="Avg R:R"
          value="1.8"
          sub="By session · London"
          color="#0ea5e9"
          trend="up"
          spark={[0.35, 0.4, 0.42, 0.5, 0.55, 0.52, 0.6, 0.65]}
        />
      </div>
    </div>
  );
}

/**
 * Finding 02 visual — static crop of DailyCoachingReport chrome.
 * Labels match live component strings exactly.
 */
function FindingCoachVisual() {
  return (
    <div className="pointer-events-none select-none overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
      <div className="flex items-center justify-between border-b border-[#1c2235] bg-[#080a0f] px-5 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
          DAILY COACHING REPORT
        </span>
        <span className="font-mono text-[11px] text-[#4a5568]">Thu, Jul 24, 2026</span>
      </div>
      <div className="border-b border-[#1c2235] bg-[#f59e0b]/[0.06] px-5 py-3 font-mono text-[11px] tracking-[0.1em] text-[#f59e0b]">
        SESSION RATING: C — Cut winners early on EUR/USD
      </div>
      <div className="border-b border-[#1c2235] px-5 py-4">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
          COACH&apos;S INSIGHT
        </div>
        <p className="font-body text-[14px] leading-relaxed text-[#e8edf5]">
          Four of your last five EUR/USD winners were closed before the planned
          target. The pattern isn&apos;t random — it clusters in the first hour
          after London open.
        </p>
      </div>
      <div className="bg-[#00ff88]/[0.02] px-5 py-4">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#00ff88]">
          TOMORROW&apos;S FOCUS
        </div>
        <p className="font-body text-[14px] font-medium text-[#e8edf5]">
          Hold to the written target on the next A+ London setup — or don&apos;t take the trade.
        </p>
      </div>
    </div>
  );
}

/** Finding 03 visual — one PropFirm card chrome, no SAMPLE badge. Non-interactive. */
function FindingPropFirmVisual() {
  return (
    <div className="pointer-events-none select-none">
      <article className="relative flex flex-col gap-5 overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17] p-5 sm:p-6">
        <div
          aria-hidden
          className="absolute left-0 right-0 top-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg, #0ea5e9, transparent)",
          }}
        />
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold leading-none text-[#e8edf5]">
              FTMO
            </h3>
            <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-[#e8edf5]">
              $100,000
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
            style={{
              color: "#0ea5e9",
              backgroundColor: "rgba(14,165,233,0.1)",
              borderColor: "rgba(14,165,233,0.2)",
            }}
          >
            Phase 1
          </span>
        </header>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <span
              className="font-mono uppercase text-[#5a6580]"
              style={{ fontSize: "10px", letterSpacing: "0.24em" }}
            >
              Progress to Target
            </span>
            <span
              className="font-mono font-bold tabular"
              style={{ fontSize: "12px", color: "#00ff88", letterSpacing: "0.04em" }}
            >
              62.0%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1c2235]">
            <div
              className="h-full rounded-full"
              style={{
                width: "62%",
                background: "#00ff88",
                boxShadow: "0 0 8px rgba(0,255,136,0.3)",
              }}
            />
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono tabular text-[#8892a4]" style={{ fontSize: "12px" }}>
              $106,200
              <span className="text-[#3a4560]"> / $110,000</span>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Daily Loss", value: "5%" },
            { label: "Max DD", value: "10%" },
            { label: "Trading Days", value: "12 / 4 min" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#1c2235] bg-[#111520] px-3 py-3"
            >
              <div
                className="font-mono text-[9px] uppercase tracking-widest text-[#4a5568]"
                style={{ fontSize: "9px", letterSpacing: "0.24em" }}
              >
                {item.label}
              </div>
              <div className="mt-1 truncate font-mono text-[13px] tabular-nums text-[#8892a4]">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function FindingRow({
  label,
  headline,
  body,
  visual,
  reverse = false,
}: {
  label: string;
  headline: string;
  body: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <div className={reverse ? "lg:order-2" : undefined}>
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#00e5b0]">
          {label}
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-[#e8edf5] sm:text-3xl">
          {headline}
        </h3>
        <p className="mt-4 max-w-xl font-body text-[15px] leading-7 text-[#a0afc0] sm:text-[16px]">
          {body}
        </p>
      </div>
      <div className={reverse ? "lg:order-1" : undefined}>{visual}</div>
    </div>
  );
}

function LandingStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes heroBreath {
            from { background: radial-gradient(760px 520px at 50% 0%, rgba(0,229,176,0.04), transparent 70%), #06080d; }
            to { background: radial-gradient(920px 620px at 50% 4%, rgba(0,229,176,0.12), transparent 74%), #06080d; }
          }
          @keyframes dotPulse {
            from { opacity: .65; transform: scale(.78); box-shadow: 0 0 0 rgba(0,229,176,0); }
            to { opacity: 1; transform: scale(1.25); box-shadow: 0 0 22px rgba(0,229,176,.75); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes tickerScroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @keyframes arrowPulse {
            0%, 100% { opacity: .35; transform: translateX(0); }
            50% { opacity: 1; transform: translateX(8px); }
          }
          @keyframes finalPulse {
            from { background-position: 0% 50%; }
            to { background-position: 100% 50%; }
          }
          .hero-breath { animation: heroBreath 4s ease-in-out infinite alternate; }
          .hero-line { opacity: 0; animation: fadeUp .8s cubic-bezier(.16,1,.3,1) forwards; }
          .hero-line-1 { animation-delay: .12s; }
          .hero-line-2 { animation-delay: .28s; }
          .hero-line-3 { animation-delay: .44s; }
          .hero-pill { opacity: 0; animation: fadeUp .7s cubic-bezier(.16,1,.3,1) .02s forwards; }
          .hero-dot { animation: dotPulse 1.4s ease-in-out infinite alternate; }
          .ticker-track { animation: tickerScroll 32s linear infinite; }
          .scroll-reveal { opacity: 0; transform: translateY(20px); transition: opacity .7s ease, transform .7s ease; }
          .scroll-reveal.is-visible { opacity: 1; transform: translateY(0); }
          .hero-dashboard-wrap { position: relative; transform: perspective(1400px) rotateX(3deg); transform-origin: 50% 0; }
          .hero-dashboard-glow { position: absolute; left: 12%; right: 12%; bottom: -42px; height: 90px; background: radial-gradient(ellipse at center, rgba(0,229,176,.28), transparent 70%); filter: blur(22px); z-index: -1; }
          .dashboard-row { opacity: 0; animation: fadeUp .65s ease forwards; }
          .feature-card { transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
          .feature-card:hover { transform: translateY(-4px); }
          .feature-card:hover { border-color: var(--accent); box-shadow: 0 24px 80px -48px var(--accent); }
          .nav-shell { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
          .mobile-menu[open] .mobile-panel { opacity: 1; transform: translateY(0); pointer-events: auto; }
          .mobile-panel { opacity: 0; transform: translateY(-8px); pointer-events: none; transition: opacity .22s ease, transform .22s ease; }
          .step-arrow { animation: arrowPulse 1.8s ease-in-out infinite; }
          .final-gradient { background-size: 180% 180%; animation: finalPulse 5s ease-in-out infinite alternate; }
          @media (max-width: 768px) {
            .hero-dashboard-wrap { transform: none; }
          }
        `,
      }}
    />
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#06080d] text-[#e8edf5]">
      <LandingViewTracker />
      <LandingStyles />

      <header className="nav-shell fixed left-0 right-0 top-0 z-50 border-b border-[#1c2235]/80 bg-[#06080d]/72">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" aria-label="TradeEdge AI home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {["Findings", "Congress", "Pricing", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="font-mono text-[11px] tracking-[0.1em] text-[#8892a4] uppercase hover:text-[#e8edf5] transition-colors duration-150">
                {item}
              </a>
            ))}
            <a href="#about" className="font-mono text-[11px] tracking-[0.1em] text-[#8892a4] uppercase hover:text-[#e8edf5] transition-colors duration-150">
              About
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm text-[#a0afc0] transition-colors hover:text-[#e8edf5]">
              Log in
            </Link>
            <Link href="/signup" className="bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[11px] tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg hover:shadow-[0_0_16px_rgba(0,255,136,0.25)] transition-all duration-200">
              Start Free Trial
            </Link>
          </div>
          <details className="mobile-menu relative md:hidden">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-[#1a2030] text-[#e8edf5] [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Open menu</span>
              <span className="h-0.5 w-5 bg-current shadow-[0_6px_0_current,0_-6px_0_current]" />
            </summary>
            <div className="mobile-panel absolute right-0 top-12 w-56 rounded-2xl border border-[#1a2030] bg-[#080b11] p-3 shadow-2xl">
              {["Findings", "Congress", "Pricing", "FAQ"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="block rounded-xl px-3 py-3 text-sm text-[#a0afc0] hover:bg-[#0c1018] hover:text-[#e8edf5]">
                  {item}
                </a>
              ))}
              <a href="#about" className="block rounded-xl px-3 py-3 text-sm text-[#a0afc0] hover:bg-[#0c1018] hover:text-[#e8edf5]">
                About
              </a>
              <Link href="/signup" className="mt-2 block rounded-xl bg-[#00e5b0] px-3 py-3 text-center text-sm font-bold text-[#06080d]">
                Start free
              </Link>
            </div>
          </details>
        </div>
      </header>

      <LiveTickerBar />
      <div className="h-[100px]" aria-hidden="true" />

      <section className="hero-breath relative px-5 pb-24 pt-16 text-center md:px-8 md:pb-32 md:pt-20">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(26,32,48,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(26,32,48,.5)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,#000_22%,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="hero-pill font-mono text-[10px] uppercase tracking-[0.24em] text-[#4a5568]">
            FIELD REPORT · TRADER PERFORMANCE
          </div>
          <h1 className="hero-line hero-line-1 mx-auto mt-8 max-w-4xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-[#e8edf5] sm:text-4xl md:text-5xl lg:text-6xl">
            Most Traders Never See The Real Problem.
          </h1>
          <p className="hero-line hero-line-2 mx-auto mt-7 max-w-[560px] font-body text-base leading-7 text-[#8892a4] sm:text-lg sm:leading-8">
            TradeEdge AI shows you the pattern in your own trading that&apos;s
            quietly costing you money — before it costs you your account.
          </p>
          <div className="hero-line hero-line-3 mt-9 flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[11px] tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg hover:shadow-[0_0_16px_rgba(0,255,136,0.25)] transition-all duration-200"
            >
              Start Free Trial
            </Link>
            <a
              href="#findings"
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#4a5568] transition-colors duration-150 hover:text-[#8892a4]"
            >
              See how it works ↓
            </a>
          </div>
          <HeroTradeExample />
        </div>
      </section>

      <ScrollReveal as="section" className="px-5 py-16 md:px-8 md:py-20">
        <TrustLogos />
      </ScrollReveal>

      <ScrollReveal id="findings" className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Field Findings"
            title="WHAT THE DATA ACTUALLY SHOWS"
            body="Three patterns serious traders miss when they only watch the number at the bottom of the screen."
          />
          <div className="mt-16 space-y-20 md:mt-20 md:space-y-28">
            <FindingRow
              label="FINDING 01"
              headline="You Can See Your P&L. You Can't See Why."
              body="Your journal and analytics break edge down by setup, market, time of day, and behavior — so you stop guessing which trades to repeat and which habits to cut. See the month by P&L and mistake patterns without spreadsheet friction."
              visual={<FindingJournalVisual />}
            />
            <FindingRow
              label="FINDING 02"
              headline="Discipline Breaks Down In Patterns, Not Random Moments."
              body="AI coaching turns your trade history into session debriefs, psychology diagnosis, and specific next-session corrections — the feedback loop that shows why the same leak keeps showing up."
              visual={<FindingCoachVisual />}
              reverse
            />
            <FindingRow
              label="FINDING 03"
              headline="Prop Firm Accounts Fail On Rules, Not Markets."
              body="Track evaluations and funded accounts against profit targets, daily loss, and max drawdown in one place — so you catch a rule break before it fails the challenge."
              visual={<FindingPropFirmVisual />}
            />
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal id="congress" className="bg-[#080b11] px-5 py-24 md:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#00e5b0]">Congress Trades Spotlight</div>
            <h2 className="mt-4 font-heading text-[36px] sm:text-[48px] leading-[0.94] tracking-[0.05em] text-[#e8edf5] md:text-[76px]">
              SEE WHAT CONGRESS IS BUYING.
            </h2>
            <p className="mt-6 max-w-xl text-[17px] leading-8 text-[#a0afc0]">
              Follow public disclosures from lawmakers and connect political positioning to the markets already on your watchlist.
            </p>
            <div className="mt-7 inline-flex rounded-full border border-[#1a2030] bg-[#0c1018] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f0c040]">
              Quiver Quantitative data layer
            </div>
          </div>
          <div className="w-full max-w-full overflow-hidden rounded-xl border border-[#1a2030] bg-[#0c1018] shadow-[0_40px_120px_-70px_rgba(0,229,176,.35)]">
            <div className="hidden border-b border-[#1a2030] bg-[#06080d] px-4 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#5a6580] sm:grid sm:grid-cols-[.65fr_1.25fr_.5fr_.7fr_.75fr_.95fr]">
              <span>Date</span><span>Member</span><span>Party</span><span>Ticker</span><span>Type</span><span>Amount</span>
            </div>
            {congressRows.map(([date, member, party, ticker, type, amount]) => (
              <div key={`${member}-${ticker}`}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[#1a2030] px-4 py-4 last:border-b-0 sm:hidden">
                  <span className="min-w-0 truncate font-body text-[13px] font-medium text-[#e8edf5]">
                    {member}
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-[#e8edf5]">
                    {ticker}
                  </span>
                  <CongressTypeBadge type={type} />
                </div>
                <div className="hidden grid-cols-[.65fr_1.25fr_.5fr_.7fr_.75fr_.95fr] items-center border-b border-[#1a2030] px-4 py-4 text-sm last:border-b-0 sm:grid">
                  <span className="font-mono text-[#5a6580]">{date}</span>
                  <span className="text-[#e8edf5]">{member}</span>
                  <span className="inline-flex items-center gap-2 font-mono text-[#a0afc0]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: party === "D" ? "#0066ff" : "#ff4d6d" }} />
                    {party}
                  </span>
                  <span className="font-mono font-bold text-[#e8edf5]">{ticker}</span>
                  <span className="font-mono" style={{ color: type === "Purchase" ? "#00e5b0" : "#ff4d6d" }}>{type}</span>
                  <span className="font-mono text-[#a0afc0]">{amount}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </ScrollReveal>

      <ScrollReveal className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="How it works" title="FROM DATA TO DISCIPLINE" body="No generic affirmations. TradeEdge turns the trades you already take into a clear feedback loop." />
          <div className="mt-16 grid gap-8 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {[
              ["01", "CONNECT YOUR ROUTINE", "Log trades, setups, rules, and emotional context in one fast workflow."],
              ["02", "LET AI FIND THE LEAK", "The coaching engine identifies repeat mistakes and highlights what is actually working."],
              ["03", "TRADE THE NEXT SESSION BETTER", "Use readiness, risk, and coaching reports before you place the next trade."],
            ].map(([num, title, body], index) => (
              <Fragment key={title}>
                <div key={title} className="rounded-3xl border border-[#1a2030] bg-[#0c1018] p-6">
                  <div className="font-heading text-5xl sm:text-7xl leading-none text-[#1a2030]">{num}</div>
                  <h3 className="mt-5 font-heading text-2xl sm:text-3xl tracking-[0.05em] text-[#e8edf5]">{title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#a0afc0]">{body}</p>
                </div>
                {index < 2 ? <div className="step-arrow hidden items-center font-heading text-5xl text-[#1a2030] md:flex">→</div> : null}
              </Fragment>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal id="pricing" className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Pricing" title="COMPARE EVERY FEATURE" body="Each plan is its own card — scan features at a glance and pick the edge that fits your trading." />
          <div className="mt-12 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:mt-16">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#a0afc0]">
            All plans include a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal id="testimonials" className="bg-[#080b11] px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Testimonials" title="TRADERS FEEL THE DIFFERENCE" />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["TradeEdge showed me my worst trades all happened after I broke my session plan. That single insight paid for the year.", "Marcus T.", "Futures trader"],
              ["The AI reports feel like a coach reviewing tape. It does not flatter you. It tells you exactly where your discipline slipped.", "Sarah K.", "Prop firm trader"],
              ["Congress trades plus my watchlist changed how I prep each morning. It gives me context I was missing before.", "Derek M.", "Forex and equities"],
            ].map(([quote, name, meta], index) => (
              <div key={name} className={`rounded-3xl border bg-[#0c1018] p-6 ${index === 1 ? "border-[#00e5b0] shadow-[0_0_50px_rgba(0,229,176,.12)] md:-translate-y-4" : "border-[#1a2030]"}`}>
                <div className="font-mono text-[#f0c040]">★★★★★</div>
                <p className="mt-5 text-[15px] leading-7 text-[#a0afc0]">&ldquo;{quote}&rdquo;</p>
                <div className="mt-6 font-bold text-[#e8edf5]">{name}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a6580]">{meta}</div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal id="faq" className="px-5 py-24 md:px-8">
        <SectionHeader eyebrow="FAQ" title="QUESTIONS BEFORE YOU COMMIT?" />
        <div className="mt-12">
          <FaqAccordion />
        </div>
      </ScrollReveal>

      <ScrollReveal id="about" className="relative overflow-hidden px-6 py-24">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00ff88]/[0.03] blur-[150px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-3 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a5568]">
              FILED BY
            </span>
          </div>

          <h2 className="mb-2 text-center font-display text-3xl font-bold text-[#e8edf5] sm:text-4xl">
            Built by a Trader, For Traders
          </h2>

          <p className="mb-12 text-center font-mono text-[12px] text-[#00ff88]">
            Anthony Brown · Founder, TradeEdge AI
          </p>

          <div className="space-y-6 rounded-2xl border border-[#1c2235] bg-[#0c0f17] p-8 font-body text-[15px] leading-relaxed text-[#8892a4] sm:p-10 sm:text-[16px]">
            <p>
              I spent 20 years in the Army as an Airborne Ranger and 82nd
              Airborne paratrooper before I ever sat down seriously to trade.
              Military life teaches you something that took me a long time to
              fully understand — failure is rarely about ability. It&apos;s
              almost always about process, preparation, and the small decisions
              you make under pressure that nobody else ever sees.
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
              real tool, built by a trader, for traders, designed to do one
              thing — help you see the patterns that are quietly costing you
              money before they cost you your account.
            </p>

            <p className="font-display text-xl font-bold not-italic text-[#00ff88]">
              My mission is simple: build better traders. Period.
            </p>

            <div className="mt-2 border-t border-[#1c2235] pt-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#4a5568]">
                Rangers Lead The Way.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal className="final-gradient bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,176,.18),transparent_42%),linear-gradient(120deg,#06080d,#080b11,#06120f)] px-5 py-28 text-center md:px-8">
        <h2 className="font-heading text-[40px] sm:text-[56px] leading-[0.92] tracking-[0.05em] text-[#e8edf5] md:text-[92px]">
          <span className="block">STOP TRADING BLIND.</span>
          <span className="block text-[#00e5b0]">BUILD YOUR EDGE.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-8 text-[#a0afc0]">
          Start with a clean 14-day trial and see what your trading data has been trying to tell you.
        </p>
        <Link href="/signup" className="mt-9 inline-flex rounded-full bg-[#00e5b0] px-8 py-4 text-sm font-bold text-[#06080d] shadow-[0_0_42px_rgba(0,229,176,.4)]">
          Start free trial
        </Link>
      </ScrollReveal>

      <footer className="border-t border-[#1c2235] bg-[#080b11] px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#4a5568]">
            <a href="#findings" className="transition-colors hover:text-[#8892a4]">Findings</a>
            <a href="#pricing" className="transition-colors hover:text-[#8892a4]">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-[#8892a4]">FAQ</a>
            <Link href="/about" className="transition-colors hover:text-[#8892a4]">About</Link>
            <Link href="/login" className="transition-colors hover:text-[#8892a4]">Log in</Link>
            <Link href="/privacy" className="transition-colors hover:text-[#8892a4]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#8892a4]">Terms</Link>
          </nav>
          <div className="font-mono text-[10px] text-[#4a5568]">
            © 2026 TradeEdge AI.
          </div>
        </div>
      </footer>
    </main>
  );
}
