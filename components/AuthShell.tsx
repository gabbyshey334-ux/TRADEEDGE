import Image from "next/image";
import Link from "next/link";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  panel: {
    eyebrow: string;
    headline: string;
    body: string;
    bullets?: string[];
    quote?: string;
  };
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link href="/" className="group flex items-center gap-2.5">
        <Image
          src="/logos/TRADEEDGE.PNG"
          alt="TradeEdge AI"
          width={36}
          height={36}
          className="rounded-md"
        />
        <div className="font-display font-bold text-xl text-[#e8edf5] tracking-tight leading-none">
          <span>TRADE</span>
          <span className="text-[#00ff88]">EDGE</span>
        </div>
      </Link>
      <div className="font-mono text-[9px] tracking-[0.25em] text-[#4a5568] mt-1 uppercase">
        AI · JOURNAL SUITE
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  panel,
}: AuthShellProps) {
  const longHeadline = panel.headline.length > 28;

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#080a0f]">
      {/* Briefing panel, desktop only */}
      <aside className="relative hidden lg:flex lg:w-[45%] flex-col justify-between overflow-hidden bg-[#080a0f] border-r border-[#1c2235] px-12 py-12 xl:px-16">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#00ff88]/[0.04] blur-[120px] pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-[#0ea5e9]/[0.04] blur-[120px] pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-10 max-w-md">
          <BrandMark />

          <div className="space-y-5">
            <p className="font-mono uppercase text-[#00ff88] tracking-[0.25em] text-[10px]">
              {panel.eyebrow}
            </p>
            <h2
              className={
                longHeadline
                  ? "font-display text-3xl font-bold text-[#e8edf5] leading-tight"
                  : "font-display text-4xl font-bold text-[#e8edf5] leading-tight"
              }
            >
              {panel.headline}
            </h2>
            <p className="font-body text-[14px] text-[#8892a4] leading-relaxed">
              {panel.body}
            </p>

            {panel.bullets && panel.bullets.length > 0 ? (
              <ul className="space-y-2.5 pt-1">
                {panel.bullets.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 font-body text-[14px] text-[#8892a4] leading-snug"
                  >
                    <span className="font-mono text-[#00ff88] shrink-0" aria-hidden>
                      ›
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {panel.quote ? (
              <blockquote className="border-l-2 border-[#1c2235] pl-4 mt-2">
                <p className="font-body italic text-[13px] text-[#8892a4] leading-relaxed">
                  {panel.quote}
                </p>
              </blockquote>
            ) : null}
          </div>
        </div>
      </aside>

      {/* Form column, full width on mobile, ~55% on desktop */}
      <section className="relative flex-1 flex items-center justify-center bg-[#0c0f17] px-4 py-12 sm:px-8 lg:px-12">
        <div className="relative z-10 w-full max-w-[420px] animate-fadeIn">
          {/* Logo only when briefing panel is hidden */}
          <BrandMark className="flex flex-col items-center mb-8 lg:hidden" />

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-[#e8edf5] mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="font-body text-[13px] text-[#8892a4]">{subtitle}</p>
            )}
          </div>

          {children}

          {footer && <div className="text-center mt-6">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
