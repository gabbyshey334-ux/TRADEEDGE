interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-[#1a2030] px-8 py-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#00e5b0] font-mono mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-4xl tracking-wide text-[#e8edf5] leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[10px] text-[#5a6580] font-mono mt-2 uppercase tracking-[0.22em]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
