"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Archive,
  CheckCircle2,
  ClipboardList,
  Gavel,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { TalantonMeetingEditor } from "@/components/talanton/governance/TalantonMeetingEditor";
import {
  archiveMeeting,
  allActions,
  allDecisions,
  blankAction,
  blankDecision,
  deleteMeeting,
  getTalantonGovernanceSnapshot,
  governanceMinutesKpis,
  governanceTimeline,
  listMeetings,
  subscribeTalantonGovernanceStore,
  upsertMeeting,
  type ActionStatus,
  type DecisionStatus,
  type GovernanceMeeting,
  type MeetingStatus,
  type MeetingType,
} from "@/lib/talanton/governance-store";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

export type MinutesTab = "minutes" | "decisions" | "actions" | "timeline";

const TABS: { id: MinutesTab; label: string; icon: typeof ClipboardList }[] = [
  { id: "minutes", label: "Meeting Minutes", icon: ClipboardList },
  { id: "decisions", label: "Decisions", icon: Gavel },
  { id: "actions", label: "Action Items", icon: CheckCircle2 },
  { id: "timeline", label: "Governance Timeline", icon: Archive },
];

function useGovernance() {
  return useSyncExternalStore(
    subscribeTalantonGovernanceStore,
    getTalantonGovernanceSnapshot,
    getTalantonGovernanceSnapshot,
  );
}

function formatDate(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusPill(status: string) {
  if (status === "Approved" || status === "Completed" || status === "Held")
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (status === "Overdue" || status === "Rejected")
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (status === "Underway" || status === "Proposed" || status === "Scheduled")
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (status === "Archived" || status === "Deferred")
    return "border-white/15 bg-white/5 text-white/55";
  return "border-sky-400/30 bg-sky-500/10 text-sky-100";
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-emerald-400/40";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/25";
const secondaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10";

type MinutesActionKind = "minutes" | "decision" | "action";

function CreateMinutesActionModal({
  meetings,
  onClose,
  onSaved,
}: {
  meetings: GovernanceMeeting[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [meetingId, setMeetingId] = useState(meetings[0]?.id ?? "");
  const [kind, setKind] = useState<MinutesActionKind>("minutes");
  const [minutesText, setMinutesText] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [decisionOwner, setDecisionOwner] = useState("Harry Turner");
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>("Proposed");
  const [actionTitle, setActionTitle] = useState("");
  const [actionOwner, setActionOwner] = useState("Portfolio Ops");
  const [actionDue, setActionDue] = useState(new Date().toISOString().slice(0, 10));
  const [actionStatus, setActionStatus] = useState<ActionStatus>("Open");

  const meeting = meetings.find((m) => m.id === meetingId);

  function save() {
    if (!meeting) return;
    let next = { ...meeting };
    if (kind === "minutes") {
      if (!minutesText.trim()) return;
      next = { ...next, minutes: minutesText.trim() };
    } else if (kind === "decision") {
      if (!decisionText.trim()) return;
      next = {
        ...next,
        decisions: [
          ...next.decisions,
          { ...blankDecision(), text: decisionText.trim(), owner: decisionOwner, status: decisionStatus },
        ],
      };
    } else {
      if (!actionTitle.trim()) return;
      next = {
        ...next,
        actions: [
          ...next.actions,
          {
            ...blankAction(),
            title: actionTitle.trim(),
            owner: actionOwner,
            dueDate: actionDue,
            status: actionStatus,
          },
        ],
      };
    }
    upsertMeeting(next);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-auto rounded-2xl border border-white/10 bg-[#0b1a14]">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Create minutes / action</h3>
          <p className="mt-1 text-xs text-white/45">
            Add minutes, a decision, or an action item to an existing meeting record.
          </p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <label className="block text-xs text-white/55">
            Meeting
            <select
              className={cn(inputClass, "mt-1")}
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({formatDate(m.meetingDate)})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-white/55">
            Record type
            <select
              className={cn(inputClass, "mt-1")}
              value={kind}
              onChange={(e) => setKind(e.target.value as MinutesActionKind)}
            >
              <option value="minutes">Meeting minutes</option>
              <option value="decision">Decision</option>
              <option value="action">Action item</option>
            </select>
          </label>
          {kind === "minutes" ? (
            <label className="block text-xs text-white/55">
              Minutes text
              <textarea
                className={cn(inputClass, "mt-1 min-h-[140px]")}
                value={minutesText}
                onChange={(e) => setMinutesText(e.target.value)}
                placeholder="Record or update minutes for the selected meeting…"
              />
            </label>
          ) : null}
          {kind === "decision" ? (
            <div className="space-y-3">
              <label className="block text-xs text-white/55">
                Decision
                <textarea
                  className={cn(inputClass, "mt-1 min-h-[80px]")}
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-white/55">
                  Owner
                  <input
                    className={cn(inputClass, "mt-1")}
                    value={decisionOwner}
                    onChange={(e) => setDecisionOwner(e.target.value)}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Status
                  <select
                    className={cn(inputClass, "mt-1")}
                    value={decisionStatus}
                    onChange={(e) => setDecisionStatus(e.target.value as DecisionStatus)}
                  >
                    {(["Proposed", "Approved", "Deferred", "Rejected"] as DecisionStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
            </div>
          ) : null}
          {kind === "action" ? (
            <div className="space-y-3">
              <label className="block text-xs text-white/55">
                Action title
                <input
                  className={cn(inputClass, "mt-1")}
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block text-xs text-white/55">
                  Owner
                  <input
                    className={cn(inputClass, "mt-1")}
                    value={actionOwner}
                    onChange={(e) => setActionOwner(e.target.value)}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Due
                  <input
                    type="date"
                    className={cn(inputClass, "mt-1")}
                    value={actionDue}
                    onChange={(e) => setActionDue(e.target.value)}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Status
                  <select
                    className={cn(inputClass, "mt-1")}
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value as ActionStatus)}
                  >
                    {(["Open", "Underway", "Completed", "Overdue"] as ActionStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} onClick={save} disabled={!meeting}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TalantonMinutesDecisionsWorkspace({
  initialTab = "minutes",
}: {
  initialTab?: MinutesTab;
}) {
  const snap = useGovernance();
  const [tab, setTab] = useState<MinutesTab>(initialTab);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MeetingType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "all" | "active">("active");
  const [editing, setEditing] = useState<GovernanceMeeting | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const kpis = useMemo(() => governanceMinutesKpis(), [snap]);
  const meetings = useMemo(() => {
    return listMeetings({ includeArchived: statusFilter !== "active" }).filter((m) => {
      if (statusFilter === "active" && m.archived) return false;
      if (statusFilter !== "all" && statusFilter !== "active" && m.status !== statusFilter)
        return false;
      if (typeFilter !== "all" && m.meetingType !== typeFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.minutes.toLowerCase().includes(q) ||
        m.attendees.some((a) => a.name.toLowerCase().includes(q)) ||
        m.decisions.some((d) => d.text.toLowerCase().includes(q))
      );
    });
  }, [query, typeFilter, statusFilter, snap]);

  const decisions = useMemo(() => {
    return allDecisions().filter((d) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return d.text.toLowerCase().includes(q) || d.meetingTitle.toLowerCase().includes(q);
    });
  }, [query, snap]);

  const actions = useMemo(() => {
    return allActions().filter((a) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q);
    });
  }, [query, snap]);

  const timeline = useMemo(() => governanceTimeline(), [snap]);

  const activeMeetings = useMemo(
    () => listMeetings({ includeArchived: false }),
    [snap],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Board · Governance"
        title="Minutes & Decisions"
        description="Minutes, decisions, action owners, and governance timeline across Talanton portfolio oversight."
        actions={
          <button
            type="button"
            className={primaryBtn}
            onClick={() => setCreateModalOpen(true)}
            disabled={activeMeetings.length === 0}
            title={
              activeMeetings.length === 0
                ? "Create a board meeting first from Board Meetings"
                : undefined
            }
          >
            <Plus className="h-4 w-4" />
            Create minutes / action
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              tab === id
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 text-white/55 hover:border-white/25 hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button type="button" onClick={() => setTab("minutes")} className="text-left">
          <TalantonImpactMetric label="Minutes recorded" value={kpis.minutesRecorded} />
        </button>
        <button type="button" onClick={() => setTab("decisions")} className="text-left">
          <TalantonImpactMetric label="Decisions" value={kpis.decisionsTotal} />
        </button>
        <button type="button" onClick={() => setTab("decisions")} className="text-left">
          <TalantonImpactMetric
            label="Decisions pending"
            value={kpis.decisionsPending}
            tone="watch"
          />
        </button>
        <button type="button" onClick={() => setTab("actions")} className="text-left">
          <TalantonImpactMetric label="Open actions" value={kpis.actionsOpen} />
        </button>
        <button type="button" onClick={() => setTab("timeline")} className="text-left">
          <TalantonImpactMetric
            label="Timeline events"
            value={kpis.timelineEvents}
            tone={kpis.actionsOverdue > 0 ? "alert" : "good"}
          />
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              className={cn(inputClass, "pl-9")}
              placeholder="Search minutes, decisions, actions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className={inputClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MeetingType | "all")}
          >
            <option value="all">All meeting types</option>
            {(
              [
                "Board Meeting",
                "Investment Committee",
                "Management Meeting",
                "Impact Review",
                "Special Committee",
              ] as MeetingType[]
            ).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as MeetingStatus | "all" | "active")
            }
          >
            <option value="active">Active (hide archived)</option>
            <option value="all">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Held">Held</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </section>

      {tab === "minutes" && (
        <div className="space-y-3">
          {meetings.map((m) => (
            <article key={m.id} className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">{m.title}</h3>
                  <p className="text-xs text-white/45">
                    {formatDate(m.meetingDate)} · {m.meetingType}
                  </p>
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusPill(m.status))}>
                  {m.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
                {m.minutes || "Minutes not yet recorded."}
              </p>
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/70">
                  Attendees
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {m.attendees.map((a) => `${a.name} (${a.role})`).join(" · ") || "—"}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={secondaryBtn} onClick={() => setEditing(m)}>
                  Edit minutes
                </button>
                <button
                  type="button"
                  className={secondaryBtn}
                  onClick={() => archiveMeeting(m.id, !m.archived)}
                >
                  <Archive className="h-3.5 w-3.5" />
                  {m.archived ? "Unarchive" : "Archive"}
                </button>
                <button
                  type="button"
                  className={cn(secondaryBtn, "border-rose-400/20 text-rose-200")}
                  onClick={() => deleteMeeting(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "decisions" && (
        <div className="space-y-2">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5"
            >
              <div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusPill(d.status))}>
                  {d.status}
                </span>
                <p className="mt-2 text-sm font-medium text-white">{d.text}</p>
                <p className="mt-1 text-xs text-white/45">
                  {d.meetingTitle} · {formatDate(d.meetingDate)} · Owner {d.owner}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "actions" && (
        <div className="space-y-2">
          {actions.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5"
            >
              <div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusPill(a.status))}>
                  {a.status}
                </span>
                <p className="mt-2 text-sm font-medium text-white">{a.title}</p>
                <p className="mt-1 text-xs text-white/45">
                  {a.meetingTitle} · Owner {a.owner} · Due {formatDate(a.dueDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "timeline" && (
        <div className="relative space-y-0 border-l border-emerald-400/25 pl-6">
          {timeline.slice(0, 40).map((ev) => (
            <div key={ev.id} className="relative pb-6">
              <span className="absolute -left-[1.55rem] top-1 h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              <p className="text-[11px] text-white/40">{formatDate(ev.date)}</p>
              <p className="mt-1 text-sm font-medium text-white">
                <span className="text-emerald-300/80">{ev.kind}</span> · {ev.title}
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                {ev.detail} ·{" "}
                <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px]", statusPill(ev.status))}>
                  {ev.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <TalantonMeetingEditor meeting={editing} onClose={() => setEditing(null)} />
      ) : null}
      {createModalOpen ? (
        <CreateMinutesActionModal
          meetings={activeMeetings}
          onClose={() => setCreateModalOpen(false)}
          onSaved={() => undefined}
        />
      ) : null}
    </div>
  );
}
