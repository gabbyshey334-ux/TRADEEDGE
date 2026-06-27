import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  intro: ReactNode;
  sections: LegalSection[];
}

export function LegalLayout({
  eyebrow,
  title,
  effectiveDate,
  intro,
  sections,
}: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-[#06080d] text-[#e8edf5]">
      <header className="border-b border-[#1a2030] bg-[#080b11]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="TradeEdge AI home"
          >
            <Image
              src="/logos/TRADEEDGE.PNG"
              alt="TradeEdge AI"
              width={40}
              height={40}
              className="rounded-xl shadow-[0_0_24px_rgba(0,229,176,0.25)]"
            />
            <span className="font-heading text-xl tracking-[0.1em] text-[#e8edf5]">
              TRADE<span className="text-[#00e5b0]">EDGE</span>
            </span>
          </Link>
          <Link
            href="/"
            className="font-mono uppercase text-[#8892a4] hover:text-[#00e5b0] transition-colors"
            style={{ fontSize: "11px", letterSpacing: "0.22em" }}
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div
          className="font-mono uppercase mb-4"
          style={{ fontSize: "11px", letterSpacing: "0.32em", color: "#00e5b0" }}
        >
          {eyebrow}
        </div>
        <h1
          className="font-heading text-[#e8edf5] leading-[0.92]"
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </h1>
        <p
          className="mt-4 font-mono uppercase text-[#5a6580]"
          style={{ fontSize: "11px", letterSpacing: "0.22em" }}
        >
          Effective date · {effectiveDate}
        </p>

        <div className="mt-8 max-w-none text-[15px] leading-7 text-[#a0afc0] font-sans">
          {intro}
        </div>

        <nav
          aria-label="Table of contents"
          className="mt-10 rounded-lg border border-[#1a2030] bg-[#0c1018] p-5 sm:p-6"
        >
          <div
            className="font-mono uppercase mb-3 text-[#00e5b0]"
            style={{ fontSize: "10px", letterSpacing: "0.32em" }}
          >
            On this page
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-baseline gap-2 text-[14px] text-[#a0afc0] hover:text-[#e8edf5] font-sans transition-colors"
                >
                  <span
                    className="font-mono text-[#5a6580]"
                    style={{ fontSize: "11px" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <div
                className="font-mono uppercase mb-3"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.32em",
                  color: "#00e5b0",
                }}
              >
                Section {String(i + 1).padStart(2, "0")}
              </div>
              <h2
                className="font-heading text-[#e8edf5] leading-tight"
                style={{
                  fontSize: "clamp(26px, 3.4vw, 34px)",
                  letterSpacing: "0.06em",
                }}
              >
                {section.title}
              </h2>
              <div className="mt-4 text-[15px] leading-7 text-[#a0afc0] font-sans space-y-4">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-[#1a2030] pt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="font-mono uppercase text-[#8892a4] hover:text-[#00e5b0] transition-colors"
            style={{ fontSize: "11px", letterSpacing: "0.22em" }}
          >
            ← Back to TradeEdge AI
          </Link>
          <span
            className="font-mono uppercase text-[#3a4560]"
            style={{ fontSize: "10px", letterSpacing: "0.22em" }}
          >
            © 2026 TradeEdge AI
          </span>
        </footer>
      </article>
    </main>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 list-disc pl-5 marker:text-[#3a4560]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalEmail({ address }: { address: string }) {
  return (
    <a
      href={`mailto:${address}`}
      className="font-mono text-[#00e5b0] hover:underline"
    >
      {address}
    </a>
  );
}
