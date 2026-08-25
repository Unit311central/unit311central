"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  archiveNorthstarBoardMeeting,
  deleteNorthstarBoardMeeting,
  upsertNorthstarBoardMeeting,
  type NorthstarBoardMeeting,
  type NorthstarMeetingAction,
  type NorthstarMeetingActionStatus,
  type NorthstarMeetingDecision,
} from "@/lib/demo/northstar-board-meetings-store";
import {
  archiveNorthstarBoardPack,
  createNorthstarBoardPackDraft,
  deleteNorthstarBoardPack,
  getNorthstarBoardPack,
  loadNorthstarBoardPacks,
  resolveNorthstarPackPdfUrl,
  resolveNorthstarPackDownloadUrl,
  saveNorthstarBoardPack,
  type NorthstarBoardPackRecord,
} from "@/lib/demo/northstar-board-pack-store";
import {
  archiveNorthstarRisk,
  computeNorthstarRiskRating,
  deleteNorthstarRisk,
  upsertNorthstarRisk,
  type NorthstarMitigationStatus,
  type NorthstarRiskLevel,
  type NorthstarRiskRegisterEntry,
  type NorthstarRiskTrend,
} from "@/lib/demo/northstar-risk-register-store";
import { DEMO_COMPANY_SHORT_NAME } from "@/lib/demo/demo-company-identity";
import { DocumentPdfModal } from "@/components/workspace-ui/DocumentPdfModal";
import { cn } from "@/lib/utils";
import {
  CorporateFieldLabel,
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { useNorthstarBoardMeetingsStore } from "@/components/testflighthub/useNorthstarBoardMeetingsStore";
import { useNorthstarRiskRegisterStore } from "@/components/testflighthub/useNorthstarRiskRegisterStore";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
        {DEMO_COMPANY_SHORT_NAME} · Board
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-white/55">{subtitle}</p>
    </header>
  );
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

type MeetingFormState = {
  id?: string;
  meetingDate: string;
  title: string;
  notes: string;
  status: NorthstarBoardMeeting["status"];
  boardPackId: string;
  agendaText: string;
  resolutionsText: string;
  decisionsText: string;
  actionsText: string;
  attendeesText: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyMeetingForm(): MeetingFormState {
  return {
    meetingDate: todayIso(),
    title: "",
    notes: "",
    status: "Draft",
    boardPackId: "",
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

function parseAttendees(text: string): NorthstarBoardMeeting["attendees"] {
  return linesToList(text).map((line) => {
    const [name, role] = line.split("|").map((part) => part.trim());
    return { name: name || line, role: role || "" };
  });
}

function parseDecisions(text: string): NorthstarMeetingDecision[] {
  return linesToList(text).map((line, index) => {
    const [decision, resolution] = line.split("|").map((part) => part.trim());
    return {
      id: `NS-D-${String(index + 1).padStart(2, "0")}`,
      text: decision || line,
      resolution: resolution || "",
    };
  });
}

function parseActions(text: string): NorthstarMeetingAction[] {
  return linesToList(text).map((line, index) => {
    const [title, owner, dueDate, status] = line.split("|").map((part) => part.trim());
    return {
      id: `NS-A-${String(200 + index)}`,
      title: title || line,
      owner: owner || "",
      dueDate: dueDate || todayIso(),
      status: (status || "Underway") as NorthstarMeetingActionStatus,
    };
  });
}

function meetingFormFrom(meeting: NorthstarBoardMeeting): MeetingFormState {
  return {
    id: meeting.id,
    meetingDate: meeting.meetingDate,
    title: meeting.title,
    notes: meeting.notes,
    status: meeting.status,
    boardPackId: meeting.boardPackId ?? "",
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

export function NorthstarBoardMeetingsWorkspace() {
  const store = useNorthstarBoardMeetingsStore();
  const packs = useMemo(() => loadNorthstarBoardPacks(), []);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<MeetingFormState | null>(null);
  const [viewMeeting, setViewMeeting] = useState<NorthstarBoardMeeting | null>(null);

  const active = useMemo(
    () => store.meetings.filter((m) => m.status !== "Archived"),
    [store.meetings],
  );
  const outstanding = active.flatMap((m) =>
    m.actions.filter((a) => a.status !== "Completed" && a.status !== "Closed"),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.meetings
      .filter((m) => (showArchived ? true : m.status !== "Archived"))
      .filter((m) => {
        if (!q) return true;
        return [m.id, m.title, m.meetingDate, m.notes].join(" ").toLowerCase().includes(q);
      })
      .slice()
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  }, [search, showArchived, store.meetings]);

  function saveForm() {
    if (!form?.meetingDate) return;
    upsertNorthstarBoardMeeting({
      id: form.id,
      meetingDate: form.meetingDate,
      title: form.title || `Northstar Board Meeting — ${form.meetingDate}`,
      notes: form.notes,
      status: form.status,
      boardPackId: form.boardPackId.trim() || undefined,
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
      <PageHeader
        title="Board Meetings"
        subtitle="Quarterly cadence — Q1 & Q2 2026 held; Q3 September and Q4 December scheduled. Link each meeting to its board pack."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CorporateKpiTile label="Active meetings" value={String(active.length)} />
        <CorporateKpiTile label="Held (2026)" value="2" hint="Q1 & Q2 complete" />
        <CorporateKpiTile label="Outstanding actions" value={String(outstanding.length)} />
        <CorporateKpiTile label="Next" value="Sep 2026" hint="Q3 board meeting" />
      </div>

      <CorporateSection
        title="Meeting register"
        subtitle="Add or edit meetings. Board packs link from the Board deck column."
        actions={
          <button
            type="button"
            className={corporatePrimaryButtonClass()}
            onClick={() => setForm(emptyMeetingForm())}
          >
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
                <th className="px-3 py-2.5">Board deck</th>
                <th className="px-3 py-2.5">Controls</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((meeting) => {
                const pack = meeting.boardPackId
                  ? getNorthstarBoardPack(meeting.boardPackId)
                  : null;
                return (
                  <tr key={meeting.id} className="border-t border-white/8">
                    <td className="px-3 py-3 text-white/80">{formatDate(meeting.meetingDate)}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-white">{meeting.title}</p>
                      <p className="text-xs text-white/45">{meeting.id}</p>
                    </td>
                    <td className="px-3 py-3">
                      <CorporateStatusPill
                        className={
                          meeting.status === "Held"
                            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                            : undefined
                        }
                      >
                        {meeting.status}
                      </CorporateStatusPill>
                    </td>
                    <td className="px-3 py-3">
                      {pack ? (
                        <a
                          href={resolveNorthstarPackPdfUrl(pack.meetingDate, pack.pdfOpenUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-sky-300 hover:text-sky-200"
                        >
                          {pack.packName}
                        </a>
                      ) : (
                        <span className="text-xs text-white/40">—</span>
                      )}
                    </td>
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
                          onClick={() => setForm(meetingFormFrom(meeting))}
                        >
                          Edit
                        </button>
                        {meeting.status !== "Archived" ? (
                          <button
                            type="button"
                            className={corporateSecondaryButtonClass()}
                            onClick={() => archiveNorthstarBoardMeeting(meeting.id)}
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
                              deleteNorthstarBoardMeeting(meeting.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CorporateSection>

      {viewMeeting ? (
        <Modal title={viewMeeting.title} onClose={() => setViewMeeting(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <CorporateFieldLabel>Date</CorporateFieldLabel>
              <p className="text-sm text-white/80">{formatDate(viewMeeting.meetingDate)}</p>
            </div>
            <div>
              <CorporateFieldLabel>Status</CorporateFieldLabel>
              <p className="text-sm text-white/80">{viewMeeting.status}</p>
            </div>
          </div>
          {viewMeeting.boardPackId ? (
            <div className="mt-4">
              <CorporateFieldLabel>Board pack</CorporateFieldLabel>
              {(() => {
                const pack = getNorthstarBoardPack(viewMeeting.boardPackId!);
                if (!pack) return <p className="text-sm text-white/45">—</p>;
                return (
                  <a
                    href={resolveNorthstarPackPdfUrl(pack.meetingDate, pack.pdfOpenUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-sky-300 hover:underline"
                  >
                    {pack.packName}
                  </a>
                );
              })()}
            </div>
          ) : null}
          <div className="mt-4">
            <CorporateFieldLabel>Minutes summary</CorporateFieldLabel>
            <p className="text-sm text-white/75">{viewMeeting.notes || "—"}</p>
          </div>
          <div className="mt-4">
            <CorporateFieldLabel>Decisions</CorporateFieldLabel>
            <ul className="mt-1 space-y-1 text-sm text-white/75">
              {viewMeeting.decisions.map((d) => (
                <li key={d.id}>
                  • {d.text}
                  {d.resolution ? <span className="text-white/45"> — {d.resolution}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      ) : null}

      {form ? (
        <Modal
          title={form.id ? "Edit board meeting" : "New board meeting"}
          onClose={() => setForm(null)}
        >
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
                  setForm({
                    ...form,
                    status: e.target.value as NorthstarBoardMeeting["status"],
                  })
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
          <div className="mt-3">
            <CorporateFieldLabel>Linked board pack</CorporateFieldLabel>
            <select
              className={corporateInputClass()}
              value={form.boardPackId}
              onChange={(e) => setForm({ ...form, boardPackId: e.target.value })}
            >
              <option value="">— None —</option>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.packName}
                </option>
              ))}
            </select>
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
          <div className="mt-3">
            <CorporateFieldLabel>Meeting notes / minutes summary</CorporateFieldLabel>
            <textarea
              className={`${corporateInputClass()} min-h-[80px]`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className={corporateSecondaryButtonClass()}
              onClick={() => setForm(null)}
            >
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

export function NorthstarBoardPacksWorkspace() {
  const [decks, setDecks] = useState<NorthstarBoardPackRecord[]>(() =>
    loadNorthstarBoardPacks().filter((pack) => pack.status !== "Archived"),
  );
  const [previewPackId, setPreviewPackId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<NorthstarBoardPackRecord | null>(null);
  const meetings = useNorthstarBoardMeetingsStore().meetings;

  const previewPack = useMemo(
    () => decks.find((pack) => pack.id === previewPackId) ?? null,
    [decks, previewPackId],
  );

  function refreshDecks() {
    const next = loadNorthstarBoardPacks().filter((pack) => pack.status !== "Archived");
    setDecks(next);
    if (previewPackId && !next.some((pack) => pack.id === previewPackId)) {
      setPreviewPackId(null);
    }
  }

  function handleAiCreate() {
    const next = meetings.find((m) => m.status === "Scheduled");
    const draft = createNorthstarBoardPackDraft({
      meetingId: next?.id,
      meetingDate: next?.meetingDate ?? "2026-09-18",
      quarter: next?.title.includes("Q3") ? "Q3 2026" : "Q4 2026",
    });
    saveNorthstarBoardPack(draft);
    refreshDecks();
    setPreviewPackId(draft.id);
    setMessage(`Created draft pack for ${draft.quarter}. Click Preview to open the PDF.`);
  }

  function saveEdit() {
    if (!editing?.packName.trim()) return;
    saveNorthstarBoardPack(editing);
    refreshDecks();
    setEditing(null);
    setMessage("Board deck updated.");
  }

  const previewUrl = previewPack
    ? resolveNorthstarPackPdfUrl(previewPack.meetingDate, previewPack.pdfOpenUrl)
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Board Decks"
          subtitle="Quarterly board packs — create, edit, preview, and archive."
        />
        <button type="button" className={cn(corporatePrimaryButtonClass(), "shrink-0")} onClick={handleAiCreate}>
          <Sparkles className="h-3.5 w-3.5" />
          Create board pack
        </button>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        {decks.map((pack) => {
          const pdfUrl = resolveNorthstarPackPdfUrl(pack.meetingDate, pack.pdfOpenUrl);
          const downloadUrl = resolveNorthstarPackDownloadUrl(pack.meetingDate, pack.pptxDownloadUrl);
          return (
            <article
              key={pack.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 sm:p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-white">{pack.packName}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {pack.quarter} · Meeting {formatDate(pack.meetingDate)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 self-start rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
                    pack.status === "Approved" || pack.status === "Final"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-100",
                  )}
                >
                  {pack.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => setPreviewPackId(pack.id)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Preview
                </button>
                <a
                  href={downloadUrl}
                  download={`demo-board-deck-${pack.meetingDate}.pdf`}
                  className={corporateSecondaryButtonClass()}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => setEditing({ ...pack })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => {
                    archiveNorthstarBoardPack(pack.id);
                    refreshDecks();
                    setMessage(`Archived ${pack.packName}.`);
                  }}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => {
                    deleteNorthstarBoardPack(pack.id);
                    refreshDecks();
                    setMessage(`Deleted ${pack.packName}.`);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {previewPack && previewUrl ? (
        <DocumentPdfModal
          title={previewPack.packName}
          pdfUrl={previewUrl}
          downloadFilename={`demo-board-deck-${previewPack.meetingDate}.pdf`}
          onClose={() => setPreviewPackId(null)}
        />
      ) : null}

      {editing ? (
        <Modal title="Edit board deck" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div>
              <CorporateFieldLabel>Pack name</CorporateFieldLabel>
              <input
                className={corporateInputClass()}
                value={editing.packName}
                onChange={(e) => setEditing({ ...editing, packName: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Quarter</CorporateFieldLabel>
              <input
                className={corporateInputClass()}
                value={editing.quarter}
                onChange={(e) => setEditing({ ...editing, quarter: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Meeting date</CorporateFieldLabel>
              <input
                type="date"
                className={corporateInputClass()}
                value={editing.meetingDate}
                onChange={(e) => setEditing({ ...editing, meetingDate: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Status</CorporateFieldLabel>
              <select
                className={corporateInputClass()}
                value={editing.status}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as NorthstarBoardPackRecord["status"],
                  })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Final">Final</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
            <div>
              <CorporateFieldLabel>Page summaries (one per line)</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[90px]`}
                value={editing.pageSummaries.join("\n")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    pageSummaries: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className={corporatePrimaryButtonClass()} onClick={saveEdit}>
              Save
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

const RISK_LEVELS: NorthstarRiskLevel[] = ["H", "M", "L"];
const TRENDS: NorthstarRiskTrend[] = ["↑", "→", "↓"];
const MITIGATION_STATUSES: NorthstarMitigationStatus[] = [
  "Open",
  "Ongoing",
  "Overdue for mitigation",
  "Monitoring",
  "Closed",
];

type RiskFormState = {
  id?: string;
  description: string;
  owner: string;
  impact: NorthstarRiskLevel;
  likelihood: NorthstarRiskLevel;
  rating: string;
  trend: NorthstarRiskTrend;
  mitigation: string;
  status: NorthstarMitigationStatus;
  dateRaised: string;
  reviewDate: string;
};

function emptyRiskForm(): RiskFormState {
  return {
    description: "",
    owner: "",
    impact: "M",
    likelihood: "M",
    rating: String(computeNorthstarRiskRating("M", "M")),
    trend: "→",
    mitigation: "",
    status: "Open",
    dateRaised: todayIso(),
    reviewDate: todayIso(),
  };
}

function riskFormFrom(risk: NorthstarRiskRegisterEntry): RiskFormState {
  return {
    id: risk.id,
    description: risk.description,
    owner: risk.owner,
    impact: risk.impact,
    likelihood: risk.likelihood,
    rating: String(risk.rating),
    trend: risk.trend,
    mitigation: risk.mitigation,
    status: risk.status,
    dateRaised: risk.dateRaised,
    reviewDate: risk.reviewDate,
  };
}

function ratingTone(rating: number) {
  if (rating >= 15) return "border-rose-400/35 bg-rose-500/15 text-rose-100";
  if (rating >= 9) return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
}

function statusTone(status: NorthstarMitigationStatus) {
  if (status === "Overdue for mitigation") {
    return "border-rose-400/35 bg-rose-500/15 text-rose-100";
  }
  if (status === "Ongoing") return "border-violet-400/35 bg-violet-500/15 text-violet-100";
  if (status === "Open") return "border-sky-400/35 bg-sky-500/15 text-sky-100";
  if (status === "Monitoring") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  return "border-white/15 bg-white/[0.04] text-white/55";
}

function riskBandLabel(rating: number): "High" | "Medium" | "Low" {
  if (rating >= 15) return "High";
  if (rating >= 9) return "Medium";
  return "Low";
}

function SimpleRiskOverview({ risks }: { risks: NorthstarRiskRegisterEntry[] }) {
  const bands = { High: 0, Medium: 0, Low: 0 } as Record<"High" | "Medium" | "Low", number>;
  for (const risk of risks) {
    bands[riskBandLabel(risk.rating)] += 1;
  }
  const total = risks.length || 1;
  const items: Array<{ label: "High" | "Medium" | "Low"; tone: string; bar: string }> = [
    { label: "High", tone: "text-rose-100", bar: "bg-rose-500" },
    { label: "Medium", tone: "text-amber-100", bar: "bg-amber-500" },
    { label: "Low", tone: "text-emerald-100", bar: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/55">
        Risks grouped by score band — high is 15+, medium is 9–14, low is below 9.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(({ label, tone, bar }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className={`text-2xl font-semibold ${tone}`}>{bands[label]}</p>
            <p className="text-xs uppercase tracking-wide text-white/45">{label} priority</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${bar}`}
                style={{ width: `${Math.round((bands[label] / total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NorthstarBoardRisksWorkspace() {
  const store = useNorthstarRiskRegisterStore();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<RiskFormState | null>(null);

  const activeRisks = useMemo(
    () => store.risks.filter((row) => !row.archived),
    [store.risks],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.risks
      .filter((row) => (showArchived ? true : !row.archived))
      .filter((row) => {
        if (!q) return true;
        return [row.id, row.description, row.owner, row.status].join(" ").toLowerCase().includes(q);
      })
      .slice()
      .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
  }, [search, showArchived, store.risks]);

  function saveRiskForm() {
    if (!form?.description.trim()) return;
    upsertNorthstarRisk({
      id: form.id,
      description: form.description,
      owner: form.owner,
      impact: form.impact,
      likelihood: form.likelihood,
      rating: Number(form.rating),
      trend: form.trend,
      mitigation: form.mitigation,
      status: form.status,
      dateRaised: form.dateRaised,
      reviewDate: form.reviewDate,
    });
    setForm(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Risk Register"
        subtitle="Editable board risks — highest rating first, simple priority bands, mitigation status including overdue items."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CorporateKpiTile label="Active risks" value={activeRisks.length} />
        <CorporateKpiTile
          label="High rating"
          value={activeRisks.filter((r) => r.rating >= 15).length}
          hint="Score ≥ 15"
        />
        <CorporateKpiTile
          label="Overdue mitigation"
          value={activeRisks.filter((r) => r.status === "Overdue for mitigation").length}
        />
        <CorporateKpiTile label="Open" value={activeRisks.filter((r) => r.status === "Open").length} />
      </section>

      <CorporateSection title="Risk overview" subtitle="How many risks sit in each priority band.">
        <SimpleRiskOverview risks={activeRisks} />
      </CorporateSection>

      <CorporateSection
        title="Risk register"
        subtitle="Sorted by rating (highest first)."
        actions={
          <button type="button" className={corporatePrimaryButtonClass()} onClick={() => setForm(emptyRiskForm())}>
            <Plus className="h-3.5 w-3.5" />
            Add risk
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              className={`${corporateInputClass()} pl-9`}
              placeholder="Search risks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white/70">
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
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((risk) => (
                  <tr key={risk.id} className="border-b border-white/8 text-white/85">
                    <td className="px-4 py-3 font-medium">{risk.id}</td>
                    <td className="max-w-[280px] px-4 py-3">
                      <p>{risk.description}</p>
                      <p className="mt-1 text-xs text-white/45">{risk.owner}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                          ratingTone(risk.rating),
                        )}
                      >
                        {risk.rating} ({risk.impact}/{risk.likelihood})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CorporateStatusPill className={statusTone(risk.status)}>
                        {risk.status}
                      </CorporateStatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => setForm(riskFormFrom(risk))}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => archiveNorthstarRisk(risk.id, !risk.archived)}
                        >
                          {risk.archived ? "Restore" : "Archive"}
                        </button>
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => {
                            if (window.confirm(`Delete ${risk.id}?`)) deleteNorthstarRisk(risk.id);
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

      {form ? (
        <Modal title={form.id ? `Edit ${form.id}` : "Add risk"} onClose={() => setForm(null)}>
          <div className="space-y-3">
            <div>
              <CorporateFieldLabel>Description</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[80px]`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <CorporateFieldLabel>Owner</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>Status</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as NorthstarMitigationStatus })
                  }
                >
                  {MITIGATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <CorporateFieldLabel>Impact</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.impact}
                  onChange={(e) => {
                    const impact = e.target.value as NorthstarRiskLevel;
                    setForm({
                      ...form,
                      impact,
                      rating: String(computeNorthstarRiskRating(impact, form.likelihood)),
                    });
                  }}
                >
                  {RISK_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <CorporateFieldLabel>Likelihood</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.likelihood}
                  onChange={(e) => {
                    const likelihood = e.target.value as NorthstarRiskLevel;
                    setForm({
                      ...form,
                      likelihood,
                      rating: String(computeNorthstarRiskRating(form.impact, likelihood)),
                    });
                  }}
                >
                  {RISK_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <CorporateFieldLabel>Trend</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.trend}
                  onChange={(e) =>
                    setForm({ ...form, trend: e.target.value as NorthstarRiskTrend })
                  }
                >
                  {TRENDS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <CorporateFieldLabel>Mitigation</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[70px]`}
                value={form.mitigation}
                onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <CorporateFieldLabel>Review date</CorporateFieldLabel>
                <input
                  type="date"
                  className={corporateInputClass()}
                  value={form.reviewDate}
                  onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setForm(null)}>
              Cancel
            </button>
            <button type="button" className={corporatePrimaryButtonClass()} onClick={saveRiskForm}>
              Save risk
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function NorthstarBoardDashboardWorkspace() {
  const meetings = useNorthstarBoardMeetingsStore().meetings;
  const risks = useNorthstarRiskRegisterStore().risks;
  const activeRisks = risks.filter((r) => !r.archived);
  const highRisks = activeRisks.filter((r) => r.rating >= 15).length;
  const nextMeeting = meetings.find((m) => m.status === "Scheduled");
  const openActions = meetings
    .flatMap((m) => m.actions)
    .filter((a) => a.status !== "Completed" && a.status !== "Closed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Board Dashboard"
        subtitle="Northstar Industrial Technologies — governance overview"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CorporateKpiTile label="2026 held" value="2" hint="Q1 & Q2 complete" />
        <CorporateKpiTile label="Open actions" value={String(openActions)} />
        <CorporateKpiTile label="High risks" value={String(highRisks)} />
        <CorporateKpiTile
          label="Next meeting"
          value={nextMeeting ? formatDate(nextMeeting.meetingDate) : "TBC"}
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
