"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Sidebar, type SidebarUser } from "@/components/Sidebar";
import { signOutClient } from "@/lib/auth/client";
import { syncSubscriptionFromStripe } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";

export function DashboardShell({
  user,
  children,
}: {
  user: SidebarUser;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [signingOut, startSignOut] = useTransition();
  const [, startSyncPlan] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setSidebarOpen(false);
      return;
    }
    const stored = localStorage.getItem("te_sidebar");
    if (stored !== null) {
      setSidebarOpen(stored === "true");
    }
  }, []);

  useEffect(() => {
    if (!upgraded) return;
    startSyncPlan(async () => {
      const result = await syncSubscriptionFromStripe();
      if (!result.ok) {
        console.error("[DashboardShell] Plan sync after upgrade failed:", result.error);
        return;
      }
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase');
      }
      router.replace(pathname);
      router.refresh();
    });
  }, [upgraded, pathname, router]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const updateOverflow = () => {
      if (!mq.matches && sidebarOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };
    updateOverflow();
    mq.addEventListener("change", updateOverflow);
    return () => {
      document.body.style.overflow = "";
      mq.removeEventListener("change", updateOverflow);
    };
  }, [sidebarOpen]);

  function handleSidebarToggle() {
    setSidebarOpen((o) => {
      const next = !o;
      if (window.innerWidth >= 1024) {
        localStorage.setItem("te_sidebar", String(next));
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-[#e8edf5]">
      <header
        className={cn(
          "sticky top-0 z-20 flex h-14 items-center justify-between px-4 lg:hidden",
          "border-b border-[#1c2235] bg-[#080a0f]"
        )}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "border border-[#1c2235] text-[#e8edf5]",
            "hover:bg-[#111520] transition-all duration-200"
          )}
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-display font-bold text-base tracking-tight"
        >
          <Image
            src="/logos/TRADEEDGE.PNG"
            alt="TradeEdge AI"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span className="text-[#e8edf5]">TRADE</span>
          <span className="text-[#00ff88]">EDGE</span>
        </Link>
        <button
          type="button"
          disabled={signingOut}
          onClick={() =>
            startSignOut(async () => {
              await signOutClient();
              window.location.href = "/signed-out";
            })
          }
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "border border-[#1c2235] text-[#8892a4]",
            "hover:text-[#ff3b5c] hover:border-[#ff3b5c]/30 hover:bg-[#ff3b5c]/[0.04]",
            "transition-all duration-200 disabled:opacity-50"
          )}
          aria-label={signingOut ? "Signing out" : "Sign out"}
        >
          <SignOutIcon />
        </button>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar
        user={user}
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
      />

      <main
        className={cn(
          "min-w-0 min-h-screen px-4 sm:px-6 lg:px-8 pt-14 lg:pt-8",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-[240px]" : "lg:ml-[64px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
