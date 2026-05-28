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
        "w-full flex items-center justify-center gap-3 bg-[#111520] border border-[#1c2235] rounded-lg " +
        "px-4 py-3 mb-5 font-mono text-[12px] tracking-[0.08em] text-[#8892a4] " +
        "hover:border-[#2a3350] hover:text-[#e8edf5] hover:bg-[#161b27] transition-all duration-200 " +
        "disabled:opacity-60 disabled:cursor-not-allowed"
      }
    >
      <GoogleIcon size={18} />
      <span className="font-mono uppercase tracking-[0.08em] text-[12px]">
        {pending ? "Redirecting…" : label}
      </span>
    </button>
  );
}
