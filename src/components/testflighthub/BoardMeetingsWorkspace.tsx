"use client";

import { useMemo, useState } from "react";
import { Archive, Plus, Search, X } from "lucide-react";

import {
  archiveAbhiBoardMeeting,
  deleteAbhiBoardMeeting,
  upsertAbhiBoardMeeting,
  type AbhiBoardMeeting,
  type AbhiMeetingAction,
  type AbhiMeetingActionStatus,
  type AbhiMeetingDecision,
} from "@/lib/abhi/board-meetings-store";
import {
  CorporateFieldLabel,
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "./corporate-ui";
import { useBoardMeetingsStore } from "./useBoardMeetingsStore";

type MeetingFormState = {
  id?: string;
  meetingDate: string;
  title: string;
  notes: string;
  status: AbhiBoardMeeting["status"];
  agendaText: string;
  resolutionsText: string;
  decisionsText: string;
  actionsText: string;
  attendeesText: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): MeetingFormState {
  return {
    meetingDate: todayIso(),
    title: "",
    notes: "",
    status: "Draft",
    agendaText: "",
    resolutionsText: "",
    decisionsText: "",
    actionsText: "",
    attendeesText: "",
  };
}

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseAttendees(text: string): AbhiBoardMeeting["attendees"] {
  return linesToList(text).map((line) => {
    const [name, role] = line.split("|").map((part) => part.trim());
    return { name: name || line, role: role || "" };
  });
}

function parseDecisions(text: string): AbhiMeetingDecision[] {
  return linesToList(text).map((line, index) => {
    const [decision, resolution] = line.split("|").map((part) => part.trim());
    return {
      id: `D-${String(index + 1).padStart(2, "0")}`,
      text: decision || line,
      resolution: resolution || "",
    };
  });
}

function parseActions(text: string): AbhiMeetingAction[] {
  return linesToList(text).map((line, index) => {
    const [title, owner, dueDate, status] = line.split("|").map((part) => part.trim());
    const normalised = (status || "Underway") as AbhiMeetingActionStatus;
    return {
      id: `BA-${String(200 + index)}`,
      title: title || line,
      owner: owner || "",
      dueDate: dueDate || todayIso(),
      status: normalised,
    };
  });
}

function formFrom(meeting: AbhiBoardMeeting): MeetingFormState {
  return {
    id: meeting.id,
    meetingDate: meeting.meetingDate,
    title: meeting.title,
    notes: meeting.notes,
    status: meeting.status,
    agendaText: meeting.agenda.join("\n"),
    resolutionsText: meeting.resolutions.join("\n"),
    decisionsText: meeting.decisions
      .map((d) => (d.resolution ? `${d.text} | ${d.resolution}` : d.text))
      .join("\n"),
    actionsText: meeting.actions
      .map((a) => `${a.title} | ${a.owner} | ${a.dueDate} | ${a.status}`)
      .join("\n"),
    attendeesText: meeting.attendees
      .map((a) => (a.role ? `${a.name} | ${a.role}` : a.name))
      .join("\n"),
  };
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function BoardMeetingsWorkspace() {
  const store = useBoardMeetingsStore();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<MeetingFormState | null>(null);
  const [viewMeeting, setViewMeeting] = useState<AbhiBoardMeeting | null>(null);

  const active = useMemo(
    () => store.meetings.filter((m) => m.status !== "Archived"),
    [store.meetings],
  );
  const outstanding = active.flatMap((m) =>
    m.actions.filter((a) => a.status !== "Completed" && a.status !== "Closed"),
  );
  const decisions = active.flatMap((m) => m.decisions);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.meetings
      .filter((m) => (showArchived ? true : m.status !== "Archived"))
      .filter((m) => {
        if (!q) return true;
        return [m.id, m.title, m.meetingDate, m.notes, ...m.resolutions]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .slice()
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  }, [search, showArchived, store.meetings]);

  function saveForm() {
    if (!form?.meetingDate) return;
    upsertAbhiBoardMeeting({
      id: form.id,
      meetingDate: form.meetingDate,
      title: form.title || `ABHI Board Meeting — ${form.meetingDate}`,
      notes: form.notes,
      status: form.status,
      agenda: linesToList(form.agendaText),
      resolutions: linesToList(form.resolutionsText),
      decisions: parseDecisions(form.decisionsText),
      actions: parseActions(form.actionsText),
      attendees: parseAttendees(form.attendeesText),
    });
    setForm(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
          Corporate Information
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Board Meetings</h2>
        <p className="mt-1 max-w-3xl text-sm text-white/60">
          Capture meeting outcomes — decisions, actions, and resolutions. Board Pack prepares
          materials before the meeting; Board Meetings records what was agreed afterwards.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CorporateKpiTile label="Meetings" value={String(active.length)} />
        <CorporateKpiTile label="Outstanding actions" value={String(outstanding.length)} />
        <CorporateKpiTile label="Decisions recorded" value={String(decisions.length)} />
        <CorporateKpiTile
          label="Archived"
          value={String(store.meetings.filter((m) => m.status === "Archived").length)}
        />
      </div>

      <CorporateSection
        title="Meeting register"
        subtitle="Held meetings feed previous actions and decisions into future board packs."
        actions={
          <button type="button" className={corporatePrimaryButtonClass()} onClick={() => setForm(emptyForm())}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New meeting
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings…"
              className={`${corporateInputClass()} pl-9`}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-white/65">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Meeting</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Decisions</th>
                <th className="px-3 py-2.5">Actions</th>
                <th className="px-3 py-2.5">Controls</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((meeting) => (
                <tr key={meeting.id} className="border-t border-white/8">
                  <td className="px-3 py-3 text-white/80">{meeting.meetingDate}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-white">{meeting.title}</p>
                    <p className="text-xs text-white/45">{meeting.id}</p>
                  </td>
                  <td className="px-3 py-3">
                    <CorporateStatusPill>{meeting.status}</CorporateStatusPill>
                  </td>
                  <td className="px-3 py-3 text-white/75">{meeting.decisions.length}</td>
                  <td className="px-3 py-3 text-white/75">{meeting.actions.length}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={corporateSecondaryButtonClass()}
                        onClick={() => setViewMeeting(meeting)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className={corporateSecondaryButtonClass()}
                        onClick={() => setForm(formFrom(meeting))}
                      >
                        Edit
                      </button>
                      {meeting.status !== "Archived" ? (
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => archiveAbhiBoardMeeting(meeting.id)}
                        >
                          <Archive className="mr-1 h-3 w-3" />
                          Archive
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={corporateSecondaryButtonClass()}
                        onClick={() => {
                          if (window.confirm(`Delete ${meeting.id}?`)) {
                            deleteAbhiBoardMeeting(meeting.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>

      {viewMeeting ? (
        <Modal title={viewMeeting.title} onClose={() => setViewMeeting(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <CorporateFieldLabel>Date</CorporateFieldLabel>
              <p className="text-sm text-white/80">{viewMeeting.meetingDate}</p>
            </div>
            <div>
              <CorporateFieldLabel>Status</CorporateFieldLabel>
              <p className="text-sm text-white/80">{viewMeeting.status}</p>
            </div>
          </div>
          <div className="mt-4">
            <CorporateFieldLabel>Decisions</CorporateFieldLabel>
            <ul className="mt-1 space-y-1 text-sm text-white/75">
              {viewMeeting.decisions.map((d) => (
                <li key={d.id}>• {d.text}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <CorporateFieldLabel>Actions</CorporateFieldLabel>
            <ul className="mt-1 space-y-1 text-sm text-white/75">
              {viewMeeting.actions.map((a) => (
                <li key={a.id}>
                  • {a.title} — {a.owner} ({a.status})
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <CorporateFieldLabel>Notes</CorporateFieldLabel>
            <p className="text-sm text-white/75">{viewMeeting.notes || "—"}</p>
          </div>
        </Modal>
      ) : null}

      {form ? (
        <Modal title={form.id ? "Edit board meeting" : "New board meeting"} onClose={() => setForm(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <CorporateFieldLabel>Meeting date</CorporateFieldLabel>
              <input
                type="date"
                className={corporateInputClass()}
                value={form.meetingDate}
                onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Status</CorporateFieldLabel>
              <select
                className={corporateInputClass()}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as AbhiBoardMeeting["status"] })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Held">Held</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <CorporateFieldLabel>Title</CorporateFieldLabel>
            <input
              className={corporateInputClass()}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <CorporateFieldLabel>Attendees (Name | Role per line)</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[90px]`}
                value={form.attendeesText}
                onChange={(e) => setForm({ ...form, attendeesText: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Agenda (one item per line)</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[90px]`}
                value={form.agendaText}
                onChange={(e) => setForm({ ...form, agendaText: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3">
            <CorporateFieldLabel>Decisions (Decision | Resolution per line)</CorporateFieldLabel>
            <textarea
              className={`${corporateInputClass()} min-h-[90px]`}
              value={form.decisionsText}
              onChange={(e) => setForm({ ...form, decisionsText: e.target.value })}
            />
          </div>
          <div className="mt-3">
            <CorporateFieldLabel>
              Actions (Title | Owner | Due Date | Status per line)
            </CorporateFieldLabel>
            <textarea
              className={`${corporateInputClass()} min-h-[110px]`}
              value={form.actionsText}
              onChange={(e) => setForm({ ...form, actionsText: e.target.value })}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <CorporateFieldLabel>Resolutions</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[80px]`}
                value={form.resolutionsText}
                onChange={(e) => setForm({ ...form, resolutionsText: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Meeting notes</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[80px]`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setForm(null)}>
              Cancel
            </button>
            <button type="button" className={corporatePrimaryButtonClass()} onClick={saveForm}>
              Save meeting
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
