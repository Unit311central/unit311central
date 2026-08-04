"use client";

import {
  getCoastalFreightPortalData,
  type OaClientPortalSection,
} from "@/lib/onwardair/client-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  companyName: string;
  section: OaClientPortalSection;
};

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5",
        className,
      )}
    >
      <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StatusChip({
  status,
}: {
  status: string;
}) {
  const tone =
    /ready|completed|resolved|trial/i.test(status)
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : /scheduled|demo|waiting|planning/i.test(status)
        ? "border-sky-400/25 bg-sky-500/10 text-sky-200"
        : /hold|maintenance|open/i.test(status)
          ? "border-amber-400/25 bg-amber-500/10 text-amber-100"
          : "border-white/15 bg-white/5 text-white/70";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", tone)}>
      {status}
    </span>
  );
}

export function OnwardAirClientPortalApp({ companyName, section }: Props) {
  const data = getCoastalFreightPortalData();

  if (section === "fleet") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Fleet & VTOL
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Assigned Vertex aircraft</h1>
          <p className="mt-1 text-sm text-white/50">
            Trial fleet allocated to {companyName} for Gulf Coast middle-mile demonstrations.
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.aircraft.map((ac) => (
            <Panel key={ac.id} title={ac.name}>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-center justify-between gap-2">
                  <span>{ac.type}</span>
                  <StatusChip status={ac.status} />
                </div>
                <p>{ac.location}</p>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-white/45">
                    <span>Utilization</span>
                    <span>{ac.utilizationPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-teal-400"
                      style={{ width: `${ac.utilizationPct}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-white/45">Next: {ac.nextEvent}</p>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  if (section === "missions") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Missions & Corridors
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Programme missions</h1>
          <p className="mt-1 text-sm text-white/50">
            Houston–Galveston–Corpus Christi middle-mile corridor activity.
          </p>
        </header>
        <Panel title="Mission board">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-white/40">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3 font-medium">Mission</th>
                  <th className="py-2 pr-3 font-medium">Corridor</th>
                  <th className="py-2 pr-3 font-medium">Payload</th>
                  <th className="py-2 pr-3 font-medium">Aircraft</th>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.missions.map((m) => (
                  <tr key={m.id} className="border-b border-white/5 text-white/75">
                    <td className="py-2.5 pr-3 font-medium text-white">{m.name}</td>
                    <td className="py-2.5 pr-3">{m.corridor}</td>
                    <td className="py-2.5 pr-3">{m.payload}</td>
                    <td className="py-2.5 pr-3">{m.aircraft}</td>
                    <td className="py-2.5 pr-3">{m.date}</td>
                    <td className="py-2.5">
                      <StatusChip status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  }

  if (section === "documents") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Documents
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Shared data room</h1>
          <p className="mt-1 text-sm text-white/50">
            Controlled artefacts for the {companyName} × OnwardAir Vertex trial.
          </p>
        </header>
        <Panel title="Files">
          <ul className="divide-y divide-white/5">
            {data.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{doc.title}</p>
                  <p className="text-xs text-white/40">
                    {doc.kind} · Updated {doc.updatedAt}
                  </p>
                </div>
                <span className="text-xs text-teal-300/80">View</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (section === "support") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
            Support
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Programme support</h1>
          <p className="mt-1 text-sm text-white/50">
            Tickets routed to OnwardAir Flight Test and account teams.
          </p>
        </header>
        <Panel title="Open items">
          <ul className="divide-y divide-white/5">
            {data.tickets.map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{ticket.subject}</p>
                  <p className="text-xs text-white/40">Updated {ticket.updatedAt}</p>
                </div>
                <StatusChip status={ticket.status} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/70">
          Programme Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{companyName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Vertex VTOL™ middle-mile trial with OnwardAir — FLEX Pod™ cargo demos across the Gulf Coast
          corridor network.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <p className="text-[11px] uppercase tracking-wide text-white/40">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-white/45">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Upcoming missions">
          <ul className="space-y-3">
            {data.missions
              .filter((m) => m.status === "Scheduled" || m.status === "Planning")
              .map((m) => (
                <li key={m.id} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    <StatusChip status={m.status} />
                  </div>
                  <p className="mt-1 text-xs text-white/45">
                    {m.date} · {m.aircraft} · {m.corridor}
                  </p>
                </li>
              ))}
          </ul>
        </Panel>
        <Panel title="Programme notes">
          <ul className="space-y-2 text-sm text-white/65">
            {data.programmeNotes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Fleet snapshot">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.aircraft.map((ac) => (
            <div key={ac.id} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{ac.name}</p>
                <StatusChip status={ac.status} />
              </div>
              <p className="mt-1 text-xs text-white/45">{ac.location}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
