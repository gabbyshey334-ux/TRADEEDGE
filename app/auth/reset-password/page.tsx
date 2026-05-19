"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePassword } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
      title="Set New Password"
      subtitle="Choose a strong password you haven't used elsewhere."
      footer={
        <Link href="/login" className="text-[#00e5b0] hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          name="password"
          type="password"
          label="New Password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <Input
          name="confirm"
          type="password"
          label="Confirm Password"
          placeholder="Repeat new password"
          autoComplete="new-password"
          minLength={6}
          required
        />

        {error && (
          <div className="animate-fadeInSoft rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono">
            {error}
          </div>
        )}

        <Button type="submit" disabled={pending} fullWidth size="lg">
          {pending ? "Updating…" : "Update Password"}
        </Button>
      </form>
    </AuthShell>
  );
}
