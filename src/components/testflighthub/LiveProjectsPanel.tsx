import { recentMissions } from "@/lib/survey-operations-mock-data";
import type { ManagedMission } from "@/lib/mission-management-data";
import { cn } from "@/lib/utils";

type LiveProjectsPanelProps = {
  missions?: ManagedMission[];
  compact?: boolean;
};

function statusClass(status: string) {
  switch (status) {
    case "Active":
    case "IN PROGRESS":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Scheduled":
    case "READY":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "Completed":
    case "COMPLETED":
      return "border-white/20 bg-white/10 text-white/60";
    default:
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
  }
}

export default function LiveProjectsPanel({ missions = [], compact = false }: LiveProjectsPanelProps) {
  const liveRecent = recentMissions.filter(
    (mission) => mission.status === "Active" || mission.status === "Scheduled",
  );
  const liveManaged = missions.filter(
    (mission) => mission.status === "IN PROGRESS" || mission.status === "READY",
  );

  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
            Field Operations
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Live Projects</h2>
          {!compact && (
            <p className="mt-2 text-sm text-white/55">
              Active and scheduled work across European survey hubs.
            </p>
          )}
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          {liveRecent.length + liveManaged.length} live
        </span>
      </div>

      <div className={cn("mt-6 grid gap-4", compact ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3")}>
        {liveRecent.map((project) => (
          <article
            key={project.name}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{project.name}</h3>
                <p className="mt-1 text-xs text-white/45">{project.client}</p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]",
                  statusClass(project.status),
                )}
              >
                {project.status}
              </span>
            </div>
            <p className="mt-3 font-mono text-xs text-white/55">{project.date}</p>
            <p className="mt-2 text-[11px] text-white/35">Regional survey programme</p>
          </article>
        ))}

        {liveManaged.map((mission) => (
          <article
            key={mission.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{mission.name}</h3>
                <p className="mt-1 text-xs text-white/45">
                  {mission.client} · {mission.site}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]",
                  statusClass(mission.status),
                )}
              >
                {mission.paused && mission.status === "IN PROGRESS" ? "Paused" : mission.status}
              </span>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/45">
                <span>Progress</span>
                <span className="font-mono text-white/70">{mission.progressPct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                  style={{ width: `${mission.progressPct}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-white/35">
              {mission.droneId} · {mission.operator}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
