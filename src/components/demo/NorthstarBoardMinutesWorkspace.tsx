"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  deleteNorthstarActionRecord,
  deleteNorthstarDecision,
  deleteNorthstarMinuteSummary,
  upsertNorthstarActionRecord,
  upsertNorthstarDecision,
  upsertNorthstarMinuteSummary,
} from "@/lib/demo/northstar-board-minutes-store";
import {
  CorporateFieldLabel,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { useNorthstarMinutesStore } from "@/components/testflighthub/useNorthstarMinutesStore";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
        Northstar · Board
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-white/55">{subtitle}</p>
    </header>
  );
}

type Tab = "minutes" | "decisions" | "actions";

export function NorthstarBoardMinutesWorkspace() {
  const store = useNorthstarMinutesStore();
  const [tab, setTab] = useState<Tab>("minutes");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<
    | { kind: "minutes"; id?: string; meetingDate: string; meetingTitle: string; summary: string }
    | { kind: "decision"; id?: string; meetingDate: string; text: string; resolution: string }
    | { kind: "action"; id?: string; meetingDate: string; title: string; owner: string; dueDate: string; status: string }
    | null
  >(null);

  const query = q.trim().toLowerCase();

  const summaries = useMemo(() => {
    return store.summaries
      .filter((s) => !query || `${s.meetingTitle} ${s.summary}`.toLowerCase().includes(query))
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  }, [store.summaries, query]);

  const decisions = useMemo(() => {
    return store.decisions
      .filter(
        (d) =>
          !query ||
          `${d.text} ${d.resolution} ${d.meetingDate}`.toLowerCase().includes(query),
      )
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  }, [store.decisions, query]);

  const actions = useMemo(() => {
    return store.actions
      .filter(
        (a) =>
          !query ||
          `${a.title} ${a.owner} ${a.status}`.toLowerCase().includes(query),
      )
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  }, [store.actions, query]);

  function saveEdit() {
    if (!editing) return;
    if (editing.kind === "minutes") {
      upsertNorthstarMinuteSummary({
        id: editing.id,
        meetingDate: editing.meetingDate,
        meetingTitle: editing.meetingTitle,
        summary: editing.summary,
      });
    } else if (editing.kind === "decision") {
      upsertNorthstarDecision({
        id: editing.id,
        meetingDate: editing.meetingDate,
        text: editing.text,
        resolution: editing.resolution,
      });
    } else {
      upsertNorthstarActionRecord({
        id: editing.id,
        meetingDate: editing.meetingDate,
        title: editing.title,
        owner: editing.owner,
        dueDate: editing.dueDate,
        status: editing.status,
      });
    }
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Minutes & Decisions"
        subtitle="Edit meeting minutes, board decisions, and action items here — Q1 & Q2 2026 seeded."
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["minutes", "Minutes"],
            ["decisions", "Decisions"],
            ["actions", "Actions"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              tab === id
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 text-white/60 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-sky-400/50"
        />
      </label>

      {tab === "minutes" ? (
        <CorporateSection
          title="Meeting minutes"
          subtitle="Narrative summary per held meeting."
          actions={
            <button
              type="button"
              className={corporatePrimaryButtonClass()}
              onClick={() =>
                setEditing({
                  kind: "minutes",
                  meetingDate: new Date().toISOString().slice(0, 10),
                  meetingTitle: "Northstar Board Meeting",
                  summary: "",
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add minutes
            </button>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-3 py-2.5">Meeting</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Minutes summary</th>
                  <th className="px-3 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((row) => (
                  <tr key={row.id} className="border-t border-white/8 align-top">
                    <td className="px-3 py-3 font-medium text-white">{row.meetingTitle}</td>
                    <td className="px-3 py-3 text-white/70">{formatDate(row.meetingDate)}</td>
                    <td className="max-w-md px-3 py-3 text-white/75">{row.summary}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() =>
                            setEditing({
                              kind: "minutes",
                              id: row.id,
                              meetingDate: row.meetingDate,
                              meetingTitle: row.meetingTitle,
                              summary: row.summary,
                            })
                          }
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => {
                            if (window.confirm("Delete these minutes?")) {
                              deleteNorthstarMinuteSummary(row.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CorporateSection>
      ) : null}

      {tab === "decisions" ? (
        <CorporateSection
          title="Board decisions"
          subtitle="Each row is one decision and its resolution."
          actions={
            <button
              type="button"
              className={corporatePrimaryButtonClass()}
              onClick={() =>
                setEditing({
                  kind: "decision",
                  meetingDate: new Date().toISOString().slice(0, 10),
                  text: "",
                  resolution: "",
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add decision
            </button>
          }
        >
          <div className="space-y-2">
            {decisions.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CorporateStatusPill className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
                      {d.id}
                    </CorporateStatusPill>
                    <span className="text-xs text-white/45">{formatDate(d.meetingDate)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{d.text}</p>
                  {d.resolution ? (
                    <p className="mt-1 text-sm text-white/55">Resolution: {d.resolution}</p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={corporateSecondaryButtonClass()}
                    onClick={() =>
                      setEditing({
                        kind: "decision",
                        id: d.id,
                        meetingDate: d.meetingDate,
                        text: d.text,
                        resolution: d.resolution,
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={corporateSecondaryButtonClass()}
                    onClick={() => {
                      if (window.confirm("Delete this decision?")) deleteNorthstarDecision(d.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CorporateSection>
      ) : null}

      {tab === "actions" ? (
        <CorporateSection
          title="Action items"
          subtitle="Owner, due date, and status for each action."
          actions={
            <button
              type="button"
              className={corporatePrimaryButtonClass()}
              onClick={() =>
                setEditing({
                  kind: "action",
                  meetingDate: new Date().toISOString().slice(0, 10),
                  title: "",
                  owner: "",
                  dueDate: new Date().toISOString().slice(0, 10),
                  status: "Underway",
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add action
            </button>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-3 py-2.5">Action</th>
                  <th className="px-3 py-2.5">Owner</th>
                  <th className="px-3 py-2.5">Due</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} className="border-t border-white/8">
                    <td className="px-3 py-3 text-white">{a.title}</td>
                    <td className="px-3 py-3 text-white/70">{a.owner}</td>
                    <td className="px-3 py-3 text-white/70">{formatDate(a.dueDate)}</td>
                    <td className="px-3 py-3">
                      <CorporateStatusPill>{a.status}</CorporateStatusPill>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() =>
                            setEditing({
                              kind: "action",
                              id: a.id,
                              meetingDate: a.meetingDate,
                              title: a.title,
                              owner: a.owner,
                              dueDate: a.dueDate,
                              status: a.status,
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => {
                            if (window.confirm("Remove this action?")) {
                              deleteNorthstarActionRecord(a.id);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CorporateSection>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">
              {editing.id ? "Edit" : "Add"}{" "}
              {editing.kind === "minutes"
                ? "minutes"
                : editing.kind === "decision"
                  ? "decision"
                  : "action"}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <CorporateFieldLabel>Meeting date</CorporateFieldLabel>
                <input
                  type="date"
                  className={corporateInputClass()}
                  value={editing.meetingDate}
                  onChange={(e) => setEditing({ ...editing, meetingDate: e.target.value })}
                />
              </div>
              {editing.kind === "minutes" ? (
                <>
                  <div>
                    <CorporateFieldLabel>Meeting title</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.meetingTitle}
                      onChange={(e) =>
                        setEditing({ ...editing, meetingTitle: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <CorporateFieldLabel>Minutes summary</CorporateFieldLabel>
                    <textarea
                      className={`${corporateInputClass()} min-h-[120px]`}
                      value={editing.summary}
                      onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
              {editing.kind === "decision" ? (
                <>
                  <div>
                    <CorporateFieldLabel>Decision</CorporateFieldLabel>
                    <textarea
                      className={`${corporateInputClass()} min-h-[80px]`}
                      value={editing.text}
                      onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                    />
                  </div>
                  <div>
                    <CorporateFieldLabel>Resolution</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.resolution}
                      onChange={(e) =>
                        setEditing({ ...editing, resolution: e.target.value })
                      }
                    />
                  </div>
                </>
              ) : null}
              {editing.kind === "action" ? (
                <>
                  <div>
                    <CorporateFieldLabel>Action</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <CorporateFieldLabel>Owner</CorporateFieldLabel>
                      <input
                        className={corporateInputClass()}
                        value={editing.owner}
                        onChange={(e) => setEditing({ ...editing, owner: e.target.value })}
                      />
                    </div>
                    <div>
                      <CorporateFieldLabel>Due date</CorporateFieldLabel>
                      <input
                        type="date"
                        className={corporateInputClass()}
                        value={editing.dueDate}
                        onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <CorporateFieldLabel>Status</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.status}
                      onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
