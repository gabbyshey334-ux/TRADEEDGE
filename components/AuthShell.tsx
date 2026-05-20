import Link from "next/link";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="auth-vignette relative min-h-screen w-full flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-backdrop opacity-30 pointer-events-none" aria-hidden />

      <div className="relative w-full max-w-md animate-fadeIn">
        <div
          className="relative rounded-2xl border border-[#1a2030] bg-[#0c1018] p-6 sm:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                "linear-gradient(to right, transparent, #00e5b0, transparent)",
            }}
          />

          <Link href="/" className="block text-center mb-8 group">
            <div className="font-heading text-3xl tracking-[0.14em] leading-none">
              <span className="text-[#e8edf5]">TRADE</span>
              <span className="text-[#00e5b0]">EDGE</span>
            </div>
            <div className="mt-2 text-[9px] uppercase tracking-[0.4em] text-[#5a6580] font-mono">
              AI · Journal Suite
            </div>
          </Link>

          <div className="mb-7">
            <h1 className="font-heading text-3xl tracking-wide text-[#e8edf5] leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm text-[#8892a4] font-mono leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-[#8892a4] font-mono">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
