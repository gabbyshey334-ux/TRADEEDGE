import { Sidebar } from "@/components/Sidebar";
import { getSidebarUser } from "@/lib/auth/server";

/** Auth + Supabase — must not run at build time without env vars. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarUser = await getSidebarUser();

  return (
    <div className="min-h-screen bg-[#06080d] text-[#e8edf5]">
      <Sidebar user={sidebarUser} />
      <main className="min-h-screen ml-[220px]">{children}</main>
    </div>
  );
}
