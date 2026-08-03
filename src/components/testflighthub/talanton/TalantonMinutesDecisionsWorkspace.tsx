"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gavel,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  archiveMeeting,
  allActions,
  allDecisions,
  blankAction,
  blankDecision,
  createMeeting,
  deleteMeeting,
  getTalantonGovernanceSnapshot,
  governanceKpis,
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

export type MinutesTab =
  | "dashboard"
  | "minutes"
  | "decisions"
  | "actions"
  | "timeline";

const TABS: { id: MinutesTab; label: string; icon: typeof CalendarDays }[] = [
  { id: "dashboard", label: "Meetings Dashboard", icon: CalendarDays },
  { id: "minutes", label: "Meeting Minutes", icon: ClipboardList },
  { id: "decisions", label: "Decisions Register", icon: Gavel },
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

function MeetingEditor({
  meeting,
  onClose,
}: {
  meeting: GovernanceMeeting;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(meeting);

  function save() {
    upsertMeeting(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col overflow-auto border-l border-white/10 bg-[#0b1a14] p-5">
        <h3 className="text-lg font-semibold text-white">Edit meeting</h3>
        <div className="mt-4 space-y-3">
          <label className="block text-[11px] text-white/45">
            Title
            <input
              className={cn(inputClass, "mt-1")}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[11px] text-white/45">
              Date
              <input
                type="date"
                className={cn(inputClass, "mt-1")}
                value={draft.meetingDate}
                onChange={(e) => setDraft({ ...draft, meetingDate: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-white/45">
              Type
              <select
                className={cn(inputClass, "mt-1")}
                value={draft.meetingType}
                onChange={(e) =>
                  setDraft({ ...draft, meetingType: e.target.value as MeetingType })
                }
              >
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
            </label>
          </div>
          <label className="block text-[11px] text-white/45">
            Status
            <select
              className={cn(inputClass, "mt-1")}
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as MeetingStatus })
              }
            >
              {(["Draft", "Scheduled", "Held", "Archived"] as MeetingStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] text-white/45">
            Attendees (one per line: Name — Role)
            <textarea
              className={cn(inputClass, "mt-1 min-h-[80px]")}
              value={draft.attendees.map((a) => `${a.name} — ${a.role}`).join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attendees: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [name, role] = line.split("—").map((x) => x.trim());
                      return { name: name || line, role: role || "Attendee" };
                    }),
                })
              }
            />
          </label>
          <label className="block text-[11px] text-white/45">
            Minutes
            <textarea
              className={cn(inputClass, "mt-1 min-h-[120px]")}
              value={draft.minutes}
              onChange={(e) => setDraft({ ...draft, minutes: e.target.value })}
            />
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-white/45">Decisions</span>
              <button
                type="button"
                className="text-[11px] text-emerald-300"
                onClick={() =>
                  setDraft({ ...draft, decisions: [...draft.decisions, blankDecision()] })
                }
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {draft.decisions.map((d, i) => (
                <div key={d.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <input
                    className={inputClass}
                    value={d.text}
                    placeholder="Decision text"
                    onChange={(e) => {
                      const decisions = [...draft.decisions];
                      decisions[i] = { ...d, text: e.target.value };
                      setDraft({ ...draft, decisions });
                    }}
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      className={inputClass}
                      value={d.status}
                      onChange={(e) => {
                        const decisions = [...draft.decisions];
                        decisions[i] = { ...d, status: e.target.value as DecisionStatus };
                        setDraft({ ...draft, decisions });
                      }}
                    >
                      {(["Proposed", "Approved", "Deferred", "Rejected"] as DecisionStatus[]).map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      className={inputClass}
                      value={d.owner}
                      placeholder="Owner"
                      onChange={(e) => {
                        const decisions = [...draft.decisions];
                        decisions[i] = { ...d, owner: e.target.value };
                        setDraft({ ...draft, decisions });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-white/45">Actions</span>
              <button
                type="button"
                className="text-[11px] text-emerald-300"
                onClick={() => setDraft({ ...draft, actions: [...draft.actions, blankAction()] })}
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {draft.actions.map((a, i) => (
                <div key={a.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <input
                    className={inputClass}
                    value={a.title}
                    placeholder="Action title"
                    onChange={(e) => {
                      const actions = [...draft.actions];
                      actions[i] = { ...a, title: e.target.value };
                      setDraft({ ...draft, actions });
                    }}
                  />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input
                      className={inputClass}
                      value={a.owner}
                      onChange={(e) => {
                        const actions = [...draft.actions];
                        actions[i] = { ...a, owner: e.target.value };
                        setDraft({ ...draft, actions });
                      }}
                    />
                    <input
                      type="date"
                      className={inputClass}
                      value={a.dueDate}
                      onChange={(e) => {
                        const actions = [...draft.actions];
                        actions[i] = { ...a, dueDate: e.target.value };
                        setDraft({ ...draft, actions });
                      }}
                    />
                    <select
                      className={inputClass}
                      value={a.status}
                      onChange={(e) => {
                        const actions = [...draft.actions];
                        actions[i] = { ...a, status: e.target.value as ActionStatus };
                        setDraft({ ...draft, actions });
                      }}
                    >
                      {(["Open", "Underway", "Completed", "Overdue"] as ActionStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} onClick={save}>
            Save meeting
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TalantonMinutesDecisionsWorkspace({
  initialTab = "dashboard",
}: {
  initialTab?: MinutesTab;
}) {
  const snap = useGovernance();
  const [tab, setTab] = useState<MinutesTab>(initialTab);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MeetingType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "all" | "active">("active");
  const [editing, setEditing] = useState<GovernanceMeeting | null>(null);

  const kpis = useMemo(() => governanceKpis(), [snap]);
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Board · Governance"
        title="Minutes & Decisions"
        description="Board and management governance — meetings, minutes, decisions, action owners and due dates across Talanton’s faith-driven portfolio oversight."
        actions={
          <button
            type="button"
            className={primaryBtn}
            onClick={() => setEditing(createMeeting({ title: "New Talanton governance meeting" }))}
          >
            <Plus className="h-4 w-4" />
            Create meeting
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <TalantonImpactMetric label="Active meetings" value={kpis.meetingsActive} />
        <TalantonImpactMetric label="Held" value={kpis.meetingsHeld} tone="good" />
        <TalantonImpactMetric label="Decisions approved" value={kpis.decisionsApproved} />
        <TalantonImpactMetric label="Decisions pending" value={kpis.decisionsPending} tone="watch" />
        <TalantonImpactMetric label="Open actions" value={kpis.actionsOpen} />
        <TalantonImpactMetric
          label="Overdue actions"
          value={kpis.actionsOverdue}
          tone={kpis.actionsOverdue > 0 ? "alert" : "good"}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              className={cn(inputClass, "pl-9")}
              placeholder="Search meetings, decisions, actions…"
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

      {tab === "dashboard" && (
        <div className="grid gap-3 xl:grid-cols-2">
          {meetings.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/50 via-[#0b1a14]/80 to-[#08110d] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusPill(m.status))}>
                      {m.status}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50">
                      {m.meetingType}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-white">{m.title}</h3>
                  <p className="mt-1 text-xs text-white/45">{formatDate(m.meetingDate)}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-white/65">{m.minutes || "No minutes yet."}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/40">
                <span>{m.attendees.length} attendees</span>
                <span>{m.decisions.length} decisions</span>
                <span>{m.actions.length} actions</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={secondaryBtn} onClick={() => setEditing(m)}>
                  Edit
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
              <button type="button" className={cn(secondaryBtn, "mt-4")} onClick={() => setEditing(m)}>
                Edit minutes
              </button>
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

      {editing ? <MeetingEditor meeting={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
