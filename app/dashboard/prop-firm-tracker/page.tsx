import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { createCheckoutSession } from "@/lib/actions/billing";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

async function upgradeToPro() {
  "use server";
  const { url } = await createCheckoutSession("pro");
  redirect(url);
}

export default async function PropFirmTrackerPage() {
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);
  const plan: Plan = ((profile?.plan as Plan | undefined) ?? "starter") as Plan;
  const unlocked = PLAN_LIMITS[plan].propFirmTracker;

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
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg",
                "bg-[#06080d]/90 backdrop-blur-sm border border-[#1a2030]",
                "px-6 py-12 text-center"
              )}
            >
              <LockIcon />
              <p
                className="max-w-md font-mono font-bold uppercase text-[#8892a4]"
                style={{ fontSize: "10px", letterSpacing: "0.24em" }}
              >
                Prop Firm Tracker is available on Pro and Elite plans.
              </p>
              <form action={upgradeToPro}>
                <button
                  type="submit"
                  className={cn(
                    "h-9 px-4 rounded-sm",
                    "font-mono font-bold uppercase text-[#06080d]",
                    "bg-[#00e5b0] hover:bg-[#00f5be]",
                    "shadow-[0_0_18px_rgba(0,229,176,0.35)]",
                    "transition-all active:scale-[0.98]"
                  )}
                  style={{ fontSize: "10px", letterSpacing: "0.22em" }}
                >
                  Upgrade to Pro
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="11"
        width="16"
        height="10"
        rx="2"
        stroke="#8892a4"
        strokeWidth="1.6"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="#8892a4"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
