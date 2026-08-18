"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
} from "lucide-react";

import {
  canAccessManagementWorkspace,
  getVisibleManagementFunctionPacks,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import {
  MANAGEMENT_ACTIONS,
  MANAGEMENT_MEETINGS,
  MANAGEMENT_SUMMARY,
  UPCOMING_MANAGEMENT_MEETING,
} from "@/lib/central-capabilities/management-placeholder";
import type { ManagementSectionId } from "@/lib/central-capabilities/types";
import {
  WorkspaceEmpty,
  WorkspaceKpiTile,
  WorkspaceSection,
  WorkspaceStatusPill,
  workspaceSecondaryButtonClass,
} from "@/components/workspace-ui";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import { cn } from "@/lib/utils";

import {
  CentralSubnavShell,
  ComingSoonButton,
  PlaceholderBadge,
  type CentralSubnavItem,
} from "./CentralSubnavShell";

const SECTIONS: CentralSubnavItem<ManagementSectionId>[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "meetings", label: "Meetings", icon: CalendarDays },
  { id: "function-packs", label: "Function Packs", icon: Package },
  { id: "actions-decisions", label: "Actions & Decisions", icon: ClipboardList },
];

function readinessClass(status: string) {
  if (status === "ready") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "outstanding") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-white/15 bg-white/[0.05] text-white/60";
}

function ManagementDashboard() {
  const meeting = UPCOMING_MANAGEMENT_MEETING;
  return (
    <>
      <WorkspaceSection
        title="Upcoming management meeting"
        subtitle="Function pack readiness across the management committee."
        actions={<PlaceholderBadge>Placeholder data</PlaceholderBadge>}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-200/80">
              {meeting.name}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{meeting.schedule}</p>
            <p className="mt-2 text-sm text-white/55">{meeting.functionPackLabel}</p>
            <p className="mt-3 text-sm text-white/70">
              {meeting.packsReady} / {meeting.packsTotal} packs ready
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-3 py-2.5">Role</th>
                    <th className="px-3 py-2.5">Function pack</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meeting.readiness.map((row) => (
                    <tr key={row.role} className="border-t border-white/8 text-white/80">
                      <td className="px-3 py-2.5 font-medium text-white">{row.role}</td>
                      <td className="px-3 py-2.5">{row.name}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                            readinessClass(row.status),
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <WorkspaceKpiTile label="Packs ready" value={`${meeting.packsReady}/${meeting.packsTotal}`} />
            <WorkspaceKpiTile
              label="Outstanding"
              value={String(meeting.readiness.filter((r) => r.status === "outstanding").length)}
            />
            <WorkspaceKpiTile label="Last meeting" value={MANAGEMENT_SUMMARY.lastMeeting} valueClassName="text-base sm:text-lg" />
            <WorkspaceKpiTile label="Open actions" value={String(MANAGEMENT_SUMMARY.openActions)} />
            <WorkspaceKpiTile label="Decisions logged" value={String(MANAGEMENT_SUMMARY.decisionsLogged)} />
            <WorkspaceKpiTile label="Overdue actions" value={String(MANAGEMENT_SUMMARY.overdueActions)} />
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-white/50">
          Latest management pack: <span className="text-white/80">{MANAGEMENT_SUMMARY.latestPack}</span>
        </div>
      </WorkspaceSection>
    </>
  );
}

function ManagementMeetingsPanel() {
  return (
    <WorkspaceSection
      title="Meetings"
      subtitle="Recurring management meetings, participants, and pack associations — calendar integration coming later."
    >
      <div className="space-y-3">
        {MANAGEMENT_MEETINGS.map((meeting) => (
          <article
            key={meeting.id}
            className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{meeting.name}</h3>
                <p className="mt-1 text-sm text-white/55">{meeting.schedule}</p>
                <p className="mt-2 text-xs text-white/45">
                  Participants: {meeting.participants.join(" · ")}
                </p>
              </div>
              <WorkspaceStatusPill className="border-sky-400/30 bg-sky-500/10 text-sky-100">
                {meeting.packsReady}/{meeting.packsTotal} packs
              </WorkspaceStatusPill>
            </div>
            <p className="mt-3 text-sm text-white/60">{meeting.functionPackLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ComingSoonButton label="View history" />
            </div>
          </article>
        ))}
      </div>
    </WorkspaceSection>
  );
}

function ManagementFunctionPacksPanel({
  packs,
}: {
  packs: ReturnType<typeof getVisibleManagementFunctionPacks>;
}) {
  return (
    <WorkspaceSection
      title="Function packs"
      subtitle="Structured management artefacts that will pull live data from Unit311 modules. Generation is not enabled in this release."
    >
      {packs.length === 0 ? (
        <WorkspaceEmpty message="No function packs are visible for your role. Contact an administrator if you need access." />
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <article
              key={pack.id}
              className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{pack.title}</h3>
                  <p className="mt-1 text-sm text-white/55">
                    Reporting period: {pack.reportingPeriod}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Last generated: {pack.lastGenerated ?? "Not yet generated"}
                  </p>
                </div>
                <WorkspaceStatusPill className="capitalize">{pack.status}</WorkspaceStatusPill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={workspaceSecondaryButtonClass()}>
                  View
                </button>
                <button type="button" className={workspaceSecondaryButtonClass()}>
                  Edit
                </button>
                <button type="button" className={workspaceSecondaryButtonClass()}>
                  Update
                </button>
                <ComingSoonButton label="Generate" />
              </div>
            </article>
          ))}
        </div>
      )}
    </WorkspaceSection>
  );
}

function ManagementActionsPanel() {
  return (
    <WorkspaceSection
      title="Actions & decisions"
      subtitle="Management actions, owners, due dates, and meeting association — workflow automation coming later."
    >
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2.5">Item</th>
              <th className="px-3 py-2.5">Owner</th>
              <th className="px-3 py-2.5">Due</th>
              <th className="px-3 py-2.5">Meeting</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {MANAGEMENT_ACTIONS.map((row) => (
              <tr key={row.id} className="border-t border-white/8 text-white/80">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-white">{row.title}</p>
                  <p className="text-xs uppercase tracking-wide text-white/40">{row.kind}</p>
                </td>
                <td className="px-3 py-2.5">{row.owner}</td>
                <td className="px-3 py-2.5 tabular-nums">{row.dueDate}</td>
                <td className="px-3 py-2.5">{row.meeting}</td>
                <td className="px-3 py-2.5 capitalize">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WorkspaceSection>
  );
}

export default function ManagementWorkspace() {
  const entitlements = useOperatorEntitlements();
  const access = useMemo(
    () =>
      managementAccessFromEntitlements({
        roleView: entitlements.roleView,
        roles: entitlements.roles,
        departments: entitlements.departments,
      }),
    [entitlements.departments, entitlements.roleView, entitlements.roles],
  );
  const [section, setSection] = useState<ManagementSectionId>("dashboard");
  const packs = useMemo(() => getVisibleManagementFunctionPacks(access), [access]);

  if (!canAccessManagementWorkspace(access)) {
    return (
      <WorkspaceSection
        title="Management"
        subtitle="Central Unit311 management control centre."
      >
        <p className="text-sm text-white/55">
          You do not have permission to view management packs. This area is restricted to
          authorised management roles.
        </p>
      </WorkspaceSection>
    );
  }

  return (
    <CentralSubnavShell
      eyebrow="Unit311 Central · Business Central"
      title="Management"
      subtitle="Management control centre for recurring meetings, function packs, actions, and decisions. Central capability across all workspaces."
      items={SECTIONS}
      activeId={section}
      onSelect={setSection}
    >
      {section === "dashboard" ? <ManagementDashboard /> : null}
      {section === "meetings" ? <ManagementMeetingsPanel /> : null}
      {section === "function-packs" ? <ManagementFunctionPacksPanel packs={packs} /> : null}
      {section === "actions-decisions" ? <ManagementActionsPanel /> : null}
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-xs text-white/45">
        Placeholder shell — live data integrations and automation are marked Coming soon.
      </div>
    </CentralSubnavShell>
  );
}
