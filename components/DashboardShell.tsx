"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar, type SidebarUser } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export function DashboardShell({
  user,
  children,
}: {
  user: SidebarUser;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
        <div className="w-10" aria-hidden />
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
        mobileOpen={menuOpen}
        onNavigate={() => setMenuOpen(false)}
      />

      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-[220px]">{children}</main>
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
