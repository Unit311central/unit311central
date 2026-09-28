"use client";

import { useState } from "react";

import {
  blankAction,
  blankDecision,
  upsertMeeting,
  type ActionStatus,
  type DecisionStatus,
  type GovernanceMeeting,
  type MeetingStatus,
  type MeetingType,
} from "@/lib/talanton/governance-store";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-emerald-400/40";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/25";
const secondaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10";

export function TalantonMeetingEditor({
  meeting,
  onClose,
  title = "Edit meeting",
  saveLabel = "Save meeting",
  lockMeetingType,
}: {
  meeting: GovernanceMeeting;
  onClose: () => void;
  title?: string;
  saveLabel?: string;
  /** When set, meeting type cannot be changed (e.g. Board Meetings screen). */
  lockMeetingType?: MeetingType;
}) {
  const [draft, setDraft] = useState(meeting);

  function save() {
    upsertMeeting(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col overflow-auto border-l border-white/10 bg-[#0b1a14] p-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
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
                value={lockMeetingType ?? draft.meetingType}
                disabled={Boolean(lockMeetingType)}
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
            Agenda / minutes
            <textarea
              className={cn(inputClass, "mt-1 min-h-[120px]")}
              value={draft.minutes}
              placeholder="Agenda items and meeting minutes…"
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
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
