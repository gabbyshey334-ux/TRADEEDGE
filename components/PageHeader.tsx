interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <div
      className="border-b border-[#1a2030] bg-[#080b11]"
      style={{
        backgroundImage:
          "radial-gradient(900px 200px at 10% 0%, rgba(0,229,176,0.04), transparent 70%)",
      }}
    >
      <div className="flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-8 sm:py-7">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p
              className="font-mono uppercase mb-3"
              style={{
                fontSize: "10px",
                letterSpacing: "0.32em",
                color: "#00e5b0",
              }}
            >
              {eyebrow}
            </p>
          ) : (
            <p
              className="font-mono uppercase mb-3"
              style={{
                fontSize: "10px",
                letterSpacing: "0.32em",
                color: "#5a6580",
              }}
            >
              TradeEdge AI
            </p>
          )}
          <h1
            className="font-heading text-[#e8edf5] leading-none break-words"
            style={{
              fontSize: "clamp(32px, 5vw, 44px)",
              letterSpacing: "0.06em",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-3 font-mono uppercase text-[#8892a4] line-clamp-2"
              style={{ fontSize: "11px", letterSpacing: "0.22em" }}
            >
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
    </div>
  );
}
