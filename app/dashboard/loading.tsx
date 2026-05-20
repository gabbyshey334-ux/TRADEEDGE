export default function DashboardLoading() {
  return (
    <div className="animate-fadeInSoft">
      <div className="border-b border-[#1a2030] bg-[#080b11] px-4 py-6 sm:px-8 sm:py-7">
        <div className="skeleton h-3 w-24 rounded-sm mb-3" />
        <div className="skeleton h-9 w-48 rounded-sm" />
        <div className="skeleton h-3 w-36 rounded-sm mt-3" />
      </div>
      <div className="dashboard-page space-y-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[#1a2030] border-l-2 bg-[#0c1018] p-5 sm:p-6"
              style={{
                borderLeftColor:
                  ["#00e5b0", "#0066ff", "#b466ff", "#f0c040"][i % 4],
              }}
            >
              <div className="skeleton h-3 w-20 rounded-sm mb-5" />
              <div className="skeleton h-10 w-32 rounded-sm" />
              <div className="skeleton h-3 w-24 rounded-sm mt-4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-5">
          <div className="space-y-5">
            <div className="rounded-lg border border-[#1a2030] bg-[#0c1018] p-6 h-72">
              <div className="skeleton h-3 w-28 rounded-sm mb-4" />
              <div className="skeleton h-full w-full rounded-sm" />
            </div>
            <div className="rounded-sm border border-[#1a2030] bg-[#0c1018] p-5 space-y-3">
              <div className="skeleton h-8 w-full rounded-sm" />
              <div className="skeleton h-8 w-full rounded-sm" />
              <div className="skeleton h-8 w-5/6 rounded-sm" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-lg border border-[#1a2030] bg-[#0c1018] p-5 h-48">
              <div className="skeleton h-3 w-32 rounded-sm mb-3" />
              <div className="skeleton h-4 w-full rounded-sm mt-3" />
              <div className="skeleton h-4 w-5/6 rounded-sm mt-3" />
            </div>
            <div className="rounded-lg border border-[#1a2030] bg-[#0c1018] p-5 h-48">
              <div className="skeleton h-3 w-32 rounded-sm mb-3" />
              <div className="skeleton h-4 w-full rounded-sm mt-3" />
              <div className="skeleton h-4 w-5/6 rounded-sm mt-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
