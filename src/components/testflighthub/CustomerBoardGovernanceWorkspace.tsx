"use client";

import Link from "next/link";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { AlertTriangle, CalendarDays, FileText, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import {
  deleteCustomerBoardAction,
  deleteCustomerBoardDecision,
  deleteCustomerBoardMeeting,
  deleteCustomerBoardMinute,
  deleteCustomerBoardRisk,
  getCustomerBoardGovernanceSnapshot,
  subscribeCustomerBoardGovernance,
  upsertCustomerBoardAction,
  upsertCustomerBoardDecision,
  upsertCustomerBoardMeeting,
  upsertCustomerBoardMinute,
  upsertCustomerBoardRisk,
  type CustomerBoardAction,
  type CustomerBoardDecision,
  type CustomerBoardMeeting,
  type CustomerBoardMinute,
  type CustomerBoardRisk,
} from "@/lib/customer-board-governance-store";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import type { AbhiBoardPortalSection } from "@/lib/abhi/board-portal-data";
import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";

function inputClass() {
  return "mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40";
}

export default function CustomerBoardGovernanceWorkspace({
  section,
}: {
  section: AbhiBoardPortalSection;
}) {
  const basePath = useInternalOperationsBasePath();
  const slug = readBrowserCustomerWorkspaceSlug();
  const membersHref = getInternalNavHref("board-members", basePath);
  const [snapshot, setSnapshot] = useState(() => getCustomerBoardGovernanceSnapshot(slug));
  const [editor, setEditor] = useState<
    | { kind: "meeting"; row: Partial<CustomerBoardMeeting> & { id?: string } }
    | { kind: "action"; row: Partial<CustomerBoardAction> & { id?: string } }
    | { kind: "risk"; row: Partial<CustomerBoardRisk> & { id?: string } }
    | { kind: "minute"; row: Partial<CustomerBoardMinute> & { id?: string } }
    | { kind: "decision"; row: Partial<CustomerBoardDecision> & { id?: string } }
    | null
  >(null);

  useEffect(
    () => subscribeCustomerBoardGovernance(() => setSnapshot(getCustomerBoardGovernanceSnapshot(slug))),
    [slug],
  );

  const nextMeeting = snapshot.meetings[0] ?? null;

  function saveEditor() {
    if (!editor) return;
    if (editor.kind === "meeting") {
      upsertCustomerBoardMeeting(
        {
          id: editor.row.id,
          title: String(editor.row.title ?? "").trim(),
          scheduledFor: String(editor.row.scheduledFor ?? ""),
          location: String(editor.row.location ?? ""),
          notes: String(editor.row.notes ?? ""),
        },
        slug,
      );
    } else if (editor.kind === "action") {
      upsertCustomerBoardAction(
        {
          id: editor.row.id,
          title: String(editor.row.title ?? "").trim(),
          owner: String(editor.row.owner ?? ""),
          dueDate: String(editor.row.dueDate ?? ""),
          status: editor.row.status ?? "open",
        },
        slug,
      );
    } else if (editor.kind === "minute") {
      upsertCustomerBoardMinute(
        {
          id: editor.row.id,
          title: String(editor.row.title ?? "").trim(),
          meetingDate: String(editor.row.meetingDate ?? ""),
          content: String(editor.row.content ?? ""),
          status: editor.row.status ?? "draft",
        },
        slug,
      );
    } else if (editor.kind === "decision") {
      upsertCustomerBoardDecision(
        {
          id: editor.row.id,
          title: String(editor.row.title ?? "").trim(),
          decidedOn: String(editor.row.decidedOn ?? ""),
          owner: String(editor.row.owner ?? ""),
          notes: String(editor.row.notes ?? ""),
        },
        slug,
      );
    } else {
      upsertCustomerBoardRisk(
        {
          id: editor.row.id,
          title: String(editor.row.title ?? "").trim(),
          owner: String(editor.row.owner ?? ""),
          impact: editor.row.impact ?? "M",
          status: editor.row.status ?? "active",
        },
        slug,
      );
    }
    setEditor(null);
  }

  if (section === "dashboard") {
    return (
      <div className="space-y-4 p-2 sm:p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">Board dashboard</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Governance at a glance</h2>
          <p className="mt-2 text-sm text-white/55">
            Next meeting, approved packs, actions, risks, and recent decisions.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <GovernanceCard
            icon={CalendarDays}
            title="Next board meeting"
            body={nextMeeting ? `${nextMeeting.title} · ${nextMeeting.scheduledFor || "Unscheduled"}` : "No scheduled meeting."}
            onAdd={() => setEditor({ kind: "meeting", row: { title: "", scheduledFor: "", location: "", notes: "" } })}
          />
          <GovernanceCard
            icon={FileText}
            title="Latest approved board pack"
            body="No approved board packs yet."
          />
          <ListCard
            icon={ListChecks}
            title="Open board actions"
            empty="No open board actions."
            rows={snapshot.actions.map((row) => ({
              id: row.id,
              label: row.title,
              meta: `${row.owner || "Unassigned"} · ${row.status}`,
              onEdit: () => setEditor({ kind: "action", row }),
              onDelete: () => {
                if (window.confirm(`Delete action ${row.title}?`)) deleteCustomerBoardAction(row.id, slug);
              },
            }))}
            onAdd={() => setEditor({ kind: "action", row: { title: "", owner: "", dueDate: "", status: "open" } })}
          />
          <ListCard
            icon={AlertTriangle}
            title="High risks"
            empty="No high risks recorded."
            rows={snapshot.risks.map((row) => ({
              id: row.id,
              label: row.title,
              meta: `Impact ${row.impact} · ${row.status}`,
              onEdit: () => setEditor({ kind: "risk", row }),
              onDelete: () => {
                if (window.confirm(`Delete risk ${row.title}?`)) deleteCustomerBoardRisk(row.id, slug);
              },
            }))}
            onAdd={() => setEditor({ kind: "risk", row: { title: "", owner: "", impact: "M", status: "active" } })}
          />
        </div>
        <p className="text-sm text-white/45">
          Manage directors in{" "}
          <Link href={membersHref} className="text-sky-300 hover:text-sky-200">
            Board → Board Members
          </Link>
          .
        </p>
        {editor ? <EditorPanel editor={editor} setEditor={setEditor} onSave={saveEditor} /> : null}
      </div>
    );
  }

  if (section === "meetings") {
    return (
      <SectionList
        title="Board meetings"
        empty="No board meetings scheduled."
        rows={snapshot.meetings}
        render={(row) => `${row.title} · ${row.scheduledFor || "Unscheduled"}`}
        onAdd={() => setEditor({ kind: "meeting", row: { title: "", scheduledFor: "", location: "", notes: "" } })}
        onEdit={(row) => setEditor({ kind: "meeting", row })}
        onDelete={(row) => {
          if (window.confirm(`Delete meeting ${row.title}?`)) deleteCustomerBoardMeeting(row.id, slug);
        }}
        editor={editor}
        setEditor={setEditor}
        onSave={saveEditor}
      />
    );
  }

  if (section === "minutes") {
    return (
      <div className="space-y-4 p-2 sm:p-4">
        <SectionList
          title="Board minutes"
          empty="No board minutes on file yet."
          rows={snapshot.minutes}
          render={(row) => `${row.title} · ${row.meetingDate || "Undated"} · ${row.status}`}
          onAdd={() =>
            setEditor({
              kind: "minute",
              row: { title: "", meetingDate: "", content: "", status: "draft" },
            })
          }
          onEdit={(row) => setEditor({ kind: "minute", row })}
          onDelete={(row) => {
            if (window.confirm(`Delete minutes ${row.title}?`)) deleteCustomerBoardMinute(row.id, slug);
          }}
          editor={editor}
          setEditor={setEditor}
          onSave={saveEditor}
        />
        <SectionList
          title="Board decisions"
          empty="No board decisions recorded yet."
          rows={snapshot.decisions}
          render={(row) => `${row.title} · ${row.decidedOn || "Undated"} · ${row.owner || "Unassigned"}`}
          onAdd={() =>
            setEditor({
              kind: "decision",
              row: { title: "", decidedOn: "", owner: "", notes: "" },
            })
          }
          onEdit={(row) => setEditor({ kind: "decision", row })}
          onDelete={(row) => {
            if (window.confirm(`Delete decision ${row.title}?`)) deleteCustomerBoardDecision(row.id, slug);
          }}
          editor={editor}
          setEditor={setEditor}
          onSave={saveEditor}
        />
      </div>
    );
  }

  if (section === "risk" || section === "decks") {
    return (
      <SectionList
        title="Risk register"
        empty="No board risks recorded yet."
        rows={snapshot.risks}
        render={(row) => `${row.title} · Impact ${row.impact} · ${row.status}`}
        onAdd={() => setEditor({ kind: "risk", row: { title: "", owner: "", impact: "M", status: "active" } })}
        onEdit={(row) => setEditor({ kind: "risk", row })}
        onDelete={(row) => {
          if (window.confirm(`Delete risk ${row.title}?`)) deleteCustomerBoardRisk(row.id, slug);
        }}
        editor={editor}
        setEditor={setEditor}
        onSave={saveEditor}
      />
    );
  }

  return null;
}

function GovernanceCard({
  icon: Icon,
  title,
  body,
  onAdd,
}: {
  icon: typeof CalendarDays;
  title: string;
  body: string;
  onAdd?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-white/70">
          <Icon className="h-4 w-4" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {onAdd ? (
          <button type="button" onClick={onAdd} className="text-xs text-sky-300 hover:text-sky-200">
            <Plus className="mr-1 inline h-3 w-3" />
            Add
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-white/50">{body}</p>
    </section>
  );
}

function ListCard({
  icon: Icon,
  title,
  empty,
  rows,
  onAdd,
}: {
  icon: typeof CalendarDays;
  title: string;
  empty: string;
  rows: Array<{ id: string; label: string; meta: string; onEdit: () => void; onDelete: () => void }>;
  onAdd: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-white/70">
          <Icon className="h-4 w-4" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <button type="button" onClick={onAdd} className="text-xs text-sky-300 hover:text-sky-200">
          <Plus className="mr-1 inline h-3 w-3" />
          Add
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">{empty}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
              <div>
                <p className="text-sm text-white/85">{row.label}</p>
                <p className="text-xs text-white/45">{row.meta}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={row.onEdit} className="rounded border border-white/15 px-2 py-1 text-xs text-white/75">
                  Edit
                </button>
                <button type="button" onClick={row.onDelete} className="rounded border border-rose-400/25 px-2 py-1 text-xs text-rose-200">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionList<T extends { id: string; title: string }>({
  title,
  empty,
  rows,
  render,
  onAdd,
  onEdit,
  onDelete,
  editor,
  setEditor,
  onSave,
}: {
  title: string;
  empty: string;
  rows: T[];
  render: (row: T) => string;
  onAdd: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  editor:
    | { kind: "meeting"; row: Partial<CustomerBoardMeeting> & { id?: string } }
    | { kind: "action"; row: Partial<CustomerBoardAction> & { id?: string } }
    | { kind: "risk"; row: Partial<CustomerBoardRisk> & { id?: string } }
    | { kind: "minute"; row: Partial<CustomerBoardMinute> & { id?: string } }
    | { kind: "decision"; row: Partial<CustomerBoardDecision> & { id?: string } }
    | null;
  setEditor: Dispatch<SetStateAction<typeof editor>>;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-white/50">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1524]/70 px-3 py-2">
              <p className="text-sm text-white/85">{render(row)}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => onEdit(row)} className="rounded border border-white/15 px-2 py-1 text-xs text-white/75">
                  <Pencil className="mr-1 inline h-3 w-3" />
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(row)} className="rounded border border-rose-400/25 px-2 py-1 text-xs text-rose-200">
                  <Trash2 className="mr-1 inline h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editor ? <EditorPanel editor={editor} setEditor={setEditor} onSave={onSave} /> : null}
    </div>
  );
}

function EditorPanel({
  editor,
  setEditor,
  onSave,
}: {
  editor:
    | { kind: "meeting"; row: Partial<CustomerBoardMeeting> & { id?: string } }
    | { kind: "action"; row: Partial<CustomerBoardAction> & { id?: string } }
    | { kind: "risk"; row: Partial<CustomerBoardRisk> & { id?: string } }
    | { kind: "minute"; row: Partial<CustomerBoardMinute> & { id?: string } }
    | { kind: "decision"; row: Partial<CustomerBoardDecision> & { id?: string } };
  setEditor: Dispatch<
    SetStateAction<
      | { kind: "meeting"; row: Partial<CustomerBoardMeeting> & { id?: string } }
      | { kind: "action"; row: Partial<CustomerBoardAction> & { id?: string } }
      | { kind: "risk"; row: Partial<CustomerBoardRisk> & { id?: string } }
      | { kind: "minute"; row: Partial<CustomerBoardMinute> & { id?: string } }
      | { kind: "decision"; row: Partial<CustomerBoardDecision> & { id?: string } }
      | null
    >
  >;
  onSave: () => void;
}) {
  function updateTitle(title: string) {
    setEditor((current) => {
      if (!current) return current;
      return { ...current, row: { ...current.row, title } } as typeof current;
    });
  }

  function updateMeetingField(field: "scheduledFor", value: string) {
    setEditor((current) =>
      current?.kind === "meeting"
        ? { kind: "meeting", row: { ...current.row, [field]: value } }
        : current,
    );
  }

  function updateOwner(owner: string) {
    setEditor((current) => {
      if (!current || current.kind === "meeting" || current.kind === "minute" || current.kind === "decision") {
        return current;
      }
      if (current.kind === "action") {
        return { kind: "action", row: { ...current.row, owner } };
      }
      return { kind: "risk", row: { ...current.row, owner } };
    });
  }

  return (
    <section className="rounded-2xl border border-sky-400/25 bg-sky-500/5 p-4">
      <p className="text-sm font-medium text-white">Edit {editor.kind}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-white/55 sm:col-span-2">
          Title
          <input
            value={String(editor.row.title ?? "")}
            onChange={(event) => updateTitle(event.target.value)}
            className={inputClass()}
          />
        </label>
        {editor.kind === "meeting" ? (
          <label className="block text-xs text-white/55">
            Scheduled for
            <input
              type="date"
              value={String(editor.row.scheduledFor ?? "")}
              onChange={(event) => updateMeetingField("scheduledFor", event.target.value)}
              className={inputClass()}
            />
          </label>
        ) : null}
        {editor.kind === "minute" ? (
          <>
            <label className="block text-xs text-white/55">
              Meeting date
              <input
                type="date"
                value={String(editor.row.meetingDate ?? "")}
                onChange={(event) =>
                  setEditor((current) =>
                    current?.kind === "minute"
                      ? { kind: "minute", row: { ...current.row, meetingDate: event.target.value } }
                      : current,
                  )
                }
                className={inputClass()}
              />
            </label>
            <label className="block text-xs text-white/55">
              Status
              <select
                value={String(editor.row.status ?? "draft")}
                onChange={(event) =>
                  setEditor((current) =>
                    current?.kind === "minute"
                      ? {
                          kind: "minute",
                          row: {
                            ...current.row,
                            status: event.target.value as CustomerBoardMinute["status"],
                          },
                        }
                      : current,
                  )
                }
                className={inputClass()}
              >
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
              </select>
            </label>
            <label className="block text-xs text-white/55 sm:col-span-2">
              Minutes
              <textarea
                value={String(editor.row.content ?? "")}
                onChange={(event) =>
                  setEditor((current) =>
                    current?.kind === "minute"
                      ? { kind: "minute", row: { ...current.row, content: event.target.value } }
                      : current,
                  )
                }
                className={inputClass()}
                rows={4}
              />
            </label>
          </>
        ) : null}
        {editor.kind === "decision" ? (
          <>
            <label className="block text-xs text-white/55">
              Decided on
              <input
                type="date"
                value={String(editor.row.decidedOn ?? "")}
                onChange={(event) =>
                  setEditor((current) =>
                    current?.kind === "decision"
                      ? { kind: "decision", row: { ...current.row, decidedOn: event.target.value } }
                      : current,
                  )
                }
                className={inputClass()}
              />
            </label>
            <label className="block text-xs text-white/55">
              Owner
              <input
                value={String(editor.row.owner ?? "")}
                onChange={(event) =>
                  setEditor((current) =>
                    current?.kind === "decision"
                      ? { kind: "decision", row: { ...current.row, owner: event.target.value } }
                      : current,
                  )
                }
                className={inputClass()}
              />
            </label>
            <label className="block text-xs text-white/55 sm:col-span-2">
              Notes
              <textarea
                value={String(editor.row.notes ?? "")}
                onChange={(event) =>
                  setEditor((current) =>
                    current?.kind === "decision"
                      ? { kind: "decision", row: { ...current.row, notes: event.target.value } }
                      : current,
                  )
                }
                className={inputClass()}
                rows={3}
              />
            </label>
          </>
        ) : null}
        {editor.kind === "action" || editor.kind === "risk" ? (
          <label className="block text-xs text-white/55">
            Owner
            <input
              value={String(editor.row.owner ?? "")}
              onChange={(event) => updateOwner(event.target.value)}
              className={inputClass()}
            />
          </label>
        ) : null}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onSave} className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white">
          Save
        </button>
        <button type="button" onClick={() => setEditor(null)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/75">
          Cancel
        </button>
      </div>
    </section>
  );
}
