"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-bg"
      style={{ borderBottom: "1px solid #1a2030" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" aria-label="TradeEdge AI home" onClick={() => setOpen(false)}>
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
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-md font-sans text-[14px] text-text hover:bg-card transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[11px] tracking-[0.1em] uppercase px-5 py-2.5 rounded-lg hover:shadow-[0_0_16px_rgba(0,255,136,0.25)] transition-all duration-200 whitespace-nowrap"
          >
            Start Free Trial
          </Link>
          <button
            type="button"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-md border border-[#1a2030] text-text"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden border-t border-[#1a2030] bg-[#080b11] px-4 py-4 flex flex-col gap-1"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[14px] font-sans text-text hover:bg-card"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="sm:hidden rounded-lg px-3 py-3 text-[14px] font-sans text-muted hover:bg-card"
          >
            Log In
          </Link>
        </div>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
