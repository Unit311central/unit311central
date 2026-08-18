"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import {
  canAccessManagementWorkspace,
  filterVisibleManagementFunctionPacks,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import { computeManagementSummary } from "@/lib/central-capabilities/management-store";
import type {
  ManagementActionPlaceholder,
  ManagementFunctionPackPlaceholder,
  ManagementMeetingPlaceholder,
  ManagementSectionId,
} from "@/lib/central-capabilities/types";
import type { ManagementFunctionPackRecord } from "@/lib/central-capabilities/management-store";
import {
  WorkspaceEmpty,
  WorkspaceKpiTile,
  WorkspaceSection,
  WorkspaceStatusPill,
  workspaceInputClass,
  workspaceSecondaryButtonClass,
} from "@/components/workspace-ui";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import { cn } from "@/lib/utils";

import {
  CentralSubnavShell,
  type CentralSubnavItem,
} from "./CentralSubnavShell";
import { useManagementStore } from "./useManagementStore";

const SECTIONS: CentralSubnavItem<ManagementSectionId>[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "meetings", label: "Meetings", icon: CalendarDays },
  { id: "function-packs", label: "Function Packs", icon: Package },
  { id: "actions-decisions", label: "Actions & Decisions", icon: ClipboardList },
];

const MANAGEMENT_SUBTITLE =
  "Recurring meetings, function packs, actions, and decisions for your management committee.";

function readinessClass(status: string) {
  if (status === "ready") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "outstanding") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-white/15 bg-white/[0.05] text-white/60";
}

function actionStatusClass(status: ManagementActionPlaceholder["status"]) {
  if (status === "complete") return "text-emerald-200";
  if (status === "overdue") return "text-amber-200";
  return "text-white/75";
}

function ManagementDashboard({
  meetings,
  actions,
  functionPacks,
}: {
  meetings: ManagementMeetingPlaceholder[];
  actions: ManagementActionPlaceholder[];
  functionPacks: ManagementFunctionPackPlaceholder[];
}) {
  const summary = computeManagementSummary({ meetings, actions, functionPacks });
  const meeting = meetings[0];

  if (!meeting) {
    return (
      <WorkspaceSection title="Upcoming management meeting" subtitle="Add a meeting to track pack readiness.">
        <WorkspaceEmpty message="No meetings yet. Use the Meetings tab to add your first management meeting." />
      </WorkspaceSection>
    );
  }

  return (
    <WorkspaceSection
      title="Upcoming management meeting"
      subtitle="Function pack readiness across the management committee."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-200/80">{meeting.name}</p>
          <p className="mt-2 text-lg font-semibold text-white">{meeting.schedule}</p>
          <p className="mt-2 text-sm text-white/55">{meeting.functionPackLabel}</p>
          <p className="mt-3 text-sm text-white/70">
            {meeting.packsReady} / {meeting.packsTotal} packs ready
          </p>
          {meeting.readiness.length > 0 ? (
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
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <WorkspaceKpiTile label="Packs ready" value={`${meeting.packsReady}/${meeting.packsTotal}`} />
          <WorkspaceKpiTile
            label="Outstanding"
            value={String(meeting.readiness.filter((row) => row.status === "outstanding").length)}
          />
          <WorkspaceKpiTile label="Last meeting" value={summary.lastMeeting} valueClassName="text-base sm:text-lg" />
          <WorkspaceKpiTile label="Open actions" value={String(summary.openActions)} />
          <WorkspaceKpiTile label="Decisions logged" value={String(summary.decisionsLogged)} />
          <WorkspaceKpiTile label="Overdue actions" value={String(summary.overdueActions)} />
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-white/50">
        Latest management pack: <span className="text-white/80">{summary.latestPack}</span>
      </div>
    </WorkspaceSection>
  );
}

type MeetingDraft = {
  id?: string;
  name: string;
  schedule: string;
  participants: string;
  functionPackLabel: string;
  packsReady: string;
  packsTotal: string;
};

function emptyMeetingDraft(): MeetingDraft {
  return {
    name: "",
    schedule: "",
    participants: "",
    functionPackLabel: "",
    packsReady: "0",
    packsTotal: "0",
  };
}

function meetingToDraft(meeting: ManagementMeetingPlaceholder): MeetingDraft {
  return {
    id: meeting.id,
    name: meeting.name,
    schedule: meeting.schedule,
    participants: meeting.participants.join(", "),
    functionPackLabel: meeting.functionPackLabel,
    packsReady: String(meeting.packsReady),
    packsTotal: String(meeting.packsTotal),
  };
}

function ManagementMeetingsPanel() {
  const { state, upsertMeeting, deleteMeeting } = useManagementStore();
  const [draft, setDraft] = useState<MeetingDraft | null>(null);

  function startCreate() {
    setDraft(emptyMeetingDraft());
  }

  function startEdit(meeting: ManagementMeetingPlaceholder) {
    setDraft(meetingToDraft(meeting));
  }

  function cancelDraft() {
    setDraft(null);
  }

  function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft?.name.trim()) return;
    upsertMeeting({
      id: draft.id,
      name: draft.name,
      schedule: draft.schedule,
      participants: draft.participants
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      functionPackLabel: draft.functionPackLabel,
      packsReady: Number.parseInt(draft.packsReady, 10) || 0,
      packsTotal: Number.parseInt(draft.packsTotal, 10) || 0,
      readiness: [],
    });
    setDraft(null);
  }

  return (
    <WorkspaceSection
      title="Meetings"
      subtitle="Add, edit, or remove recurring management meetings and pack associations."
      actions={
        <button type="button" className={workspaceSecondaryButtonClass()} onClick={startCreate}>
          <Plus className="h-3.5 w-3.5" />
          Add meeting
        </button>
      }
    >
      {draft ? (
        <form
          onSubmit={saveDraft}
          className="mb-4 space-y-3 rounded-xl border border-sky-400/25 bg-sky-500/5 p-4"
        >
          <p className="text-sm font-semibold text-white">{draft.id ? "Edit meeting" : "New meeting"}</p>
          <label className="block text-sm text-white/70">
            Name
            <input
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className={workspaceInputClass()}
            />
          </label>
          <label className="block text-sm text-white/70">
            Schedule
            <input
              value={draft.schedule}
              onChange={(event) => setDraft({ ...draft, schedule: event.target.value })}
              className={workspaceInputClass()}
              placeholder="Thursday 09:00 · 90 minutes"
            />
          </label>
          <label className="block text-sm text-white/70">
            Participants
            <input
              value={draft.participants}
              onChange={(event) => setDraft({ ...draft, participants: event.target.value })}
              className={workspaceInputClass()}
              placeholder="CEO, CFO, COO"
            />
          </label>
          <label className="block text-sm text-white/70">
            Function pack cycle
            <input
              value={draft.functionPackLabel}
              onChange={(event) => setDraft({ ...draft, functionPackLabel: event.target.value })}
              className={workspaceInputClass()}
              placeholder="March 2026 management cycle"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              Packs ready
              <input
                type="number"
                min={0}
                value={draft.packsReady}
                onChange={(event) => setDraft({ ...draft, packsReady: event.target.value })}
                className={workspaceInputClass()}
              />
            </label>
            <label className="block text-sm text-white/70">
              Packs total
              <input
                type="number"
                min={0}
                value={draft.packsTotal}
                onChange={(event) => setDraft({ ...draft, packsTotal: event.target.value })}
                className={workspaceInputClass()}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={workspaceSecondaryButtonClass()}>
              Save meeting
            </button>
            <button type="button" className={workspaceSecondaryButtonClass()} onClick={cancelDraft}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {state.meetings.length === 0 ? (
          <WorkspaceEmpty message="No meetings yet." />
        ) : (
          state.meetings.map((meeting) => (
            <article
              key={meeting.id}
              className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{meeting.name}</h3>
                  <p className="mt-1 text-sm text-white/55">{meeting.schedule}</p>
                  <p className="mt-2 text-xs text-white/45">
                    Participants: {meeting.participants.join(" · ") || "—"}
                  </p>
                </div>
                <WorkspaceStatusPill className="border-sky-400/30 bg-sky-500/10 text-sky-100">
                  {meeting.packsReady}/{meeting.packsTotal} packs
                </WorkspaceStatusPill>
              </div>
              <p className="mt-3 text-sm text-white/60">{meeting.functionPackLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => startEdit(meeting)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => deleteMeeting(meeting.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </WorkspaceSection>
  );
}

type PackDraft = {
  id?: string;
  title: string;
  ownerRole: string;
  reportingPeriod: string;
  status: ManagementFunctionPackPlaceholder["status"];
};

function emptyPackDraft(): PackDraft {
  return {
    title: "",
    ownerRole: "",
    reportingPeriod: "",
    status: "draft",
  };
}

function packToDraft(pack: ManagementFunctionPackPlaceholder): PackDraft {
  return {
    id: pack.id,
    title: pack.title,
    ownerRole: pack.ownerRole,
    reportingPeriod: pack.reportingPeriod,
    status: pack.status,
  };
}

function ManagementFunctionPacksPanel({
  packs,
}: {
  packs: ManagementFunctionPackRecord[];
}) {
  const { upsertFunctionPack, uploadFunctionPack, deleteFunctionPack } = useManagementStore();
  const [draft, setDraft] = useState<PackDraft | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [uploadPackId, setUploadPackId] = useState<string | null>(null);

  function startCreate() {
    setDraft(emptyPackDraft());
  }

  function startEdit(pack: ManagementFunctionPackPlaceholder) {
    setDraft(packToDraft(pack));
  }

  function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft?.title.trim() || !draft.ownerRole.trim()) return;
    upsertFunctionPack({
      id: draft.id,
      title: draft.title,
      ownerRole: draft.ownerRole,
      reportingPeriod: draft.reportingPeriod,
      status: draft.status,
    });
    setDraft(null);
  }

  function triggerUpload(packId: string) {
    setUploadPackId(packId);
    uploadRef.current?.click();
  }

  return (
    <WorkspaceSection
      title="Function packs"
      subtitle="Upload, edit, or remove management function packs for each role."
      actions={
        <button type="button" className={workspaceSecondaryButtonClass()} onClick={startCreate}>
          <Plus className="h-3.5 w-3.5" />
          Add pack
        </button>
      }
    >
      <input
        ref={uploadRef}
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file || !uploadPackId) return;
          uploadFunctionPack(uploadPackId, file.name);
          setUploadPackId(null);
          event.target.value = "";
        }}
      />

      {draft ? (
        <form
          onSubmit={saveDraft}
          className="mb-4 space-y-3 rounded-xl border border-sky-400/25 bg-sky-500/5 p-4"
        >
          <p className="text-sm font-semibold text-white">{draft.id ? "Edit function pack" : "New function pack"}</p>
          <label className="block text-sm text-white/70">
            Title
            <input
              required
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className={workspaceInputClass()}
            />
          </label>
          <label className="block text-sm text-white/70">
            Owner role
            <input
              required
              value={draft.ownerRole}
              onChange={(event) => setDraft({ ...draft, ownerRole: event.target.value })}
              className={workspaceInputClass()}
              placeholder="CFO"
            />
          </label>
          <label className="block text-sm text-white/70">
            Reporting period
            <input
              value={draft.reportingPeriod}
              onChange={(event) => setDraft({ ...draft, reportingPeriod: event.target.value })}
              className={workspaceInputClass()}
              placeholder="March 2026"
            />
          </label>
          <label className="block text-sm text-white/70">
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: event.target.value as ManagementFunctionPackPlaceholder["status"],
                })
              }
              className={workspaceInputClass()}
            >
              <option value="current">Current</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={workspaceSecondaryButtonClass()}>
              Save pack
            </button>
            <button type="button" className={workspaceSecondaryButtonClass()} onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {packs.length === 0 ? (
        <WorkspaceEmpty message="No function packs are visible for your role." />
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
                  <p className="mt-1 text-sm text-white/55">Reporting period: {pack.reportingPeriod}</p>
                  <p className="mt-1 text-xs text-white/45">
                    Last generated: {pack.lastGenerated ?? "Not yet generated"}
                  </p>
                  {pack.uploadedFileName ? (
                    <p className="mt-1 text-xs text-emerald-200/80">
                      Uploaded: {pack.uploadedFileName}
                      {pack.uploadedAt ? ` · ${pack.uploadedAt.slice(0, 10)}` : ""}
                    </p>
                  ) : null}
                </div>
                <WorkspaceStatusPill className="capitalize">{pack.status}</WorkspaceStatusPill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => triggerUpload(pack.id)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </button>
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => startEdit(pack)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => deleteFunctionPack(pack.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </WorkspaceSection>
  );
}

type ActionDraft = {
  id?: string;
  title: string;
  owner: string;
  dueDate: string;
  meeting: string;
  kind: ManagementActionPlaceholder["kind"];
  status: ManagementActionPlaceholder["status"];
};

function emptyActionDraft(meetingNames: string[]): ActionDraft {
  return {
    title: "",
    owner: "",
    dueDate: new Date().toISOString().slice(0, 10),
    meeting: meetingNames[0] ?? "",
    kind: "action",
    status: "open",
  };
}

function actionToDraft(action: ManagementActionPlaceholder): ActionDraft {
  return {
    id: action.id,
    title: action.title,
    owner: action.owner,
    dueDate: action.dueDate,
    meeting: action.meeting,
    kind: action.kind,
    status: action.status,
  };
}

function ManagementActionsPanel({ meetingNames }: { meetingNames: string[] }) {
  const { state, upsertAction, deleteAction } = useManagementStore();
  const [draft, setDraft] = useState<ActionDraft | null>(null);

  function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft?.title.trim()) return;
    upsertAction({
      id: draft.id,
      title: draft.title,
      owner: draft.owner,
      dueDate: draft.dueDate,
      meeting: draft.meeting,
      kind: draft.kind,
      status: draft.status,
    });
    setDraft(null);
  }

  return (
    <WorkspaceSection
      title="Actions & decisions"
      subtitle="Add, edit, or remove management actions and decisions."
      actions={
        <button
          type="button"
          className={workspaceSecondaryButtonClass()}
          onClick={() => setDraft(emptyActionDraft(meetingNames))}
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </button>
      }
    >
      {draft ? (
        <form
          onSubmit={saveDraft}
          className="mb-4 grid gap-3 rounded-xl border border-sky-400/25 bg-sky-500/5 p-4 sm:grid-cols-2"
        >
          <p className="sm:col-span-2 text-sm font-semibold text-white">
            {draft.id ? "Edit item" : "New action or decision"}
          </p>
          <label className="block text-sm text-white/70 sm:col-span-2">
            Title
            <input
              required
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className={workspaceInputClass()}
            />
          </label>
          <label className="block text-sm text-white/70">
            Owner
            <input
              value={draft.owner}
              onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
              className={workspaceInputClass()}
            />
          </label>
          <label className="block text-sm text-white/70">
            Due date
            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              className={workspaceInputClass()}
            />
          </label>
          <label className="block text-sm text-white/70">
            Meeting
            <input
              list="management-meeting-options"
              value={draft.meeting}
              onChange={(event) => setDraft({ ...draft, meeting: event.target.value })}
              className={workspaceInputClass()}
            />
            <datalist id="management-meeting-options">
              {meetingNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm text-white/70">
            Type
            <select
              value={draft.kind}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  kind: event.target.value as ManagementActionPlaceholder["kind"],
                })
              }
              className={workspaceInputClass()}
            >
              <option value="action">Action</option>
              <option value="decision">Decision</option>
            </select>
          </label>
          <label className="block text-sm text-white/70">
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: event.target.value as ManagementActionPlaceholder["status"],
                })
              }
              className={workspaceInputClass()}
            >
              <option value="open">Open</option>
              <option value="overdue">Overdue</option>
              <option value="complete">Complete</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className={workspaceSecondaryButtonClass()}>
              Save item
            </button>
            <button type="button" className={workspaceSecondaryButtonClass()} onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2.5">Item</th>
              <th className="px-3 py-2.5">Owner</th>
              <th className="px-3 py-2.5">Due</th>
              <th className="px-3 py-2.5">Meeting</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.actions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-white/45">
                  No actions or decisions yet.
                </td>
              </tr>
            ) : (
              state.actions.map((row) => (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-white">{row.title}</p>
                    <p className="text-xs uppercase tracking-wide text-white/40">{row.kind}</p>
                  </td>
                  <td className="px-3 py-2.5">{row.owner}</td>
                  <td className="px-3 py-2.5 tabular-nums">{row.dueDate}</td>
                  <td className="px-3 py-2.5">{row.meeting}</td>
                  <td className={cn("px-3 py-2.5 capitalize", actionStatusClass(row.status))}>
                    {row.status}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={workspaceSecondaryButtonClass()}
                        onClick={() => setDraft(actionToDraft(row))}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={workspaceSecondaryButtonClass()}
                        onClick={() => deleteAction(row.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
  const { state } = useManagementStore();
  const visiblePacks = useMemo(
    () => filterVisibleManagementFunctionPacks(access, state.functionPacks),
    [access, state.functionPacks],
  );
  const meetingNames = useMemo(() => state.meetings.map((meeting) => meeting.name), [state.meetings]);

  if (!canAccessManagementWorkspace(access)) {
    return (
      <WorkspaceSection title="Management" subtitle={MANAGEMENT_SUBTITLE}>
        <p className="text-sm text-white/55">
          You do not have permission to view management packs. This area is restricted to
          authorised management roles.
        </p>
      </WorkspaceSection>
    );
  }

  return (
    <CentralSubnavShell
      title="Management"
      subtitle={MANAGEMENT_SUBTITLE}
      items={SECTIONS}
      activeId={section}
      onSelect={setSection}
    >
      {section === "dashboard" ? (
        <ManagementDashboard
          meetings={state.meetings}
          actions={state.actions}
          functionPacks={state.functionPacks}
        />
      ) : null}
      {section === "meetings" ? <ManagementMeetingsPanel /> : null}
      {section === "function-packs" ? (
        <ManagementFunctionPacksPanel packs={visiblePacks} />
      ) : null}
      {section === "actions-decisions" ? (
        <ManagementActionsPanel meetingNames={meetingNames} />
      ) : null}
    </CentralSubnavShell>
  );
}
