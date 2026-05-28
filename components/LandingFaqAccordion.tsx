"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Is TradeEdge AI built for futures, forex, or stocks?",
    a: "TradeEdge AI is built around active futures and forex workflows first, with analytics that also support equities and tracked congress trades for broader market context.",
  },
  {
    q: "How does the AI coaching engine create reports?",
    a: "It reviews your logged trades, setups, risk, P&L, timing, and psychology notes, then turns them into coaching summaries you can act on before the next session.",
  },
  {
    q: "Do I need a credit card for the 14-day trial?",
    a: "No. Every plan starts with a 14-day free trial, no credit card required. You can upgrade, downgrade, or cancel anytime.",
  },
  {
    q: "What makes Elite different from Pro?",
    a: "Elite unlocks the newest AI systems: Readiness Score, Rule Break Prediction, Daily Coaching Reports, multi-account support, API access, and dedicated support.",
  },
  {
    q: "Can I use it for prop firm tracking?",
    a: "Yes. Pro and Elite include the prop firm tracker so you can monitor evaluations, payouts, accounts, drawdown limits, and rule discipline in one place.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {FAQS.map((item, index) => {
        const open = openIndex === index;

        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-[#1c2235] bg-[#0c1018]"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? -1 : index)}
            >
              <span className="font-body text-[15px] sm:text-base font-medium text-[#e8edf5]">
                {item.q}
              </span>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#1c2235] font-mono transition-transform duration-300 ${open ? "text-[#00ff88]" : "text-[#4a5568]"}`}
                style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 font-body text-[13px] text-[#8892a4] leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
