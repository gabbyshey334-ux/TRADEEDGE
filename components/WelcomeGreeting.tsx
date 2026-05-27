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

function formatDayLine(date: Date): string {
  const weekday = date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const day = date.getDate();
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const greeting = greetingFor(date.getHours()).toUpperCase();
  return `${weekday}, ${day} ${month} · ${greeting}`;
}

export function WelcomeGreeting({ name }: WelcomeGreetingProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeText = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "—:—:—";

  const dayLine = now ? formatDayLine(now) : "—";
  const firstName = name.split(" ")[0] || name;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="font-mono text-[11px] tracking-[0.15em] text-[#4a5568] uppercase">
          {dayLine}
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-[#e8edf5] leading-tight">
          Welcome back,{" "}
          <span className="text-[#00ff88] glow-green-text">{firstName}</span>
        </h2>
      </div>

      <div className="ml-auto text-right">
        <div className="font-mono text-2xl text-[#e8edf5] tracking-tight tabular-nums">
          {timeText}
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-1.5">
          <span className="pulse-dot animate-pulse shrink-0" aria-hidden />
          <span className="font-mono text-[9px] text-[#00ff88] tracking-widest uppercase">
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
