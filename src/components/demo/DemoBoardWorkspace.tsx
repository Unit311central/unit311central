"use client";

import {
  NORTHSTAR_BOARD_ACTIONS,
  NORTHSTAR_BOARD_DIRECTORS,
  NORTHSTAR_BOARD_MEETINGS,
  NORTHSTAR_BOARD_RISKS,
} from "@/lib/demo/board-data";
import {
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
} from "@/components/testflighthub/corporate-ui";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    value,
  );
}

export function DemoBoardDashboardWorkspace() {
  const openActions = NORTHSTAR_BOARD_ACTIONS.filter((a) => a.status !== "closed").length;
  const highRisks = NORTHSTAR_BOARD_RISKS.filter((r) => r.rating === "High" || r.rating === "Critical").length;
  const nextMeeting = NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">Northstar Industrial Technologies — governance overview</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CorporateKpiTile label="Directors" value={String(NORTHSTAR_BOARD_DIRECTORS.length)} hint="Active board" />
        <CorporateKpiTile label="Open actions" value={String(openActions)} hint="From recent meetings" />
        <CorporateKpiTile label="High risks" value={String(highRisks)} hint="Risk register" />
        <CorporateKpiTile
          label="Next meeting"
          value={nextMeeting?.date ?? "TBC"}
          hint={nextMeeting?.title ?? "Board calendar"}
        />
      </div>
      <CorporateSection title="Current priorities">
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
          <li>Margin recovery to 58% gross margin target</li>
          <li>Atlas Monitoring Platform delivery for Sheffield Precision Engineering</li>
          <li>US expansion hiring without burn spike</li>
          <li>Supplier diversification away from Voltex Automation</li>
        </ul>
      </CorporateSection>
    </div>
  );
}

export function DemoBoardMeetingsWorkspace() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Meetings</h1>
        <p className="mt-1 text-sm text-white/60">Historical and upcoming Northstar board meetings</p>
      </header>
      <div className="space-y-4">
        {NORTHSTAR_BOARD_MEETINGS.map((meeting) => (
          <div key={meeting.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-white">{meeting.title}</h2>
              <CorporateStatusPill>{meeting.status}</CorporateStatusPill>
            </div>
            <p className="mt-1 text-sm text-white/55">
              {meeting.date} · {meeting.location}
            </p>
            <p className="mt-3 text-sm text-white/75">{meeting.minutesSummary}</p>
            {meeting.decisions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Key decisions</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
                  {meeting.decisions.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoBoardRisksWorkspace() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Risk Register</h1>
        <p className="mt-1 text-sm text-white/60">Board-level risks for Northstar</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {NORTHSTAR_BOARD_RISKS.map((risk) => (
              <tr key={risk.id} className="border-t border-white/10 text-white/80">
                <td className="px-4 py-3">{risk.title}</td>
                <td className="px-4 py-3">
                  <CorporateStatusPill className="border-rose-400/30 bg-rose-500/15 text-rose-200">
                    {risk.rating}
                  </CorporateStatusPill>
                </td>
                <td className="px-4 py-3">{risk.owner}</td>
                <td className="px-4 py-3 text-white/65">{risk.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DemoBoardMembersWorkspace() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Members</h1>
        <p className="mt-1 text-sm text-white/60">Northstar board of directors</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {NORTHSTAR_BOARD_DIRECTORS.map((director) => (
          <div key={director.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-medium text-white">{director.name}</h2>
            <p className="text-sm text-sky-300/90">{director.role}</p>
            <p className="mt-2 text-sm text-white/65">{director.type} director</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/40">Total raised: {formatGbp(4_500_000)} across 3 rounds</p>
    </div>
  );
}
