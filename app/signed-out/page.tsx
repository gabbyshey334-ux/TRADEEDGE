import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
const primaryLink =
  "w-full bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[12px] tracking-[0.12em] uppercase py-3.5 rounded-lg hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.25)] transition-all duration-200 inline-flex items-center justify-center";

const secondaryLink =
  "w-full bg-transparent border border-[#1c2235] rounded-lg font-mono text-[11px] tracking-[0.1em] text-[#4a5568] uppercase py-3 mt-2 hover:border-[#2a3350] hover:text-[#8892a4] transition-all duration-200 inline-flex items-center justify-center";

export default function SignedOutPage() {
  return (
    <AuthShell
      title="You're Signed Out"
      subtitle="Your session ended securely."
      footer={
        <Link href="/" className="font-mono text-[10px] tracking-[0.1em] text-[#4a5568] hover:text-[#00ff88] transition-colors duration-150 uppercase">
          ← Return to TradeEdge home
        </Link>
      }
    >
      <div className="flex flex-col items-center text-center gap-6 animate-fadeIn">
        <div className="w-full bg-[#080a0f] border border-[#1c2235] rounded-lg px-5 py-4 mb-1 text-left">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#00ff88] uppercase">
              SESSION TERMINATED
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#4a5568] mt-1">
            Your journal data is saved and secured.
          </p>
        </div>

        <div className="w-full flex flex-col">
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
