"use client";

import { useEffect, useState } from "react";

interface WelcomeGreetingProps {
  name: string;
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Markets never sleep";
}

export function WelcomeGreeting({ name }: WelcomeGreetingProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now?.getHours() ?? 12;
  const dateText = now
    ? now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const timeText = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const firstName = name.split(" ")[0] || name;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.32em] text-[#00e5b0] font-mono">
          {greetingFor(hour)}
        </div>
        <h2 className="mt-2 font-heading text-3xl tracking-wide text-[#e8edf5] leading-none">
          Welcome back, <span className="text-[#00e5b0]">{firstName}</span>
        </h2>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-[0.24em] text-[#5a6580] font-mono">
          {dateText || "—"}
        </div>
        <div className="mt-1 font-mono text-sm text-[#8892a4]">
          {timeText || "—"}
        </div>
      </div>
    </div>
  );
}
