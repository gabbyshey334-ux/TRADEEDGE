interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#1a2030] px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#00e5b0] font-mono mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl sm:text-4xl tracking-wide text-[#e8edf5] leading-none break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[10px] text-[#5a6580] font-mono mt-2 uppercase tracking-[0.22em] line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
