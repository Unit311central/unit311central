"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  deleteOmniTransitAction,
  deleteOmniTransitDecision,
  deleteOmniTransitMinuteSummary,
  loadOmniTransitMinutesStore,
  upsertOmniTransitAction,
  upsertOmniTransitDecision,
  upsertOmniTransitMinuteSummary,
  type OmniTransitBoardAction,
  type OmniTransitBoardDecision,
  type OmniTransitMinuteSummary,
} from "@/lib/saec/omnitransit-board-minutes-store";
import { OMNITRANSIT_DISPLAY_NAME } from "@/lib/saec-surface";
import {
  CorporateFieldLabel,
  CorporateSection,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

type Tab = "minutes" | "decisions" | "actions";

type EditState =
  | { kind: "minutes"; id?: string; meetingDate: string; meetingTitle: string; summary: string }
  | { kind: "decision"; id?: string; meetingDate: string; text: string; resolution: string }
  | {
      kind: "action";
      id?: string;
      meetingDate: string;
      title: string;
      owner: string;
      dueDate: string;
      status: string;
    };

export function SaecBoardMinutesWorkspace() {
  const [summaries, setSummaries] = useState<OmniTransitMinuteSummary[]>([]);
  const [decisions, setDecisions] = useState<OmniTransitBoardDecision[]>([]);
  const [actions, setActions] = useState<OmniTransitBoardAction[]>([]);
  const [tab, setTab] = useState<Tab>("minutes");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);

  useEffect(() => {
    const store = loadOmniTransitMinutesStore();
    setSummaries(store.summaries);
    setDecisions(store.decisions);
    setActions(store.actions);
  }, []);

  const query = q.trim().toLowerCase();

  const filteredSummaries = useMemo(
    () =>
      summaries
        .filter((s) => !query || `${s.meetingTitle} ${s.summary}`.toLowerCase().includes(query))
        .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)),
    [summaries, query],
  );

  function refresh() {
    const store = loadOmniTransitMinutesStore();
    setSummaries(store.summaries);
    setDecisions(store.decisions);
    setActions(store.actions);
  }

  function saveEdit() {
    if (!editing) return;
    if (editing.kind === "minutes") {
      upsertOmniTransitMinuteSummary(editing);
    } else if (editing.kind === "decision") {
      upsertOmniTransitDecision(editing);
    } else {
      upsertOmniTransitAction(editing);
    }
    setEditing(null);
    refresh();
  }

  return (
    <div className="space-y-5 p-4">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
          {OMNITRANSIT_DISPLAY_NAME} · Board
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Minutes & actions</h1>
        <p className="mt-1 text-sm text-white/55">
          Edit meeting minutes, board decisions, and follow-up actions for the OmniTransit demo board.
        </p>
      </header>

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

      <div className="flex justify-end">
        <button
          type="button"
          className={corporatePrimaryButtonClass()}
          onClick={() => {
            if (tab === "minutes") {
              setEditing({
                kind: "minutes",
                meetingDate: "2026-08-26",
                meetingTitle: "",
                summary: "",
              });
            } else if (tab === "decisions") {
              setEditing({
                kind: "decision",
                meetingDate: "2026-08-26",
                text: "",
                resolution: "",
              });
            } else {
              setEditing({
                kind: "action",
                meetingDate: "2026-08-26",
                title: "",
                owner: "",
                dueDate: "2026-09-15",
                status: "Outstanding",
              });
            }
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </button>
      </div>

      {tab === "decisions" && (
        <CorporateSection title="Board decisions">
          <ul className="space-y-2">
            {decisions.map((row) => (
              <li key={row.id} className="rounded-xl border border-white/10 px-3 py-3 text-sm text-white/75">
                <p className="font-medium text-white">{row.text}</p>
                <p className="mt-1 text-xs text-white/45">{formatDate(row.meetingDate)}</p>
                <p className="mt-1">{row.resolution}</p>
              </li>
            ))}
          </ul>
        </CorporateSection>
      )}

      {tab === "actions" && (
        <CorporateSection title="Board actions">
          <ul className="space-y-2">
            {actions.map((row) => (
              <li key={row.id} className="rounded-xl border border-white/10 px-3 py-3 text-sm">
                <p className="font-medium text-white">{row.title}</p>
                <p className="mt-1 text-xs text-white/45">
                  {row.owner} · due {formatDate(row.dueDate)} · {row.status}
                </p>
              </li>
            ))}
          </ul>
        </CorporateSection>
      )}

      {tab === "minutes" && (
        <CorporateSection title="Board minutes">
          <ul className="space-y-2">
            {filteredSummaries.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/10 px-3 py-3"
              >
                <div>
                  <p className="font-medium text-white">{row.meetingTitle}</p>
                  <p className="text-xs text-white/45">{formatDate(row.meetingDate)}</p>
                  <p className="mt-1 text-sm text-white/70">{row.summary}</p>
                </div>
                <div className="flex shrink-0 gap-1">
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
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={corporateSecondaryButtonClass()}
                    onClick={() => {
                      deleteOmniTransitMinuteSummary(row.id);
                      refresh();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </CorporateSection>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">Edit</h3>
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
              {editing.kind === "minutes" && (
                <>
                  <div>
                    <CorporateFieldLabel>Title</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.meetingTitle}
                      onChange={(e) =>
                        setEditing({ ...editing, meetingTitle: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <CorporateFieldLabel>Summary</CorporateFieldLabel>
                    <textarea
                      className={corporateInputClass()}
                      rows={4}
                      value={editing.summary}
                      onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                    />
                  </div>
                </>
              )}
              {editing.kind === "decision" && (
                <>
                  <div>
                    <CorporateFieldLabel>Decision</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.text}
                      onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                    />
                  </div>
                  <div>
                    <CorporateFieldLabel>Resolution</CorporateFieldLabel>
                    <textarea
                      className={corporateInputClass()}
                      rows={3}
                      value={editing.resolution}
                      onChange={(e) =>
                        setEditing({ ...editing, resolution: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
              {editing.kind === "action" && (
                <>
                  <div>
                    <CorporateFieldLabel>Action</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </div>
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
                  <div>
                    <CorporateFieldLabel>Status</CorporateFieldLabel>
                    <input
                      className={corporateInputClass()}
                      value={editing.status}
                      onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
