"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { resetPasswordForEmail } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "");

    startTransition(async () => {
      const res = await resetPasswordForEmail(email);
      if (!res.ok) setError(res.error);
      else setSent(true);
    });
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <p className="font-body text-[13px] text-[#4a5568]">
          <Link href="/login" className="text-[#00ff88] hover:text-[#00ff88]/80 transition-colors duration-150">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="bg-[#00ff88]/[0.06] border border-[#00ff88]/20 rounded-lg px-4 py-4 text-center animate-fadeInSoft">
          <div className="font-mono text-[#00ff88] text-lg">✓</div>
          <div className="font-mono text-[12px] tracking-[0.1em] text-[#00ff88] uppercase">
            RESET LINK SENT
          </div>
          <p className="font-body text-[13px] text-[#8892a4] mt-1">
            Check your inbox and follow the instructions.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full bg-[#080a0f] border border-[#1c2235] rounded-lg px-4 py-3 font-mono text-[13px] text-[#e8edf5] placeholder:text-[#2a3350] outline-none focus:border-[#2a3350] focus:shadow-[0_0_0_1px_rgba(0,255,136,0.08)] transition-all duration-150"
            />
          </Field>

          {error && (
            <div className="bg-[#ff3b5c]/[0.06] border border-[#ff3b5c]/20 rounded-lg px-4 py-3 mb-4 font-mono text-[11px] text-[#ff3b5c]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#00ff88] text-[#080a0f] font-mono font-bold text-[12px] tracking-[0.12em] uppercase py-3.5 rounded-lg mt-1 hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.25)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {pending ? (
              <span className="inline-block w-4 h-4 border-2 border-[#080a0f]/30 border-t-[#080a0f] rounded-full animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="font-mono text-[10px] tracking-[0.15em] text-[#4a5568] uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
