import { PageHeader } from "@/components/PageHeader";
import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

function parsePlan(value: unknown): Plan {
  if (value === "pro" || value === "elite" || value === "starter") {
    return value;
  }
  return "starter";
}

export default async function PropFirmTrackerPage() {
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);
  const plan = parsePlan(profile?.plan);
  const unlocked = plan !== "starter" && PLAN_LIMITS[plan].propFirmTracker;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Prop Firm Tracker"
        eyebrow="Workspace"
        subtitle="Track evaluations, payouts, and firm rules in one place"
      />

      <div className="dashboard-page">
        <div className="relative min-h-[420px]">
          {unlocked ? (
            <div
              className="rounded-lg border border-[#1a2030] overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, #0c1018 0%, #0a0d14 100%)",
              }}
            >
              <div className="px-5 sm:px-8 py-8 sm:py-10 min-h-[360px] flex flex-col items-center justify-center text-center">
                <p className="text-[13px] text-[#a0afc0] font-sans max-w-md leading-relaxed">
                  Add prop firm accounts and monitor challenge progress from
                  this dashboard.
                </p>
              </div>
            </div>
          ) : (
            <LockedFeaturePanel message="Prop Firm Tracker is available on Pro and Elite plans" />
          )}
        </div>
      </div>
    </div>
  );
}
