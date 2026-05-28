"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("te_sidebar");
    return stored === null ? true : stored === "true";
  });
  const [signingOut, startSignOut] = useTransition();
  const [, startSyncPlan] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";

  useEffect(() => {
    if (!upgraded) return;
    startSyncPlan(async () => {
      const result = await syncSubscriptionFromStripe();
      if (!result.ok) {
        console.error("[DashboardShell] Plan sync after upgrade failed:", result.error);
        return;
      }
      router.replace(pathname);
      router.refresh();
    });
  }, [upgraded, pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function handleSidebarToggle() {
    setSidebarOpen((o) => {
      const next = !o;
      localStorage.setItem("te_sidebar", String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-[#e8edf5]">
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between",
          "border-b border-[#1a2030] bg-[#080b11]/95 backdrop-blur-md px-4",
          "lg:hidden"
        )}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2030] text-[#e8edf5] hover:bg-[#0c1018]"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <Link href="/dashboard" className="font-heading text-xl tracking-[0.12em]">
          <span className="text-[#e8edf5]">TRADE</span>
          <span className="text-[#00e5b0]">EDGE</span>
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
            "flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2030]",
            "text-[#5a6580] hover:text-[#ff4d6d] hover:border-[#ff4d6d]/30 hover:bg-[#ff4d6d]/[0.04]",
            "transition-colors disabled:opacity-50"
          )}
          aria-label={signingOut ? "Signing out" : "Sign out"}
        >
          <SignOutIcon />
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        mobileOpen={menuOpen}
        onNavigate={() => setMenuOpen(false)}
      />

      <main
        className={cn(
          "min-h-screen px-8 pt-14 lg:pt-8 transition-all duration-300 ease-in-out",
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
