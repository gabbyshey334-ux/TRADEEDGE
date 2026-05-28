"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePassword } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await updatePassword(password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <AuthShell
      title="New Password"
      subtitle="Choose a strong password for your account."
      footer={
        <p className="font-body text-[13px] text-[#4a5568]">
          <Link href="/login" className="text-[#00ff88] hover:text-[#00ff88]/80 transition-colors duration-150">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        <Field label="New Password">
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
        <Field label="Confirm Password">
          <input
            name="confirm"
            type="password"
            placeholder="Repeat new password"
            autoComplete="new-password"
            minLength={6}
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
            "Update Password"
          )}
        </button>
      </form>
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
