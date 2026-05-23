import Image from "next/image";

const LOGOS = [
  { name: "ByBit", src: "/logos/bybit.webp", width: 350, height: 100 },
  { name: "CQG", src: "/logos/cqg.webp", width: 350, height: 100 },
  { name: "Charles Schwab", src: "/logos/charlesschwab.webp", width: 350, height: 100 },
  { name: "cTrader", src: "/logos/ctrader.webp", width: 350, height: 100 },
  { name: "Interactive Brokers", src: "/logos/interactive-brokers.webp", width: 350, height: 100 },
  { name: "MetaTrader 4", src: "/logos/metatrader4.webp", width: 350, height: 100 },
  { name: "MetaTrader 5", src: "/logos/metatrader5.webp", width: 350, height: 100 },
  { name: "NinjaTrader", src: "/logos/ninjatrader.webp", width: 350, height: 100 },
  { name: "Sierra Chart", src: "/logos/sierracharts.webp", width: 350, height: 100 },
  { name: "TradeStation", src: "/logos/tradestation.webp", width: 350, height: 100 },
  { name: "Tradovate", src: "/logos/tradovate.webp", width: 350, height: 100 },
  { name: "Webull", src: "/logos/webull.webp", width: 350, height: 100 },
] as const;

export function TrustLogos() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 md:gap-12">
      <p className="font-mono text-xs uppercase tracking-[0.32em] text-[#5a6580] md:text-sm">
        Trusted by traders at
      </p>
      <div className="grid w-full grid-cols-2 items-center justify-items-center gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-x-8 lg:gap-y-12">
        {LOGOS.map((logo) => (
          <div
            key={logo.name}
            className="flex h-12 w-full max-w-[160px] items-center justify-center sm:h-14 md:h-16 md:max-w-[180px]"
          >
            <Image
              src={logo.src}
              alt={`${logo.name} logo`}
              width={logo.width}
              height={logo.height}
              className="h-full w-auto max-w-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
