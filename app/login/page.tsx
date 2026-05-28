"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition, useEffect } from "react";
import { signInWithPassword } from "@/lib/auth/client";
import { AuthShell } from "@/components/AuthShell";
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
        <p className="font-body text-[13px] text-[#4a5568]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#00ff88] hover:text-[#00ff88]/80 transition-colors duration-150">
            Create one
          </Link>
        </p>
      }
    >
      <div className="flex flex-col">
        <GoogleButton label="Sign in with Google" />

        <Divider />

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
          <Field label="Password">
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full bg-[#080a0f] border border-[#1c2235] rounded-lg px-4 py-3 font-mono text-[13px] text-[#e8edf5] placeholder:text-[#2a3350] outline-none focus:border-[#2a3350] focus:shadow-[0_0_0_1px_rgba(0,255,136,0.08)] transition-all duration-150"
            />
          </Field>

          <div className="text-right mb-5 -mt-2">
            <Link
              href="/forgot-password"
              className="font-mono text-[10px] tracking-[0.1em] text-[#4a5568] hover:text-[#00ff88] transition-colors duration-150 uppercase"
            >
              Forgot password?
            </Link>
          </div>

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
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex-1 border-t border-[#1c2235]" />
      <span className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] whitespace-nowrap uppercase">
        or continue with email
      </span>
      <div className="flex-1 border-t border-[#1c2235]" />
    </div>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
