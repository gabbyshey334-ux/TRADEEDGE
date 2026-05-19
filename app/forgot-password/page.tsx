"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { resetPasswordForEmail } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
      subtitle="We'll email you a secure link to reset your password."
      footer={
        <Link href="/login" className="text-[#00e5b0] hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="animate-fadeInSoft flex flex-col items-center text-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00e5b0]/10 border border-[#00e5b0]/40">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7l8 6 8-6M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M4 7l2-2h12l2 2"
                stroke="#00e5b0"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="font-heading text-2xl tracking-wide text-[#e8edf5]">
              Check your inbox
            </div>
            <p className="mt-2 text-sm text-[#8892a4] font-mono">
              We&apos;ve sent you a secure reset link.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          {error && (
            <div className="animate-fadeInSoft rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono">
              {error}
            </div>
          )}

          <Button type="submit" disabled={pending} fullWidth size="lg">
            {pending ? "Sending…" : "Send Reset Link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
