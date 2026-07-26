"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClassName =
  "w-full bg-[#080a0f] border border-[#1c2235] rounded-lg pl-4 pr-11 py-3 font-mono text-[13px] text-[#e8edf5] placeholder:text-[#2a3350] outline-none focus:border-[#2a3350] focus:shadow-[0_0_0_1px_rgba(0,255,136,0.08)] transition-all duration-150";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(inputClassName, className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#8892a4] transition-colors duration-150"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
