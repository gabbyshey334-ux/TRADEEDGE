"use client";

import Link from "next/link";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, #00ff88 0%, #0ea5e9 100%)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 18V6l8 6 8-6v12"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="font-display font-bold text-[20px] sm:text-[22px] tracking-tight text-[#e8edf5]">
        TRADE<span style={{ color: "#00ff88" }}>EDGE</span>
      </div>
    </div>
  );
}

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingNav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-bg"
      style={{ borderBottom: "1px solid #1a2030" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" aria-label="TradeEdge AI home">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] tracking-[0.1em] text-[#8892a4] uppercase hover:text-[#e8edf5] transition-colors duration-150"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-md font-body text-[14px] text-[#8892a4] hover:text-[#e8edf5] transition-all duration-200"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[11px] tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg hover:shadow-[0_0_16px_rgba(0,255,136,0.25)] transition-all duration-200 whitespace-nowrap"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
