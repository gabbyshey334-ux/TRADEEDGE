import Image from "next/image";
import Link from "next/link";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#080a0f] flex items-center justify-center relative overflow-hidden px-4">
      <div
        className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#00ff88]/[0.04] blur-[120px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-[#0ea5e9]/[0.04] blur-[120px] pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[420px] bg-[#0c0f17] border border-[#1c2235] rounded-2xl px-8 py-10 shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
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

        <div className="border-b border-[#1c2235] mb-8 -mx-8" />

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[#e8edf5] mb-1">{title}</h1>
          {subtitle && (
            <p className="font-body text-[13px] text-[#8892a4]">{subtitle}</p>
          )}
        </div>

        {children}

        {footer && <div className="text-center mt-6">{footer}</div>}
      </div>
    </main>
  );
}
