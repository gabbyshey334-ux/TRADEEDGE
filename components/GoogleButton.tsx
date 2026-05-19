"use client";

import { useTransition } from "react";
import { signInWithGoogle } from "@/lib/auth/client";
import { GoogleIcon } from "@/components/GoogleIcon";

interface GoogleButtonProps {
  label?: string;
}

export function GoogleButton({ label = "Continue with Google" }: GoogleButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await signInWithGoogle();
          if (res.ok) window.location.href = res.url;
        })
      }
      className={
        "group w-full h-11 inline-flex items-center justify-center gap-3 rounded-lg " +
        "border border-[#2a3050] bg-[#080b11] text-sm text-[#e8edf5] " +
        "transition-all duration-150 ease-out " +
        "hover:bg-[#0f1420] hover:border-[#3a4570] active:scale-[0.99] " +
        "disabled:opacity-60 disabled:active:scale-100"
      }
    >
      <GoogleIcon size={18} />
      <span className="font-mono font-bold uppercase tracking-[0.18em] text-[11px]">
        {pending ? "Redirecting…" : label}
      </span>
    </button>
  );
}
