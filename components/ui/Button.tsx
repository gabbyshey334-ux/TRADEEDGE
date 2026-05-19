"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: cn(
    "bg-[#00e5b0] text-[#06080d] border border-[#00e5b0]",
    "hover:brightness-110 hover:shadow-[0_0_16px_rgba(0,229,176,0.35)]",
    "active:scale-[0.98]"
  ),
  secondary: cn(
    "bg-transparent text-[#8892a4] border border-[#1a2030]",
    "hover:text-[#e8edf5] hover:border-[#2a3050] hover:bg-[#0f1420]"
  ),
  ghost: cn(
    "bg-transparent text-[#8892a4] border border-transparent",
    "hover:text-[#e8edf5] hover:bg-[#0f1420]"
  ),
  danger: cn(
    "bg-[#ff4d6d] text-white border border-[#ff4d6d]",
    "hover:brightness-110 hover:shadow-[0_0_16px_rgba(255,77,109,0.3)]",
    "active:scale-[0.98]"
  ),
  outline: cn(
    "bg-transparent text-[#e8edf5] border border-[#2a3050]",
    "hover:bg-[#0f1420] hover:border-[#3a4570]"
  ),
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[10px]",
  md: "h-10 px-5 text-xs",
  lg: "h-12 px-7 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className, children, type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-mono font-bold uppercase tracking-[0.18em]",
          "transition-all duration-150 ease-out",
          "disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
