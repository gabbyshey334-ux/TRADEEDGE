"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Does this work for both Forex and Futures?",
    a: "Yes. TradeEdge AI is built specifically for both markets. The risk calculator handles pips for Forex and points for Futures. All analytics filter by market type.",
  },
  {
    q: "How does the AI coaching actually work?",
    a: "You click Generate Report and our AI analyzes your trade history to produce a personalized debrief. It looks at your setups, emotions, sessions, and P&L patterns to give you specific, actionable feedback.",
  },
  {
    q: "Is my trading data secure and private?",
    a: "Yes. Every user's data is completely isolated using Row Level Security at the database level. Nobody else can ever see your trades — not even us.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. Cancel with one click from your account settings. No questions asked, no cancellation fees. Your data stays accessible until the end of your billing period.",
  },
  {
    q: "Do you offer discounts for prop firm traders?",
    a: "We are working on a prop firm bundle. Join the waitlist from your account page and we will notify you when it launches.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-3">
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl overflow-hidden transition-colors"
            style={{ backgroundColor: "#0c1018", border: "1px solid #1a2030" }}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
              className="faq-trigger flex items-center justify-between gap-4 px-6 py-5 transition-colors"
            >
              <span
                className="font-heading text-[18px] md:text-[20px] tracking-wide"
                style={{ letterSpacing: "0.04em", color: "#e8edf5" }}
              >
                {item.q}
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border border-[#1a2030] text-[#00e5b0] text-lg leading-none transition-transform"
                style={{
                  transform: open ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                +
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{
                gridTemplateRows: open ? "1fr" : "0fr",
              }}
            >
              <div className="overflow-hidden">
                <div
                  className="px-6 pb-5 pt-0 text-[14px] leading-relaxed font-sans"
                  style={{ color: "#a0afc0" }}
                >
                  {item.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
