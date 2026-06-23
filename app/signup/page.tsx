"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUpWithPassword } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const full_name = String(form.get("full_name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const res = await signUpWithPassword({ email, password, full_name });
      if (!res.ok) {
        setError(res.error);
        return;
      }

      if (res.needsEmailConfirmation) {
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq('track', 'CompleteRegistration');
        }
        setSuccess(
          "Account created. Check your email to confirm, then sign in with the password you just chose."
        );
        return;
      }

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq('track', 'CompleteRegistration');
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Start your 14-day trial. No card required."
      footer={
        <p className="font-body text-[13px] text-[#4a5568]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00ff88] hover:text-[#00ff88]/80 transition-colors duration-150">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="flex flex-col">
        <GoogleButton label="Sign up with Google" />

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 border-t border-[#1c2235]" />
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] whitespace-nowrap uppercase">
            or continue with email
          </span>
          <div className="flex-1 border-t border-[#1c2235]" />
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Full Name">
            <input
              name="full_name"
              type="text"
              placeholder="Alex Trader"
              autoComplete="name"
              required
              className="w-full bg-[#080a0f] border border-[#1c2235] rounded-lg px-4 py-3 font-mono text-[13px] text-[#e8edf5] placeholder:text-[#2a3350] outline-none focus:border-[#2a3350] focus:shadow-[0_0_0_1px_rgba(0,255,136,0.08)] transition-all duration-150"
            />
          </Field>
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
          <Field label="Password">
            <input
              name="password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full bg-[#080a0f] border border-[#1c2235] rounded-lg px-4 py-3 font-mono text-[13px] text-[#e8edf5] placeholder:text-[#2a3350] outline-none focus:border-[#2a3350] focus:shadow-[0_0_0_1px_rgba(0,255,136,0.08)] transition-all duration-150"
            />
          </Field>

          {success && (
            <div className="animate-fadeInSoft rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/[0.06] px-4 py-3 text-xs text-[#00ff88] font-mono leading-relaxed mb-4">
              {success}
            </div>
          )}

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
              "Create Account"
            )}
          </button>
        </form>
      </div>
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
