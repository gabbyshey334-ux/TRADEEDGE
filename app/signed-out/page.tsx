import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
const primaryLink =
  "inline-flex items-center justify-center w-full h-12 rounded-lg bg-[#00e5b0] text-[#06080d] font-mono font-bold uppercase tracking-[0.18em] text-xs transition-all duration-150 hover:brightness-110 hover:shadow-[0_0_16px_rgba(0,229,176,0.35)] active:scale-[0.98]";

const secondaryLink =
  "inline-flex items-center justify-center w-full h-12 rounded-lg border border-[#1a2030] text-[#8892a4] font-mono font-bold uppercase tracking-[0.18em] text-xs transition-all duration-150 hover:text-[#e8edf5] hover:border-[#2a3050] hover:bg-[#0f1420] active:scale-[0.98]";

export default function SignedOutPage() {
  return (
    <AuthShell
      title="You're signed out"
      subtitle="Your session ended securely. See you on the next session."
      footer={
        <Link href="/" className="text-[#8892a4] hover:text-[#e8edf5] transition-colors">
          ← Return to TradeEdge home
        </Link>
      }
    >
      <div className="flex flex-col items-center text-center gap-6 animate-fadeIn">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
            style={{ background: "rgba(0, 229, 176, 0.25)" }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#00e5b0]/40 bg-[#00e5b0]/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 12l2 2 4-4"
                stroke="#00e5b0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                stroke="#00e5b0"
                strokeWidth="1.6"
              />
            </svg>
          </div>
        </div>

        <p className="text-sm text-[#8892a4] font-mono leading-relaxed max-w-xs">
          Your journal data is saved. Sign back in anytime to pick up where you left off.
        </p>

        <div className="w-full flex flex-col gap-3">
          <Link href="/login" className={primaryLink}>
            Sign In Again
          </Link>
          <Link href="/" className={secondaryLink}>
            Explore TradeEdge
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
