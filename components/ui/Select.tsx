"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: ReadonlyArray<string | { value: string; label: string }>;
  error?: string | null;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, id, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[10px] uppercase tracking-[0.18em] text-[#5a6580] font-mono"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative w-full rounded-lg bg-[#080b11] border border-[#1a2030]",
            "transition-colors duration-150",
            "focus-within:border-[#00e5b0] focus-within:ring-1 focus-within:ring-[#00e5b0]/20",
            error && "border-[#ff4d6d] focus-within:border-[#ff4d6d] focus-within:ring-[#ff4d6d]/20"
          )}
        >
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none bg-transparent px-4 py-3 pr-10 text-sm text-[#e8edf5] font-mono",
              "focus:outline-none cursor-pointer",
              className
            )}
            {...props}
          >
            {options.map((opt) => {
              const value = typeof opt === "string" ? opt : opt.value;
              const label = typeof opt === "string" ? opt : opt.label;
              return (
                <option key={value} value={value} className="bg-[#0c1018] text-[#e8edf5]">
                  {label}
                </option>
              );
            })}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6580]"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="currentColor"
            aria-hidden
          >
            <path d="M0 0l5 6 5-6z" />
          </svg>
        </div>
        {error && <span className="text-[10px] text-[#ff4d6d] font-mono">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
