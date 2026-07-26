import { requireAuthUser } from "@/lib/auth/server";
import { CongressTradesTable } from "@/components/CongressTradesTable";

export const dynamic = "force-dynamic";

export default async function CongressionalTradesPage() {
  await requireAuthUser();

  return (
    <div className="animate-fadeIn">
      <div className="border-b border-[#1c2235] pb-6 mb-6">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
          RESEARCH
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold text-[#e8edf5]">
          Congressional Trades
        </h1>
        <p className="mt-2 font-mono text-[11px] text-[#4a5568] uppercase">
          US Congressional Stock Disclosures (STOCK Act)
        </p>
      </div>

      <div className="dashboard-page">
        <CongressTradesTable />
      </div>
    </div>
  );
}
