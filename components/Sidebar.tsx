"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { signOutClient } from "@/lib/auth/client";
import { createCheckoutSession } from "@/lib/actions/billing";
import {
  handleBillingActionResult,
  PAYMENT_COMING_SOON_MESSAGE,
} from "@/lib/billing-client";
import { PlanUpgradeModal } from "@/components/PlanUpgradeModal";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

/** Shown when Pro/Elite was granted without Stripe (no_customer from portal action). */
const MANUAL_BILLING_NOTICE =
  "Your plan is managed directly. Contact support to manage billing.";

export interface SidebarUser {
  name: string;
  email: string;
  plan: Plan;
  hasStripeBilling: boolean;
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
  { href: "/dashboard/billing", label: "Billing", icon: BillingIcon },
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
      "bg-[#111520] border border-[#1c2235] text-[#4a5568] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded",
  },
  pro: {
    label: "Pro",
    className:
      "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded",
  },
  elite: {
    label: "Elite",
    className:
      "bg-gradient-to-r from-[#a78bfa] to-[#f59e0b] text-[#080a0f] font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-transparent",
  },
};

export function Sidebar({
  user,
  open,
  onToggle,
}: {
  user: SidebarUser;
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [billingPending, setBillingPending] = useState<"checkout" | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    targetPlan: "pro" | "elite";
    featureName: string;
    featureDescription: string;
  }>({
    open: false,
    targetPlan: "pro",
    featureName: "",
    featureDescription: "",
  });

  const initials = initialsFor(user.name || user.email || "Trader");
  const pill = PLAN_PILL[user.plan];
  const expanded = open;
  const avatarTooltip = `${user.name} · ${pill.label}`;

  function handleNavClick() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onToggle();
    }
  }

  async function handleUpgrade() {
    setBillingError(null);
    setPaymentNotice(null);
    setBillingPending("checkout");
    const result = await createCheckoutSession("pro");
    handleBillingActionResult(result, {
      onSuccess: (url) => {
        window.location.href = url;
      },
      onNotConfigured: () => setPaymentNotice(PAYMENT_COMING_SOON_MESSAGE),
      onError: (msg) => setBillingError(msg || "Failed to start checkout."),
    });
    if (!result.ok) setBillingPending(null);
  }

  function openProUpgradeModal() {
    setUpgradeModal({
      open: true,
      targetPlan: "pro",
      featureName: "Unlock Pro Features",
      featureDescription:
        "Get unlimited trades, AI coaching, Congressional Trades, and Prop Firm Tracker.",
    });
  }

  function openEliteUpgradeModal() {
    setUpgradeModal({
      open: true,
      targetPlan: "elite",
      featureName: "Unlock Elite Features",
      featureDescription:
        "Get unlimited AI reports plus exclusive Elite-only intelligence tools.",
    });
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full flex flex-col overflow-hidden",
        "bg-[#080a0f] border-r border-[#1c2235]",
        "transition-all duration-300 ease-in-out",
        "z-50 lg:z-30",
        open ? "w-[240px] min-w-[240px]" : "w-0 min-w-0 lg:w-[64px] lg:min-w-[64px]"
      )}
    >
      {/* Logo block + collapse toggle */}
      <div
        className={cn(
          "relative shrink-0 pb-4",
          expanded ? "px-3 pt-8" : "px-2 pt-8 flex justify-center"
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-[#4a5568] hover:text-[#e8edf5] hover:bg-[#111520]",
            "transition-all duration-150 cursor-pointer border-0 bg-transparent",
            expanded ? "absolute right-3 top-8" : "relative"
          )}
        >
          {open ? (
            <PanelLeftClose size={16} strokeWidth={1.75} />
          ) : (
            <PanelLeftOpen size={16} strokeWidth={1.75} />
          )}
        </button>

        {expanded && (
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className="block px-3 pr-12 transition-all duration-200"
          >
            <div className="font-display font-bold text-[22px] leading-none tracking-tight">
              <span className="text-[#e8edf5]">TRADE</span>
              <span className="text-[#00ff88]">EDGE</span>
            </div>
            <div className="mt-2 font-mono text-[10px] text-[#4a5568] tracking-[0.2em] uppercase">
              AI · JOURNAL SUITE
            </div>
            <hr className="mt-3 border-[#1c2235]" />
          </Link>
        )}
      </div>

      {/* Section label */}
      <div
        className={cn(
          "px-3 pb-1 shrink-0 transition-opacity duration-300",
          expanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden pb-0"
        )}
      >
        <div className="font-mono text-[9px] tracking-[0.25em] text-[#4a5568] uppercase mb-2 px-3">
          WORKSPACE
        </div>
      </div>

      <nav
        className={cn(
          "flex-1 min-h-0 pb-5 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden",
          expanded ? "px-3" : "px-2"
        )}
      >
        {NAV.map((item) => {
          const { href, label, icon: Icon } = item;
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          const showProBadge =
            expanded &&
            "proBadge" in item &&
            item.proBadge &&
            user.plan === "starter";
          return (
            <Link
              key={href}
              href={href}
              title={expanded ? undefined : label}
              onClick={handleNavClick}
              className={cn(
                "group relative flex items-center rounded-lg py-2",
                "font-body text-[13px] transition-all duration-150",
                expanded ? "gap-3 px-3 justify-start" : "px-0 justify-center",
                active
                  ? cn(
                      "bg-[#111520] text-[#e8edf5]",
                      expanded &&
                        "border-l-2 border-[#00ff88] shadow-[inset_2px_0_8px_rgba(0,255,136,0.08)]"
                    )
                  : "text-[#8892a4] hover:bg-[#111520] hover:text-[#e8edf5]"
              )}
            >
              <Icon active={active} />
              <span
                className={cn(
                  "min-w-0 truncate",
                  expanded ? "flex-1 block" : "hidden",
                  active && "font-medium"
                )}
              >
                {label}
              </span>
              {showProBadge && (
                <span className="shrink-0 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded uppercase">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className={cn(
          "shrink-0 border-t border-[#1c2235] py-5",
          expanded ? "px-3" : "px-2"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            expanded ? "gap-3 px-3" : "justify-center px-0"
          )}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00ff88] to-[#0ea5e9] text-[12px] font-mono font-bold text-[#080a0f]"
            title={expanded ? undefined : avatarTooltip}
          >
            {initials}
          </div>
          {expanded && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-body font-medium text-[#e8edf5] text-[13px]">
                {user.name}
              </div>
              <div className="truncate font-mono text-[10px] text-[#4a5568] mt-0.5">
                {user.email}
              </div>
              <div className="mt-1.5">
                {user.plan === "elite" ? (
                  <span
                    className={cn("inline-flex items-center", pill.className)}
                    style={pill.style}
                    title="✓ MAX PLAN"
                  >
                    {pill.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={
                      user.plan === "starter"
                        ? openProUpgradeModal
                        : openEliteUpgradeModal
                    }
                    className={cn(
                      "inline-flex items-center border-0 bg-transparent p-0 cursor-pointer",
                      pill.className,
                      user.plan === "starter" &&
                        "hover:border-[#00ff88]/40 transition-colors duration-150",
                      user.plan === "pro" &&
                        "hover:border-[#f59e0b]/40 transition-colors duration-150"
                    )}
                    style={pill.style}
                  >
                    {pill.label}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {expanded && user.plan === "starter" && (
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={billingPending !== null}
            className={cn(
              "mt-4 w-full h-10 rounded-lg",
              "font-mono font-bold uppercase text-[#080a0f]",
              "transition-all duration-150",
              "bg-[#00ff88] hover:bg-[#00ff88]/90 glow-green",
              "active:scale-[0.98] disabled:opacity-60"
            )}
            style={{ fontSize: "10px", letterSpacing: "0.22em" }}
          >
            {billingPending === "checkout" ? "Loading…" : "Upgrade to Pro →"}
          </button>
        )}

        {expanded && paymentNotice && paymentNotice === MANUAL_BILLING_NOTICE && (
          <p
            className="mt-3 px-3 font-mono text-[10px] text-[#4a5568] italic leading-relaxed"
            role="status"
          >
            {paymentNotice}
          </p>
        )}

        {expanded && paymentNotice && paymentNotice !== MANUAL_BILLING_NOTICE && (
          <div
            className="mt-2 mx-3 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-3 py-2.5 text-[12px] text-[#f59e0b] font-body leading-relaxed"
            role="status"
          >
            {paymentNotice}
          </div>
        )}

        {expanded && billingError && (
          <div
            className="mt-2 mx-3 rounded-xl border border-[#ff3b5c]/20 bg-[#ff3b5c]/10 px-3 py-2.5 text-[12px] text-[#ff3b5c] font-body leading-relaxed"
            role="alert"
          >
            {billingError}
          </div>
        )}

        <button
          type="button"
          disabled={pending}
          title={expanded ? undefined : "Sign Out"}
          onClick={() =>
            startTransition(async () => {
              await signOutClient();
              window.location.href = "/signed-out";
            })
          }
          className={cn(
            "mt-2 rounded-lg border border-transparent",
            "font-mono font-bold uppercase text-[#8892a4]",
            "transition-all duration-150",
            "hover:text-[#ff3b5c] hover:border-[#ff3b5c]/30 hover:bg-[#ff3b5c]/[0.04]",
            "active:scale-[0.98] disabled:opacity-50",
            expanded
              ? "w-full h-10"
              : "mx-auto flex h-10 w-10 items-center justify-center"
          )}
          style={expanded ? { fontSize: "10px", letterSpacing: "0.22em" } : undefined}
        >
          {expanded ? (
            pending ? "Signing out…" : "Sign Out"
          ) : (
            <LogOut size={16} strokeWidth={1.75} aria-hidden />
          )}
        </button>

        {expanded && (
          <div className="mt-4 flex items-center justify-center gap-3 font-mono text-[9px] tracking-[0.24em] text-[#4a5568] uppercase">
            <Link
              href="/privacy"
              onClick={handleNavClick}
              className="transition-all duration-200 hover:text-[#8892a4]"
            >
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/terms"
              onClick={handleNavClick}
              className="transition-all duration-200 hover:text-[#8892a4]"
            >
              Terms
            </Link>
          </div>
        )}
      </div>

      <PlanUpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
        currentPlan={user.plan}
        targetPlan={upgradeModal.targetPlan}
        featureName={upgradeModal.featureName}
        featureDescription={upgradeModal.featureDescription}
      />
    </aside>
  );
}

function DashIcon({ active }: { active: boolean }) {
  const c = active ? "#00ff88" : "#8892a4";
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
  const c = active ? "#00ff88" : "#8892a4";
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
  const c = active ? "#00ff88" : "#8892a4";
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
  const c = active ? "#00ff88" : "#8892a4";
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
  const c = active ? "#00ff88" : "#8892a4";
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
  const c = active ? "#00ff88" : "#8892a4";
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
  const c = active ? "#00ff88" : "#8892a4";
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
function BillingIcon({ active }: { active: boolean }) {
  const c = active ? "#00ff88" : "#8892a4";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" stroke={c} strokeWidth="1.6" />
      <path
        d="M3 10h18M7 15h4"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function PropFirmIcon({ active }: { active: boolean }) {
  const c = active ? "#00ff88" : "#8892a4";
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
