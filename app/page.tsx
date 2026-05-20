import Link from "next/link";
import {
  BarChart3,
  Brain,
  Calendar,
  Check,
  Landmark,
  LineChart,
  Scale,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { FaqAccordion } from "@/components/FaqAccordion";
import { LandingNav } from "@/components/LandingNav";
import { MarketTicker } from "@/components/MarketTicker";

/* ----------------------------- shared atoms ----------------------------- */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #00e5b0 0%, #0066ff 100%)",
        }}
      >
        <LineChart size={18} color="#ffffff" strokeWidth={2.25} aria-hidden />
      </div>
      <div
        className="font-heading text-[22px]"
        style={{ letterSpacing: "0.08em", color: "#e8edf5" }}
      >
        TRADE<span style={{ color: "#00e5b0" }}>EDGE</span>
      </div>
    </div>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <Check
      size={size}
      color="#00e5b0"
      strokeWidth={3}
      aria-hidden
    />
  );
}

function StarIcon() {
  return (
    <Star
      size={14}
      fill="#f0c040"
      color="#f0c040"
      aria-hidden
    />
  );
}

/* ------------------------------ feature card ---------------------------- */

interface FeatureCardProps {
  color: string;
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
}

function FeatureCard({
  color,
  icon: Icon,
  title,
  description,
  comingSoon,
}: FeatureCardProps) {
  return (
    <div
      className="relative rounded-xl border border-border bg-card p-6 overflow-hidden"
      style={{ borderRadius: 12 }}
    >
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: 2, backgroundColor: color }}
      />
      {comingSoon && (
        <span
          className="absolute top-4 right-4 font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1 rounded-md"
          style={{
            color: "#f0c040",
            backgroundColor: "rgba(240, 192, 64, 0.1)",
            border: "1px solid rgba(240, 192, 64, 0.3)",
          }}
        >
          Coming Soon
        </span>
      )}
      <div className="mb-4" aria-hidden="true">
        <Icon size={28} color={color} strokeWidth={1.75} />
      </div>
      <h3
        className="font-heading text-[20px] mb-2 text-text"
        style={{ letterSpacing: "0.04em" }}
      >
        {title}
      </h3>
      <p className="text-[14px] leading-relaxed text-muted font-sans">
        {description}
      </p>
    </div>
  );
}

/* ------------------------------- testimonial ---------------------------- */

interface TestimonialProps {
  quote: string;
  name: string;
  meta: string;
}

function TestimonialCard({ quote, name, meta }: TestimonialProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
      style={{ borderRadius: 12 }}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} />
        ))}
      </div>
      <p className="text-[14px] leading-relaxed italic text-quote font-sans">
        “{quote}”
      </p>
      <div className="mt-auto">
        <div className="text-[14px] font-bold text-text font-sans">
          {name}
        </div>
        <div
          className="text-[11px] uppercase tracking-[0.18em] text-muted font-mono"
          style={{ marginTop: 2 }}
        >
          {meta}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function LandingPage() {
  return (
    <div className="landing min-h-screen bg-bg text-text">
        <LandingNav />

        {/* ================= SECTION 2 — TICKER BAR ================= */}
        <div
          className="fixed left-0 right-0 z-40 overflow-hidden"
          style={{
            top: 64,
            background: "#080b11",
            borderTop: "1px solid #1a2030",
            borderBottom: "1px solid #1a2030",
            height: 36,
          }}
        >
          <div className="ticker-track h-full items-center">
            <MarketTicker />
          </div>
        </div>

        {/* spacer for fixed nav + ticker (nav is 56–64px + ticker 36px) */}
        <div className="h-[92px] sm:h-[100px]" aria-hidden="true" />

        {/* ================= SECTION 3 — HERO ================= */}
        <section
          id="hero"
          className="relative w-full"
          style={{
            minHeight: "calc(100vh - 100px)",
            backgroundColor: "#06080d",
          }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 flex flex-col items-center text-center">
            {/* pill badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card"
              style={{ border: "1px solid #1a2030" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: "#00e5b0",
                  boxShadow: "0 0 8px #00e5b0",
                }}
              />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-quote"
              >
                Now with AI Coaching Engine v2
              </span>
            </div>

            {/* headline */}
            <h1
              className="font-heading mt-8"
              style={{
                fontSize: "clamp(56px, 9vw, 96px)",
                lineHeight: 1.02,
                letterSpacing: "clamp(1px, 0.5vw, 3px)",
                color: "#e8edf5",
              }}
            >
              <span className="block">TRADE SMARTER.</span>
              <span className="block">WIN MORE.</span>
              <span className="block">
                POWERED BY <span style={{ color: "#00e5b0" }}>AI</span>
              </span>
            </h1>

            {/* subheadline */}
            <p
              className="mt-7 text-[18px] leading-relaxed text-muted font-sans"
              style={{ maxWidth: 560 }}
            >
              The only trading journal that analyzes your patterns, coaches
              your psychology, and calculates your edge — built for serious
              Forex and Futures traders.
            </p>

            {/* CTA buttons */}
            <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-md font-sans text-[15px] font-semibold hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "#00e5b0",
                  color: "#06080d",
                  boxShadow: "0 0 40px rgba(0, 229, 176, 0.25)",
                }}
              >
                Start 14-Day Free Trial
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-7 py-4 rounded-md font-sans text-[15px] text-text hover:bg-card transition-colors"
                style={{ border: "1px solid #1a2030" }}
              >
                See All Features
              </Link>
            </div>

            {/* trust badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                "No credit card required",
                "Cancel anytime",
                "Works for Forex and Futures",
              ].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 text-[12px] text-muted font-sans"
                >
                  <CheckIcon size={12} />
                  {t}
                </span>
              ))}
            </div>

            {/* browser mockup */}
            <div
              className="mt-16 w-full"
              style={{ maxWidth: 1080 }}
            >
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "#0c1018",
                  border: "1px solid #1a2030",
                  boxShadow:
                    "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,176,0.05)",
                }}
              >
                {/* browser chrome */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: "1px solid #1a2030" }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#ff4d6d" }}
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#f0c040" }}
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#00e5b0" }}
                    />
                  </div>
                  <div
                    className="flex-1 mx-2 px-3 py-1.5 rounded-md text-center font-mono text-[11px] text-muted"
                    style={{
                      background: "#06080d",
                      border: "1px solid #1a2030",
                    }}
                  >
                    app.tradeedge.ai — Dashboard
                  </div>
                </div>

                {/* dashboard preview */}
                <div className="p-5 md:p-8">
                  {/* stat cards grid 2x2 */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {[
                      {
                        label: "Total P&L",
                        value: "+$4,821",
                        color: "#00e5b0",
                      },
                      { label: "Win Rate", value: "68.4%", color: "#0066ff" },
                      { label: "Avg R:R", value: "2.41R", color: "#b466ff" },
                      { label: "Max DD", value: "-$412", color: "#f0c040" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="relative rounded-lg bg-bg p-4 md:p-5 overflow-hidden"
                        style={{ border: "1px solid #1a2030" }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0"
                          style={{ height: 2, backgroundColor: s.color }}
                        />
                        <div
                          className="text-[10px] uppercase tracking-[0.18em] text-muted font-mono"
                        >
                          {s.label}
                        </div>
                        <div
                          className="mt-2 font-heading text-2xl md:text-3xl tracking-wide"
                          style={{ color: s.color }}
                        >
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* trade table */}
                  <div
                    className="mt-5 rounded-lg overflow-hidden"
                    style={{ border: "1px solid #1a2030" }}
                  >
                    {/* header */}
                    <div
                      className="hidden md:grid font-mono text-[10px] uppercase tracking-[0.18em] text-muted px-4 py-3"
                      style={{
                        gridTemplateColumns:
                          "0.7fr 0.9fr 1fr 0.7fr 0.9fr 0.9fr 1.2fr",
                        borderBottom: "1px solid #1a2030",
                        background: "#080b11",
                      }}
                    >
                      <span>Date</span>
                      <span>Market</span>
                      <span>Symbol</span>
                      <span>Side</span>
                      <span>Entry</span>
                      <span>P&L</span>
                      <span>Setup</span>
                    </div>
                    {[
                      {
                        date: "05/07",
                        market: "FOREX",
                        symbol: "EUR/USD",
                        side: "Long",
                        entry: "1.0821",
                        pnl: "+$795",
                        pnlPositive: true,
                        setup: "Breakout",
                      },
                      {
                        date: "05/06",
                        market: "FUTURES",
                        symbol: "NQ1!",
                        side: "Long",
                        entry: "18,420",
                        pnl: "+$1,800",
                        pnlPositive: true,
                        setup: "VWAP Reclaim",
                      },
                      {
                        date: "05/05",
                        market: "FOREX",
                        symbol: "GBP/USD",
                        side: "Short",
                        entry: "1.2734",
                        pnl: "-$132",
                        pnlPositive: false,
                        setup: "Reversal",
                      },
                    ].map((row, i, arr) => (
                      <div key={i}>
                        {/* Mobile row */}
                        <div
                          className="md:hidden px-4 py-3 font-mono text-[12px] border-b border-[#1a2030] last:border-b-0"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-semibold text-text">{row.symbol}</span>
                            <span
                              style={{
                                color: row.pnlPositive ? "#00e5b0" : "#ff4d6d",
                              }}
                            >
                              {row.pnl}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted text-[11px]">
                            <span>{row.date}</span>
                            <span>{row.market}</span>
                            <span style={{ color: row.side === "Long" ? "#00e5b0" : "#ff4d6d" }}>
                              {row.side}
                            </span>
                            <span>{row.setup}</span>
                          </div>
                        </div>
                        {/* Desktop row */}
                        <div
                          className="hidden md:grid font-mono text-[12px] text-text px-4 py-3 gap-0"
                          style={{
                            gridTemplateColumns:
                              "0.7fr 0.9fr 1fr 0.7fr 0.9fr 0.9fr 1.2fr",
                            borderBottom:
                              i < arr.length - 1 ? "1px solid #1a2030" : "none",
                          }}
                        >
                          <span className="text-muted">{row.date}</span>
                          <span className="text-quote">{row.market}</span>
                          <span>{row.symbol}</span>
                          <span
                            style={{
                              color:
                                row.side === "Long" ? "#00e5b0" : "#ff4d6d",
                            }}
                          >
                            {row.side}
                          </span>
                          <span className="text-quote">{row.entry}</span>
                          <span
                            style={{
                              color: row.pnlPositive ? "#00e5b0" : "#ff4d6d",
                            }}
                          >
                            {row.pnl}
                          </span>
                          <span className="text-quote">{row.setup}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 4 — FEATURES ================= */}
        <section
          id="features"
          className="w-full"
          style={{ backgroundColor: "#06080d" }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-24">
            <div className="text-center">
              <div
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-green"
              >
                Everything You Need
              </div>
              <h2
                className="font-heading mt-3 text-text"
                style={{
                  fontSize: "clamp(40px, 6vw, 64px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.05,
                }}
              >
                BUILT FOR EDGE, NOT EXCUSES
              </h2>
              <p
                className="mt-5 text-[16px] text-muted font-sans mx-auto"
                style={{ maxWidth: 620 }}
              >
                Every feature is designed around one goal: helping you find
                and exploit your statistical edge in the markets.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FeatureCard
                color="#00e5b0"
                icon={BarChart3}
                title="AI COACHING ENGINE"
                description="Get personalized session debriefs, psychology analysis, and edge reports powered by Claude AI — your personal trading coach available 24/7."
              />
              <FeatureCard
                color="#0066ff"
                icon={Calendar}
                title="TRADE CALENDAR"
                description="Visualize your P&L across the month with intensity-scaled heat maps. Instantly spot your best and worst trading days."
              />
              <FeatureCard
                color="#b466ff"
                icon={Brain}
                title="PSYCHOLOGY TRACKER"
                description="Log your emotional state on every trade. Discover how fear, greed, and confidence actually affect your bottom line."
              />
              <FeatureCard
                color="#f0c040"
                icon={Scale}
                title="RISK CALCULATOR"
                description="Calculate exact position sizes for Forex and Futures in seconds. Never risk the wrong amount again."
              />
              <FeatureCard
                color="#ff4d6d"
                icon={TrendingUp}
                title="ADVANCED ANALYTICS"
                description="Break down your performance by setup, session, market, and emotion. Find what works and do more of it."
              />
              <FeatureCard
                color="#00e5b0"
                icon={Landmark}
                title="CONGRESS TRADES FEED"
                description="See what US senators and representatives are buying and selling. Public STOCK Act data surfaced inside your journal."
                comingSoon
              />
            </div>
          </div>
        </section>

        {/* ================= SECTION 5 — HOW IT WORKS ================= */}
        <section
          id="how-it-works"
          className="w-full"
          style={{ backgroundColor: "#080b11" }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-24">
            <div className="text-center">
              <div
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-green"
              >
                Simple Process
              </div>
              <h2
                className="font-heading mt-3 text-text"
                style={{
                  fontSize: "clamp(40px, 6vw, 64px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.05,
                }}
              >
                UP IN 60 SECONDS
              </h2>
              <p
                className="mt-5 text-[16px] text-muted font-sans mx-auto"
                style={{ maxWidth: 620 }}
              >
                No complicated setup. No CSV imports. Start journaling
                immediately.
              </p>
            </div>

            {(() => {
              const steps = [
                {
                  n: "01",
                  t: "SIGN UP FREE",
                  d: "Create your account in 30 seconds. No credit card required. 14-day trial included.",
                },
                {
                  n: "02",
                  t: "LOG YOUR TRADES",
                  d: "Add trades manually in seconds. Track entry, exit, setup, emotion, and session.",
                },
                {
                  n: "03",
                  t: "DISCOVER YOUR EDGE",
                  d: "Let the AI analyze your data and tell you exactly where your edge is.",
                },
              ];
              const nodes: React.ReactNode[] = [];
              steps.forEach((step, i) => {
                nodes.push(
                  <div key={`step-${step.n}`} className="text-center md:text-left">
                    <div
                      className="font-heading"
                      style={{
                        fontSize: 64,
                        lineHeight: 1,
                        color: "#1a2030",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {step.n}
                    </div>
                    <h3
                      className="font-heading mt-4 text-text"
                      style={{
                        fontSize: 22,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {step.t}
                    </h3>
                    <p className="mt-3 text-[14px] text-muted font-sans leading-relaxed">
                      {step.d}
                    </p>
                  </div>
                );
                if (i < steps.length - 1) {
                  nodes.push(
                    <div
                      key={`arrow-${i}`}
                      className="hidden md:flex items-center justify-center pt-4"
                      aria-hidden="true"
                    >
                      <svg
                        width="36"
                        height="24"
                        viewBox="0 0 36 24"
                        fill="none"
                        stroke="#1a2030"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="2" y1="12" x2="32" y2="12" />
                        <polyline points="24 4 32 12 24 20" />
                      </svg>
                    </div>
                  );
                }
              });
              return (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-8 md:gap-4">
                  {nodes}
                </div>
              );
            })()}
          </div>
        </section>

        {/* ================= SECTION 6 — PRICING ================= */}
        <section
          id="pricing"
          className="w-full"
          style={{ backgroundColor: "#06080d" }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-24">
            <div className="text-center">
              <div
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-green"
              >
                Simple Pricing
              </div>
              <h2
                className="font-heading mt-3 text-text"
                style={{
                  fontSize: "clamp(40px, 6vw, 64px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.05,
                }}
              >
                INVEST IN YOUR EDGE
              </h2>
              <p
                className="mt-5 text-[16px] text-muted font-sans mx-auto"
                style={{ maxWidth: 620 }}
              >
                One bad trade costs more than a year of TradeEdge AI. Start
                free, upgrade when ready.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* Starter */}
              <div
                className="rounded-xl bg-card p-7 flex flex-col"
                style={{ border: "1px solid #1a2030" }}
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Starter
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className="font-heading text-text"
                    style={{ fontSize: 56, letterSpacing: "0.02em" }}
                  >
                    $19
                  </span>
                  <span className="text-[14px] text-muted font-mono">
                    /mo
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-muted font-sans">
                  For traders just starting their journal.
                </p>

                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "Up to 50 trades/month",
                    "Basic analytics",
                    "Risk calculator",
                    "Trade calendar",
                    "Email support",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-[14px] text-text font-sans"
                    >
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="mt-8 inline-flex items-center justify-center px-5 py-3 rounded-md font-sans text-[14px] text-text hover:bg-[#10141d] transition-colors"
                  style={{ border: "1px solid #1a2030" }}
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Pro */}
              <div
                className="rounded-xl bg-card p-5 sm:p-7 flex flex-col relative lg:scale-[1.02] lg:-my-1"
                style={{
                  border: "1px solid #00e5b0",
                  boxShadow:
                    "0 0 0 1px rgba(0,229,176,0.15), 0 20px 60px -10px rgba(0,229,176,0.15)",
                }}
              >
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.22em] px-3 py-1 rounded-full"
                  style={{
                    color: "#06080d",
                    backgroundColor: "#00e5b0",
                  }}
                >
                  Most Popular
                </span>
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.22em]"
                  style={{ color: "#00e5b0" }}
                >
                  Pro
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className="font-heading text-text"
                    style={{ fontSize: 56, letterSpacing: "0.02em" }}
                  >
                    $49
                  </span>
                  <span className="text-[14px] text-muted font-mono">
                    /mo
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-muted font-sans">
                  For serious traders ready to find their edge.
                </p>

                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "Unlimited trades",
                    "Full AI coaching suite (10 reports/mo)",
                    "Advanced analytics",
                    "Psychology tracker",
                    "Priority support",
                    "Everything in Starter",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-[14px] text-text font-sans"
                    >
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-sans text-[14px] font-semibold hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: "#00e5b0",
                    color: "#06080d",
                  }}
                >
                  Start Free Trial
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Elite */}
              <div
                className="rounded-xl bg-card p-7 flex flex-col"
                style={{ border: "1px solid #1a2030" }}
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Elite
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className="font-heading text-text"
                    style={{ fontSize: 56, letterSpacing: "0.02em" }}
                  >
                    $99
                  </span>
                  <span className="text-[14px] text-muted font-mono">
                    /mo
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-muted font-sans">
                  For power users, prop traders, and teams.
                </p>

                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "Everything in Pro",
                    "Unlimited AI reports",
                    "Congress trades feed (coming soon)",
                    "Multi-account support (up to 5)",
                    "API access",
                    "Dedicated support",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-[14px] text-text font-sans"
                    >
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="mt-8 inline-flex items-center justify-center px-5 py-3 rounded-md font-sans text-[14px] text-text hover:bg-[#10141d] transition-colors"
                  style={{ border: "1px solid #1a2030" }}
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            <p
              className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
            >
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </section>

        {/* ================= SECTION 7 — TESTIMONIALS ================= */}
        <section
          id="testimonials"
          className="w-full"
          style={{ backgroundColor: "#080b11" }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-24">
            <div className="text-center">
              <div
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-green"
              >
                Real Traders
              </div>
              <h2
                className="font-heading mt-3 text-text"
                style={{
                  fontSize: "clamp(40px, 6vw, 64px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.05,
                }}
              >
                WHAT TRADERS SAY
              </h2>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
              <TestimonialCard
                quote="TradeEdge AI showed me I was losing money on revenge trades after 2pm. I cut those out and my win rate jumped 12% in a month."
                name="Marcus T."
                meta="Forex Trader · 3 years experience"
              />
              <TestimonialCard
                quote="The risk calculator alone is worth it. I stopped blowing up accounts because I was sizing wrong on NQ. This app fixed that immediately."
                name="Sarah K."
                meta="Futures Trader · FTMO Funded"
              />
              <TestimonialCard
                quote="The AI session debrief after a rough week is like having a coach review your tape. It spotted patterns I never would have caught myself."
                name="Derek M."
                meta="Full-Time Trader · 7 years experience"
              />
            </div>
          </div>
        </section>

        {/* ================= SECTION 8 — FAQ ================= */}
        <section
          id="faq"
          className="w-full"
          style={{ backgroundColor: "#06080d" }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-24">
            <div className="text-center">
              <div
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-green"
              >
                Common Questions
              </div>
              <h2
                className="font-heading mt-3 text-text"
                style={{
                  fontSize: "clamp(40px, 6vw, 64px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.05,
                }}
              >
                FAQ
              </h2>
            </div>

            <div className="mt-12">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* ================= SECTION 9 — FINAL CTA ================= */}
        <section
          id="cta"
          className="w-full"
          style={{
            background:
              "radial-gradient(ellipse at center, #0c1018 0%, #06080d 70%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-28 text-center">
            <div
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-green"
            >
              Get Started Today
            </div>
            <h2
              className="font-heading mt-4 text-text"
              style={{
                fontSize: "clamp(48px, 8vw, 88px)",
                letterSpacing: "0.04em",
                lineHeight: 1.02,
              }}
            >
              <span className="block">STOP GUESSING.</span>
              <span className="block">START WINNING.</span>
            </h2>
            <p
              className="mt-6 text-[17px] text-muted font-sans mx-auto"
              style={{ maxWidth: 580 }}
            >
              Join thousands of traders who turned data into discipline.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-sans text-[16px] font-semibold hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "#00e5b0",
                  color: "#06080d",
                  boxShadow: "0 0 60px rgba(0, 229, 176, 0.35)",
                }}
              >
                Start Your Free 14-Day Trial
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= SECTION 10 — FOOTER ================= */}
        <footer
          className="w-full"
          style={{
            backgroundColor: "#080b11",
            borderTop: "1px solid #1a2030",
          }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" aria-label="TradeEdge AI home">
              <Logo />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {[
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
                { label: "Support", href: "#" },
                { label: "Blog", href: "#" },
                { label: "API", href: "#" },
              ].map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted hover:text-text transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted text-center md:text-right"
            >
              © 2026 TradeEdge AI. All rights reserved.
            </div>
          </div>
        </footer>
    </div>
  );
}
