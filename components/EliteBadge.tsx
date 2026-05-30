export function EliteBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded uppercase ${className}`}
    >
      ★ ELITE
    </span>
  );
}
