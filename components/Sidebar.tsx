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

export interface SidebarUser {
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
  {
    href: "/dashboard/congressional-trades",
    label: "Congressional Trades",
    icon: CongressIcon,
    proBadge: true,
  },
  {
    href: "/dashboard/prop-firm-tracker",
    label: "Prop Firm Tracker",
    icon: PropFirmIcon,
    proBadge: true,
  },
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
    className: "bg-[#0c1018] text-[#8892a4] border border-[#1a2030]",
  },
  pro: {
    label: "Pro",
    className:
      "bg-[#00e5b0]/12 text-[#00e5b0] border border-[#00e5b0]/40",
  },
  elite: {
    label: "Elite",
    className: "text-[#06080d] border border-transparent font-bold",
    style: {
      background: "linear-gradient(135deg, #b466ff 0%, #f0c040 100%)",
    },
  },
};

export function Sidebar({
  user,
  mobileOpen = false,
  onNavigate,
}: {
  user: SidebarUser;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
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
      className={cn(
        "fixed top-0 left-0 z-50 flex h-screen w-[232px] max-w-[85vw] flex-col",
        "border-r border-[#1a2030] bg-[#080b11]",
        "transition-transform duration-200 ease-out",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo block with subtle radial halo */}
      <div className="relative px-6 pt-8 pb-6 border-b border-[#1a2030]">
        <div className="sidebar-logo-halo absolute inset-0 pointer-events-none" />
        <Link href="/dashboard" className="relative block group">
          <div className="font-heading text-[24px] tracking-[0.14em] leading-none">
            <span className="text-[#e8edf5]">TRADE</span>
            <span className="text-[#00e5b0]">EDGE</span>
          </div>
          <div
            className="mt-2.5 font-mono uppercase"
            style={{
              fontSize: "9px",
              letterSpacing: "0.42em",
              color: "#5a6580",
            }}
          >
            AI · Journal Suite
          </div>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-6 pt-5 pb-2">
        <div
          className="font-mono uppercase"
          style={{
            fontSize: "9px",
            letterSpacing: "0.32em",
            color: "#3a4560",
          }}
        >
          Workspace
        </div>
      </div>

      <nav className="flex-1 min-h-0 px-3 pb-5 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const { href, label, icon: Icon } = item;
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          const showProBadge =
            "proBadge" in item && item.proBadge && user.plan === "starter";
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-sm px-3.5 py-2.5",
                "font-sans text-[13px] tracking-wide",
                "transition-colors duration-150",
                active
                  ? "bg-[#0c1018] text-[#e8edf5]"
                  : "text-[#5a6580] hover:text-[#e8edf5] hover:bg-[#0c1018]"
              )}
              style={
                active
                  ? {
                      boxShadow:
                        "inset 2px 0 0 #00e5b0, 0 0 24px -8px rgba(0, 229, 176, 0.45)",
                    }
                  : undefined
              }
            >
              <Icon active={active} />
              <span className={cn("flex-1 min-w-0", active && "font-semibold")}>
                {label}
              </span>
              {showProBadge && (
                <span
                  className="shrink-0 rounded-sm px-1.5 py-0.5 font-mono font-bold uppercase"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.22em",
                    backgroundColor: "rgba(0,229,176,0.12)",
                    color: "#00e5b0",
                  }}
                >
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section — pinned below scrollable nav on mobile */}
      <div className="shrink-0 border-t border-[#1a2030] bg-[#06080d]/40 px-4 py-5">
        <div className="flex items-center gap-3 px-1">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[12px] font-mono font-bold text-[#06080d]"
            style={{
              background:
                "linear-gradient(135deg, #00e5b0 0%, #0066ff 100%)",
              boxShadow: "0 0 16px -4px rgba(0,229,176,0.4)",
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#e8edf5] font-sans">
              {user.name}
            </div>
            <div className="mt-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-sm px-2 py-[3px] font-mono font-bold uppercase",
                  pill.className
                )}
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.28em",
                  ...(pill.style ?? {}),
                }}
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
              "mt-4 w-full h-10 rounded-sm",
              "font-mono font-bold uppercase text-[#06080d]",
              "transition-all duration-150",
              "bg-[#00e5b0] hover:bg-[#00f5be]",
              "shadow-[0_0_20px_rgba(0,229,176,0.35)]",
              "active:scale-[0.98] disabled:opacity-60"
            )}
            style={{ fontSize: "10px", letterSpacing: "0.22em" }}
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
              "mt-4 w-full h-10 rounded-sm border border-[#1a2030]",
              "font-mono font-bold uppercase text-[#8892a4]",
              "transition-all duration-150",
              "hover:text-[#00e5b0] hover:border-[#00e5b0]/40 hover:bg-[#00e5b0]/[0.04]",
              "active:scale-[0.98] disabled:opacity-60"
            )}
            style={{ fontSize: "10px", letterSpacing: "0.22em" }}
          >
            {billingPending === "portal" ? "Loading…" : "Billing"}
          </button>
        )}

        {billingError && (
          <div
            className="mt-2 font-mono uppercase text-[#ff4d6d]"
            style={{ fontSize: "9px", letterSpacing: "0.22em" }}
          >
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
            "mt-2 w-full h-10 rounded-sm border border-transparent",
            "font-mono font-bold uppercase text-[#5a6580]",
            "transition-all duration-150",
            "hover:text-[#ff4d6d] hover:border-[#ff4d6d]/30 hover:bg-[#ff4d6d]/[0.04]",
            "active:scale-[0.98] disabled:opacity-50"
          )}
          style={{ fontSize: "10px", letterSpacing: "0.22em" }}
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
function CongressIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 11h6M9 15h6"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function PropFirmIcon({ active }: { active: boolean }) {
  const c = active ? "#00e5b0" : "#5a6580";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke={c} strokeWidth="1.6" />
      <path
        d="M8 7V5a4 4 0 0 1 8 0v2M12 12v4M10 14h4"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
