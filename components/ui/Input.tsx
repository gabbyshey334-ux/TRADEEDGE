"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] uppercase tracking-[0.18em] text-[#5a6580] font-mono"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "group flex items-center w-full rounded-lg bg-[#080b11] border border-[#1a2030]",
            "transition-colors duration-150",
            "focus-within:border-[#00e5b0] focus-within:ring-1 focus-within:ring-[#00e5b0]/20",
            error && "border-[#ff4d6d] focus-within:border-[#ff4d6d] focus-within:ring-[#ff4d6d]/20"
          )}
        >
          {prefix && (
            <span className="pl-4 pr-2 text-[11px] text-[#5a6580] font-mono uppercase tracking-[0.18em] select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 bg-transparent py-3 text-sm text-[#e8edf5] font-mono",
              "placeholder:text-[#3a4560] focus:outline-none",
              prefix ? "pl-0 pr-4" : "px-4",
              suffix && (prefix ? "pl-0 pr-2" : "pl-4 pr-2"),
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="pr-4 pl-1 text-[11px] text-[#5a6580] font-mono uppercase tracking-[0.18em] select-none">
              {suffix}
            </span>
          )}
        </div>
        {hint && !error && (
          <span className="text-[10px] text-[#5a6580] font-mono">{hint}</span>
        )}
        {error && (
          <span className="text-[10px] text-[#ff4d6d] font-mono">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
