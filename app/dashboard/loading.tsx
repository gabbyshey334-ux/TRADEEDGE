export default function DashboardLoading() {
  return (
    <div className="animate-fadeInSoft">
      <div className="border-b border-[#1a2030] px-8 py-6">
        <div className="skeleton h-3 w-24 rounded mb-3" />
        <div className="skeleton h-9 w-48 rounded" />
        <div className="skeleton h-3 w-36 rounded mt-3" />
      </div>
      <div className="px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-6"
            >
              <div className="skeleton h-3 w-20 rounded mb-4" />
              <div className="skeleton h-10 w-28 rounded" />
              <div className="skeleton h-3 w-24 rounded mt-3" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-6 h-64">
          <div className="skeleton h-3 w-28 rounded mb-4" />
          <div className="skeleton h-full w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-6 space-y-3">
          <div className="skeleton h-8 w-full rounded" />
          <div className="skeleton h-8 w-full rounded" />
          <div className="skeleton h-8 w-5/6 rounded" />
        </div>
      </div>
    </div>
  );
}
