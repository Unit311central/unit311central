import { recentMissions } from "@/lib/survey-operations-mock-data";

function statusClass(status: string) {
  switch (status) {
    case "Active":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Scheduled":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "Completed":
      return "border-white/20 bg-white/10 text-white/60";
    default:
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
  }
}

export default function RecentMissionsPanel() {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">Recent Missions</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["Mission Name", "Client", "Status", "Date"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentMissions.map((mission) => (
              <tr key={mission.name} className="border-b border-white/5">
                <td className="px-3 py-3 font-medium text-white">{mission.name}</td>
                <td className="px-3 py-3 text-white/70">{mission.client}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClass(mission.status)}`}
                  >
                    {mission.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-white/70">{mission.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
