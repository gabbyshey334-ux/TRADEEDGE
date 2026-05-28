import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { PLAN_LIMITS, parsePlan } from "@/lib/plan-limits";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { PropFirmClient } from "@/components/PropFirmClient";
import { getPropFirmAccounts } from "@/lib/actions/prop-firms";

export const dynamic = "force-dynamic";

export default async function PropFirmTrackerPage() {
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);
  const plan = parsePlan(profile?.plan) ?? "starter";
  const unlocked = plan !== "starter" && PLAN_LIMITS[plan].propFirmTracker;

  const accountsResult = unlocked
    ? await getPropFirmAccounts()
    : { data: [], error: null };

  return (
    <div className="animate-fadeIn">
      <div className="border-b border-[#1c2235] pb-6 mb-6">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
          WORKSPACE
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold text-[#e8edf5]">
          Prop Firm Tracker
        </h1>
        <p className="mt-2 font-mono text-[11px] text-[#4a5568]">
          Track evaluations, payouts, and firm rules in one place
        </p>
      </div>

      <div className="dashboard-page">
        {unlocked ? (
          <PropFirmClient
            initialAccounts={accountsResult.data ?? []}
            initialError={accountsResult.error}
          />
        ) : (
          <div className="relative min-h-[420px]">
            <LockedFeaturePanel message="Prop Firm Tracker is available on Pro and Elite plans" />
          </div>
        )}
      </div>
    </div>
  );
}
