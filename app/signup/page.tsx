"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUpWithPassword } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
        setSuccess(
          "Account created. Check your email to confirm, then sign in with the password you just chose."
        );
        return;
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
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[#00e5b0] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <GoogleButton label="Sign up with Google" />

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-[#1a2030]" />
          <span className="px-4 text-[9px] uppercase tracking-[0.32em] text-[#5a6580] font-mono">
            or continue with email
          </span>
          <div className="flex-1 border-t border-[#1a2030]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="full_name"
            type="text"
            label="Full Name"
            placeholder="Alex Trader"
            autoComplete="name"
            required
          />
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
            required
          />

          {success && (
            <div className="animate-fadeInSoft rounded-lg border border-[#00e5b0]/40 bg-[#00e5b0]/[0.06] px-4 py-3 text-xs text-[#00e5b0] font-mono leading-relaxed">
              {success}
            </div>
          )}

          {error && (
            <div className="animate-fadeInSoft rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono">
              {error}
            </div>
          )}

          <Button type="submit" disabled={pending} fullWidth size="lg">
            {pending ? "Creating account…" : "Create Account"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
