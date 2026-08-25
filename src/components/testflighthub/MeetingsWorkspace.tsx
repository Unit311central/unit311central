"use client";

import { useCallback, useEffect, useState, startTransition } from "react";

import {
  EXECUTIVE_MEETING_STATUSES,
  formatExecutiveMeetingStatus,
  type ExecutiveMeetingStatus,
} from "@/lib/founder-booking/meeting-slug";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink, FileText, Loader2, Plus, Trash2, Video } from "lucide-react";

type MeetingRow = {
  id: string;
  name: string;
  organization: string;
  role: string | null;
  email: string;
  formattedWhenGmt: string;
  formattedWhenClient: string | null;
  clientTimezone: string;
  status: ExecutiveMeetingStatus;
  statusLabel: string;
  meetingLink: string;
  startReminderSentAt: string | null;
  transcriptSavedAt: string | null;
  transcriptFileId: string | null;
  focusOverviewPdfFileId: string | null;
  focusSelectionsSubmittedAt: string | null;
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function statusClass(status: ExecutiveMeetingStatus) {
  switch (status) {
    case "completed":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
    case "postponed":
      return "border-amber-400/25 bg-amber-500/10 text-amber-200";
    case "cancelled":
      return "border-rose-400/25 bg-rose-500/10 text-rose-200";
    default:
      return "border-sky-400/25 bg-sky-500/10 text-sky-200";
  }
}

export default function MeetingsWorkspace({ salesEmbedded = false }: { salesEmbedded?: boolean }) {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftOrg, setDraftOrg] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftStartsAt, setDraftStartsAt] = useState("");
  const [creating, setCreating] = useState(false);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/meetings", { cache: "no-store" });
      const data = await readApiJson<{ meetings?: MeetingRow[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load meetings");
      setMeetings(data.meetings ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadMeetings();
    });
  }, [loadMeetings]);

  async function handleCreateMeeting() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName,
          organization: draftOrg,
          role: draftRole,
          email: draftEmail,
          startsAt: new Date(draftStartsAt).toISOString(),
        }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to create discovery session");
      setCreateOpen(false);
      setDraftName("");
      setDraftOrg("");
      setDraftRole("");
      setDraftEmail("");
      setDraftStartsAt("");
      await loadMeetings();
      setMessage("Discovery session created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create discovery session");
    } finally {
      setCreating(false);
    }
  }

  function handleStartMeeting(meeting: MeetingRow) {
    setMessage(null);
    setError(null);

    if (!meeting.meetingLink?.trim()) {
      setError("Meeting link is not available for this session.");
      return;
    }

    window.open(meeting.meetingLink, "_blank", "noopener,noreferrer");
  }

  async function handleStatusChange(meetingId: string, status: ExecutiveMeetingStatus) {
    setBusyId(meetingId);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to update status");
      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === meetingId
            ? { ...meeting, status, statusLabel: formatExecutiveMeetingStatus(status) }
            : meeting,
        ),
      );
      setMessage(`Meeting marked as ${formatExecutiveMeetingStatus(status).toLowerCase()}.`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteMeeting(meeting: MeetingRow) {
    if (
      !window.confirm(
        `Delete the executive strategy session for ${meeting.name} (${meeting.organization})? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyId(meeting.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/meetings/${meeting.id}`, { method: "DELETE" });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete meeting");
      setMeetings((current) => current.filter((row) => row.id !== meeting.id));
      setMessage(`Deleted meeting for ${meeting.name}.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete meeting");
    } finally {
      setBusyId(null);
    }
  }

  async function handleOpenTranscript(meeting: MeetingRow) {
    if (!meeting.transcriptFileId) return;
    await openMeetingFile(meeting, meeting.transcriptFileId);
  }

  async function handleOpenFocusPdf(meeting: MeetingRow) {
    if (!meeting.focusOverviewPdfFileId) return;
    await openMeetingFile(meeting, meeting.focusOverviewPdfFileId);
  }

  async function openMeetingFile(meeting: MeetingRow, fileId: string) {
    setBusyId(meeting.id);
    setError(null);
    try {
      const response = await fetch(`/api/files/objects/${fileId}`, {
        cache: "no-store",
      });
      const data = await readApiJson<{ url?: string; error?: string }>(response);
      if (!response.ok || !data.url) throw new Error(data.error ?? "Failed to open file");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Failed to open file");
    } finally {
      setBusyId(null);
    }
  }

  const cellPad = salesEmbedded ? "px-5 py-4" : "px-4 py-3";
  const headPad = salesEmbedded ? "px-5 py-3.5" : "px-4 py-3";
  const secondaryActionClass = salesEmbedded
    ? "inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 text-xs font-medium text-white/70 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    : "inline-flex h-7 items-center gap-1 rounded-md border border-sky-400/25 bg-sky-500/10 px-2 text-[10px] font-semibold text-sky-100 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-4">
      {salesEmbedded ? (
        <>
          <header className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold tracking-tight text-white">Discovery</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/50">
              Executive discovery sessions, meeting status, and follow-up artefacts from your workspace register.
            </p>
          </header>
          <p className="text-sm text-white/50">
            {meetings.length} scheduled session{meetings.length === 1 ? "" : "s"}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setCreateOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-violet-500/15 px-3.5 py-2 text-xs font-medium text-violet-100 hover:bg-violet-500/25"
            >
              <Plus className="h-3.5 w-3.5" />
              Add discovery session
            </button>
          </div>
          {createOpen ? (
            <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
              <input className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Contact name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
              <input className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Organisation" value={draftOrg} onChange={(e) => setDraftOrg(e.target.value)} />
              <input className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Role" value={draftRole} onChange={(e) => setDraftRole(e.target.value)} />
              <input className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} />
              <input className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white md:col-span-2" type="datetime-local" value={draftStartsAt} onChange={(e) => setDraftStartsAt(e.target.value)} />
              <div className="flex gap-2 md:col-span-2">
                <button type="button" disabled={creating} onClick={() => void handleCreateMeeting()} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60">
                  {creating ? "Saving…" : "Save session"}
                </button>
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70">Cancel</button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70">
            <Video className="h-4 w-4 text-sky-300" />
            {meetings.length} meeting{meetings.length === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]/88">
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading meetings…
          </div>
        ) : meetings.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-white/75">No discovery sessions scheduled</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
              Booked executive discovery meetings will appear here with status, links, and follow-up artefacts.
            </p>
          </div>
        ) : (
          <div>
            <table className={cn("w-full text-left", salesEmbedded ? "text-[15px]" : "text-sm")}>
              <thead className={cn("border-b border-white/10 bg-black/20 uppercase text-white/45", salesEmbedded ? "text-xs tracking-wide" : "text-[11px] tracking-[0.12em]")}>
                <tr>
                  <th className={cn(headPad, "min-w-[10rem] font-semibold")}>Name</th>
                  <th className={cn(headPad, "min-w-[11rem] font-semibold")}>Organisation</th>
                  <th className={cn(headPad, "hidden font-semibold lg:table-cell")}>Role</th>
                  <th className={cn(headPad, "min-w-[12rem] font-semibold")}>Email</th>
                  <th className={cn(headPad, "min-w-[11rem] font-semibold")}>Date / time</th>
                  <th className={cn(headPad, "hidden font-semibold xl:table-cell")}>Client timezone</th>
                  <th className={cn(headPad, "font-semibold")}>Status</th>
                  <th className={cn(headPad, "min-w-[14rem] text-right font-semibold")}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className="border-b border-white/5 text-white/75">
                    <td className={cn(cellPad, "font-medium text-white")}>{meeting.name}</td>
                    <td className={cellPad}>{meeting.organization}</td>
                    <td className={cn(cellPad, "hidden lg:table-cell")}>{meeting.role ?? "—"}</td>
                    <td className={cn(cellPad, "max-w-[14rem] truncate")} title={meeting.email}>
                      <a href={`mailto:${meeting.email}`} className="text-sky-300 hover:underline">
                        {meeting.email}
                      </a>
                    </td>
                    <td className={cn(cellPad, "max-w-[14rem] leading-snug text-white/80")}>
                      {meeting.formattedWhenClient ?? meeting.formattedWhenGmt}
                    </td>
                    <td className={cn(cellPad, "hidden max-w-[10rem] truncate xl:table-cell")} title={meeting.clientTimezone}>
                      {meeting.clientTimezone}
                    </td>
                    <td className={cellPad}>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 font-medium",
                          salesEmbedded ? "text-xs" : "text-[10px]",
                          statusClass(meeting.status),
                        )}
                      >
                        {meeting.statusLabel}
                      </span>
                    </td>
                    <td className={cellPad}>
                      <div className={cn("flex flex-wrap items-center justify-end", salesEmbedded ? "gap-2" : "gap-1.5")}>
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/70 hover:text-white",
                            salesEmbedded ? "h-8 w-8" : "h-7 w-7",
                          )}
                          aria-label="Open meeting room"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          disabled={!meeting.meetingLink || meeting.status === "cancelled"}
                          onClick={() => handleStartMeeting(meeting)}
                          className={cn(
                            "inline-flex items-center rounded-md bg-[#2563eb] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50",
                            salesEmbedded ? "h-8 px-3 text-xs" : "h-7 px-2 text-[10px]",
                          )}
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          disabled={!meeting.focusOverviewPdfFileId || busyId === meeting.id}
                          onClick={() => void handleOpenFocusPdf(meeting)}
                          title={
                            meeting.focusSelectionsSubmittedAt
                              ? "Open pre-meeting focus overview PDF"
                              : "Available after the client submits focus areas on /book"
                          }
                          className={
                            salesEmbedded
                              ? secondaryActionClass
                              : "inline-flex h-7 items-center gap-1 rounded-md border border-sky-400/25 bg-sky-500/10 px-2 text-[10px] font-semibold text-sky-100 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          }
                        >
                          <FileText className="h-3 w-3" />
                          Focus
                        </button>
                        <button
                          type="button"
                          disabled={!meeting.transcriptFileId || busyId === meeting.id}
                          onClick={() => void handleOpenTranscript(meeting)}
                          title={
                            meeting.transcriptSavedAt
                              ? "Open saved transcript"
                              : "Notes available after the host ends the call"
                          }
                          className={
                            salesEmbedded
                              ? secondaryActionClass
                              : "inline-flex h-7 items-center gap-1 rounded-md border border-violet-400/25 bg-violet-500/10 px-2 text-[10px] font-semibold text-violet-100 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          }
                        >
                          <FileText className="h-3 w-3" />
                          Notes
                        </button>
                        <label className="relative inline-flex">
                          <select
                            value={meeting.status}
                            disabled={busyId === meeting.id}
                            onChange={(event) =>
                              void handleStatusChange(
                                meeting.id,
                                event.target.value as ExecutiveMeetingStatus,
                              )
                            }
                            className="h-7 appearance-none rounded-md border border-white/10 bg-[#0b1524] pl-2 pr-6 text-[10px] font-medium text-white outline-none"
                          >
                            {EXECUTIVE_MEETING_STATUSES.map((status) => (
                              <option key={status} value={status} className="bg-[#07111f]">
                                {formatExecutiveMeetingStatus(status)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/45" />
                        </label>
                        <button
                          type="button"
                          disabled={busyId === meeting.id}
                          onClick={() => void handleDeleteMeeting(meeting)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-400/25 bg-rose-500/10 text-rose-200 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          title={`Delete meeting for ${meeting.name}`}
                          aria-label={`Delete meeting for ${meeting.name}`}
                        >
                          {busyId === meeting.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
