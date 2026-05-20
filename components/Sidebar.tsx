"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOutClient } from "@/lib/auth/client";
import {
  createCheckoutSession,
  createPortalSession,
} from "@/lib/actions/billing";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

interface SidebarUser {
  name: string;
  email: string;
  plan: Plan;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: DashIcon },
  { href: "/dashboard/journal", label: "Journal", icon: JournalIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartIcon },
  { href: "/dashboard/risk", label: "Risk Calc", icon: CalcIcon },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalIcon },
  { href: "/dashboard/ai", label: "AI Coach", icon: AiIcon },
] as const;

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "T";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

const PLAN_PILL: Record<
  Plan,
  { label: string; className: string; style?: React.CSSProperties }
> = {
  starter: {
    label: "Starter",
    className:
      "bg-[#1a2030] text-[#8892a4] border border-[#1a2030]",
  },
  pro: {
    label: "Pro",
    className:
      "bg-[#00e5b0]/10 text-[#00e5b0] border border-[#00e5b0]/30",
  },
  elite: {
    label: "Elite",
    className:
      "text-[#06080d] border border-transparent font-bold",
    style: {
      background: "linear-gradient(135deg, #b466ff 0%, #f0c040 100%)",
    },
  },
};

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [billingPending, setBillingPending] = useState<"checkout" | "portal" | null>(
    null
  );
  const [billingError, setBillingError] = useState<string | null>(null);

  const initials = initialsFor(user.name || user.email || "Trader");
  const pill = PLAN_PILL[user.plan];

  async function handleUpgrade() {
    setBillingError(null);
    setBillingPending("checkout");
    try {
      const { url } = await createCheckoutSession("pro");
      router.push(url);
    } catch (err) {
      setBillingError(
        err instanceof Error ? err.message : "Failed to start checkout."
      );
      setBillingPending(null);
    }
  }

  async function handleBilling() {
    setBillingError(null);
    setBillingPending("portal");
    try {
      const { url } = await createPortalSession();
      router.push(url);
    } catch (err) {
      setBillingError(
        err instanceof Error ? err.message : "Failed to open billing portal."
      );
      setBillingPending(null);
    }
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col bg-[#080b11] border-r border-[#1a2030]"
      style={{ width: 220 }}
    >
      <div className="px-5 pt-7 pb-5 border-b border-[#1a2030]">
        <Link href="/dashboard" className="block group">
          <div className="font-heading text-2xl tracking-[0.14em] leading-none">
            <span className="text-[#e8edf5]">TRADE</span>
            <span className="text-[#00e5b0]">EDGE</span>
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-[0.4em] text-[#5a6580] font-mono">
            AI · Journal Suite
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-mono tracking-wide",
                "transition-all duration-150",
                active
                  ? "bg-[#0c1018] text-[#00e5b0]"
                  : "text-[#5a6580] hover:text-[#e8edf5] hover:bg-[#0c1018]"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-sm bg-[#00e5b0] shadow-[0_0_10px_rgba(0,229,176,0.6)]"
                />
              )}
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1a2030] p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#0c1018]">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-bold text-[#06080d]"
            style={{
              background:
                "linear-gradient(135deg, #00e5b0 0%, #0066ff 100%)",
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#e8edf5]">
              {user.name}
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] uppercase tracking-[0.22em] font-mono font-bold",
                  pill.className
                )}
                style={pill.style}
              >
                {pill.label}
              </span>
            </div>
          </div>
        </div>

        {user.plan === "starter" && (
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={billingPending !== null}
            className={cn(
              "mt-3 w-full h-9 rounded-lg",
              "text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#06080d]",
              "transition-all duration-150",
              "bg-[#00e5b0] hover:bg-[#00f5be]",
              "shadow-[0_0_18px_rgba(0,229,176,0.35)]",
              "active:scale-[0.98] disabled:opacity-60"
            )}
          >
            {billingPending === "checkout" ? "Loading…" : "Upgrade to Pro →"}
          </button>
        )}

        {(user.plan === "pro" || user.plan === "elite") && (
          <button
            type="button"
            onClick={handleBilling}
            disabled={billingPending !== null}
            className={cn(
              "mt-3 w-full h-9 rounded-lg border border-[#1a2030]",
              "text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#8892a4]",
              "transition-all duration-150",
              "hover:text-[#00e5b0] hover:border-[#00e5b0]/40 hover:bg-[#00e5b0]/[0.04]",
              "active:scale-[0.98] disabled:opacity-60"
            )}
          >
            {billingPending === "portal" ? "Loading…" : "Billing"}
          </button>
        )}

        {billingError && (
          <div className="mt-2 text-[9px] font-mono uppercase tracking-[0.22em] text-[#ff4d6d]">
            {billingError}
          </div>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await signOutClient();
              window.location.href = "/signed-out";
            })
          }
          className={cn(
            "mt-2 w-full h-9 rounded-lg border border-[#1a2030]",
            "text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#8892a4]",
            "transition-all duration-150",
            "hover:text-[#ff4d6d] hover:border-[#ff4d6d]/40 hover:bg-[#ff4d6d]/[0.04]",
            "active:scale-[0.98] disabled:opacity-50"
          )}
        >
          {pending ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}

function DashIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" stroke={c} strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" stroke={c} strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" stroke={c} strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" stroke={c} strokeWidth="1.6" />
    </svg>
  );
}
function JournalIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"
        stroke={c}
        strokeWidth="1.6"
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ChartIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 20h18" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M6 16V9M11 16V5M16 16v-7M21 16v-4"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CalcIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={c} strokeWidth="1.6" />
      <path
        d="M8 7h8M8 12h2M12 12h4M8 17h2M12 17h4"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CalIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.6" />
      <path
        d="M3 10h18M8 3v4M16 3v4"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function AiIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.39 4.84L20 8l-4.34 3.78L17 18l-5-2.84L7 18l1.34-6.22L4 8l5.61-1.16L12 2z"
        stroke={c}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
