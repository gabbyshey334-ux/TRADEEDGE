"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition, useEffect } from "react";
import { signInWithPassword } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleButton } from "@/components/GoogleButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    startTransition(async () => {
      const res = await signInWithPassword({ email, password });
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
      title="Sign In"
      subtitle="Welcome back. Log in to access your journal."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#00e5b0] hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <GoogleButton label="Sign in with Google" />

        <Divider />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-end -mt-1">
            <Link
              href="/forgot-password"
              className="text-[10px] uppercase tracking-[0.22em] text-[#5a6580] hover:text-[#00e5b0] font-mono transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="animate-fadeInSoft rounded-lg border border-[#ff4d6d]/40 bg-[#ff4d6d]/[0.06] px-4 py-3 text-xs text-[#ff4d6d] font-mono">
              {error}
            </div>
          )}

          <Button type="submit" disabled={pending} fullWidth size="lg">
            {pending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

function Divider() {
  return (
    <div className="relative flex items-center">
      <div className="flex-1 border-t border-[#1a2030]" />
      <span className="px-4 text-[9px] uppercase tracking-[0.32em] text-[#5a6580] font-mono">
        or continue with email
      </span>
      <div className="flex-1 border-t border-[#1a2030]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
