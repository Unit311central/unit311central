"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Search } from "lucide-react";

import {
  buildMinutesFromMeetings,
  type AbhiBoardMinutesRecord,
} from "@/lib/abhi/board-portal-data";
import {
  getAbhiBoardMeetingsServerSnapshot,
  getAbhiBoardMeetingsState,
  subscribeAbhiBoardMeetings,
} from "@/lib/abhi/board-meetings-store";
import {
  CorporateSection,
  CorporateStatusPill,
} from "@/components/testflighthub/corporate-ui";
import { cn } from "@/lib/utils";

function useMeetings() {
  return useSyncExternalStore(
    subscribeAbhiBoardMeetings,
    getAbhiBoardMeetingsState,
    getAbhiBoardMeetingsServerSnapshot,
  );
}

function formatMeetingDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function actionStatusClass(status: string) {
  const key = status.toLowerCase();
  if (key.includes("complete")) {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (key.includes("overdue") || key.includes("blocked")) {
    return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  }
  if (key.includes("underway") || key.includes("progress")) {
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  }
  return "border-white/15 bg-white/5 text-white/70";
}

function MinutesCard({ record }: { record: AbhiBoardMinutesRecord }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/8 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{record.title}</h2>
          <p className="mt-1 text-sm text-white/45">{formatMeetingDate(record.meetingDate)}</p>
        </div>
        <CorporateStatusPill className="border-emerald-400/30 bg-emerald-500/15 text-emerald-100">
          {record.status}
        </CorporateStatusPill>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/75">{record.minutesSummary}</p>

      {record.attendees.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Attendees
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {record.attendees.map((person) => (
              <span
                key={`${person.name}-${person.role ?? ""}`}
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/70"
              >
                {person.name}
                {person.role ? <span className="text-white/40"> · {person.role}</span> : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {record.agenda.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Agenda covered
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-white/70">
            {record.agenda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {record.resolutions.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Resolutions
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-white/75">
            {record.resolutions.map((resolution) => (
              <li key={resolution}>{resolution}</li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/8">
        <p className="border-b border-white/8 bg-black/20 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Decisions
        </p>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.12em] text-white/40">
            <tr>
              <th className="px-3 py-2.5 font-medium">Ref</th>
              <th className="px-3 py-2.5 font-medium">Decision</th>
              <th className="px-3 py-2.5 font-medium">Resolution</th>
            </tr>
          </thead>
          <tbody>
            {record.decisions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-3 text-white/40">
                  None recorded.
                </td>
              </tr>
            ) : (
              record.decisions.map((decision) => (
                <tr key={decision.id} className="border-t border-white/8 align-top text-white/75">
                  <td className="px-3 py-3 font-mono text-xs text-white/50">{decision.id}</td>
                  <td className="px-3 py-3 text-white/85">{decision.text}</td>
                  <td className="px-3 py-3 text-white/55">{decision.resolution ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/8">
        <p className="border-b border-white/8 bg-black/20 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Actions & owners
        </p>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.12em] text-white/40">
            <tr>
              <th className="px-3 py-2.5 font-medium">Ref</th>
              <th className="px-3 py-2.5 font-medium">Action</th>
              <th className="px-3 py-2.5 font-medium">Owner</th>
              <th className="px-3 py-2.5 font-medium">Due</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {record.actions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-white/40">
                  No actions.
                </td>
              </tr>
            ) : (
              record.actions.map((action) => (
                <tr key={action.id} className="border-t border-white/8 align-top text-white/75">
                  <td className="px-3 py-3 font-mono text-xs text-white/50">{action.id}</td>
                  <td className="px-3 py-3 text-white/85">{action.title}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{action.owner}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-white/55">
                    {formatMeetingDate(action.dueDate)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        actionStatusClass(action.status),
                      )}
                    >
                      {action.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function AbhiBoardMinutesWorkspace() {
  const { meetings } = useMeetings();
  const records = useMemo(() => buildMinutesFromMeetings(meetings), [meetings]);
  const [q, setQ] = useState("");
  const filtered = records.filter((r) => {
    const hay =
      `${r.title} ${r.minutesSummary} ${r.agenda.join(" ")} ${r.attendees.map((a) => a.name).join(" ")} ${r.decisions.map((d) => d.text).join(" ")} ${r.resolutions.join(" ")} ${r.actions.map((a) => `${a.owner} ${a.title}`).join(" ")}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div className="space-y-5 p-2 sm:p-4">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f9a8d4]/80">
          ABHI · Board
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Minutes & Decisions
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Structured minutes with decisions, resolutions, and action register per held meeting.
        </p>
      </header>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search minutes, decisions, owners…"
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#C2185B]/50"
        />
      </label>

      <CorporateSection
        title="Meeting minutes"
        subtitle="One card per held board meeting — attendance, agenda, decisions, and follow-up actions."
      >
        <div className="space-y-4">
          {filtered.map((record) => (
            <MinutesCard key={record.id} record={record} />
          ))}
          {filtered.length === 0 ? (
            <p className="text-sm text-white/45">No minutes match your search.</p>
          ) : null}
        </div>
      </CorporateSection>
    </div>
  );
}
