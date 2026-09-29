"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TALANTON_BOARD_MEETING_TZID } from "@/lib/cronofy/config";
import { postGovernanceMeeting, patchGovernanceMeeting } from "@/lib/talanton/governance-api-client";
import {
  getBoardMembersState,
  subscribeBoardMembersStore,
} from "@/lib/talanton/board-members-store";
import { refreshGovernanceFromServer } from "@/lib/talanton/governance-store";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";
import { cn } from "@/lib/utils";

type WizardStep = 1 | 2 | 3;

type CronofyCalendarOption = {
  calendarId: string;
  calendarName: string;
  providerName: string;
  profileName: string;
  calendarPrimary: boolean;
  integratedConferencingAvailable: boolean;
};

type CronofyStatus = {
  configured: boolean;
  connected: boolean;
  linkedProfileName?: string;
  linkedProviderName?: string;
  calendars?: CronofyCalendarOption[];
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-emerald-400/40";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50 hover:bg-emerald-500/30 disabled:opacity-40";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5";

export function TalantonCreateBoardMeetingWizard({
  open,
  onClose,
  initialMeetingId,
  initialStep,
}: {
  open: boolean;
  onClose: () => void;
  initialMeetingId?: string | null;
  initialStep?: WizardStep;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<WizardStep>(initialStep ?? 1);
  const [title, setTitle] = useState("Talanton Impact Board");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [meeting, setMeeting] = useState<GovernanceMeeting | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cronofyStatus, setCronofyStatus] = useState<CronofyStatus | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [cronofyMessage, setCronofyMessage] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [boardMembers, setBoardMembers] = useState(getBoardMembersState().members);

  useEffect(() => {
    const unsubscribe = subscribeBoardMembersStore(() => {
      setBoardMembers(getBoardMembersState().members);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setStep(initialStep ?? 1);
    const cronofyParam = searchParams.get("cronofy");
    const cronofyMsg = searchParams.get("cronofyMessage");
    if (cronofyMsg) setCronofyMessage(cronofyMsg);
    if (cronofyParam === "connected") setCronofyMessage(null);
  }, [open, initialStep, searchParams]);

  const loadCronofyStatus = useCallback(async () => {
    const res = await fetch("/api/talanton/governance/cronofy/status", { credentials: "include" });
    const data = (await res.json()) as CronofyStatus & { error?: string };
    if (!res.ok) throw new Error(data.error || "Failed to load calendar connection status.");
    setCronofyStatus(data);
    if (data.calendars?.length) {
      const primary = data.calendars.find((c) => c.calendarPrimary) ?? data.calendars[0];
      setSelectedCalendarId(primary?.calendarId ?? "");
    }
  }, []);

  useEffect(() => {
    if (!open || step !== 2) return;
    void loadCronofyStatus().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load Cronofy status.");
    });
  }, [open, step, loadCronofyStatus]);

  useEffect(() => {
    if (!open || !initialMeetingId) return;
    void refreshGovernanceFromServer()
      .then(async () => {
        const res = await fetch("/api/talanton/governance/meetings", { credentials: "include" });
        const data = (await res.json()) as { meetings?: GovernanceMeeting[] };
        const found = data.meetings?.find((m) => m.id === initialMeetingId) ?? null;
        if (found) {
          setMeeting(found);
          setTitle(found.title);
          setDate(found.meetingDate.slice(0, 10));
          if (found.meetingStartAt) {
            const d = new Date(found.meetingStartAt);
            setTime(
              `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
            );
          }
        }
      })
      .catch(() => undefined);
  }, [open, initialMeetingId]);

  const resetAndClose = useCallback(() => {
    setStep(1);
    setMeeting(null);
    setError(null);
    setCronofyMessage(null);
    onClose();
    router.replace("/board/meetings");
  }, [onClose, router]);

  const goStep1Next = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!title.trim() || !date || !time) {
        throw new Error("Meeting name, date, and time are required.");
      }
      const payload = {
        meetingType: "Board Meeting" as const,
        title: title.trim(),
        meetingDate: date,
        meetingTime: time,
        meetingTzid: TALANTON_BOARD_MEETING_TZID,
        status: "Draft" as const,
        minutes: "",
        attendees: [],
        decisions: [],
        actions: [],
        meetingInviteUrl: "",
      };
      const saved = meeting?.id
        ? await patchGovernanceMeeting({ ...meeting, ...payload, id: meeting.id })
        : await postGovernanceMeeting(payload);
      setMeeting(saved);
      await refreshGovernanceFromServer();
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save meeting.");
    } finally {
      setBusy(false);
    }
  };

  const connectCalendar = async () => {
    if (!meeting?.id) return;
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        meetingId: meeting.id,
        returnPath: "/board/meetings",
      });
      const res = await fetch(`/api/talanton/governance/cronofy/authorize?${params}`, {
        credentials: "include",
      });
      const data = (await res.json()) as { authorizeUrl?: string; error?: string };
      if (!res.ok || !data.authorizeUrl) {
        throw new Error(data.error || "Could not start calendar connection.");
      }
      window.location.href = data.authorizeUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calendar connection failed.");
      setBusy(false);
    }
  };

  const createOnlineMeeting = async () => {
    if (!meeting?.id) return;
    setBusy(true);
    setError(null);
    setCronofyMessage(null);
    try {
      const res = await fetch(
        `/api/talanton/governance/meetings/${encodeURIComponent(meeting.id)}/cronofy-event`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendarId: selectedCalendarId || undefined }),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        meeting?: GovernanceMeeting;
        joinUrl?: string;
        provider?: string;
        integratedConferencingAvailable?: boolean;
        calendarProvider?: string;
      };
      if (data.meeting) setMeeting(data.meeting);
      await refreshGovernanceFromServer();
      if (data.ok) {
        setStep(3);
        return;
      }
      setCronofyMessage(data.message || "Online meeting could not be created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create online meeting.");
    } finally {
      setBusy(false);
    }
  };

  const finishWithMembers = async () => {
    if (!meeting) return;
    setBusy(true);
    setError(null);
    try {
      const attendees = boardMembers
        .filter((m) => selectedMemberIds.has(m.id))
        .map((m) => ({ name: m.name, role: m.role }));
      const saved = await patchGovernanceMeeting({
        ...meeting,
        attendees,
        status: meeting.status === "Draft" ? "Scheduled" : meeting.status,
      });
      setMeeting(saved);
      await refreshGovernanceFromServer();
      resetAndClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save board members.");
    } finally {
      setBusy(false);
    }
  };

  const connected = Boolean(cronofyStatus?.connected);
  const configured = cronofyStatus?.configured !== false;

  const stepLabel = useMemo(
    () =>
      step === 1
        ? "Meeting details"
        : step === 2
          ? "Calendar / online meeting"
          : "Board members",
    [step],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-auto rounded-2xl border border-white/10 bg-[#0b1a14] shadow-xl">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Create new meeting</h2>
          <p className="mt-1 text-xs text-white/45">{stepLabel} · Step {step} of 3</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error ? (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}
          {cronofyMessage ? (
            <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-50">
              {cronofyMessage}
            </p>
          ) : null}

          {step === 1 ? (
            <>
              <label className="block text-[11px] text-white/45">
                Meeting name
                <input className={cn(inputClass, "mt-1")} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] text-white/45">
                  Date
                  <input
                    type="date"
                    className={cn(inputClass, "mt-1")}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label className="block text-[11px] text-white/45">
                  Time ({TALANTON_BOARD_MEETING_TZID})
                  <input
                    type="time"
                    className={cn(inputClass, "mt-1")}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {!configured ? (
                <p className="text-sm text-white/55">
                  Cronofy is not configured on this environment. Ask an administrator to set{" "}
                  <code className="text-emerald-200/80">CRONOFY_CLIENT_ID</code> and{" "}
                  <code className="text-emerald-200/80">CRONOFY_CLIENT_SECRET</code>.
                </p>
              ) : null}
              {configured && !connected ? (
                <>
                  <p className="text-sm text-white/55">
                    Connect your calendar to schedule this board meeting and provision an online meeting link
                    through Cronofy.
                  </p>
                  <button type="button" className={primaryBtn} onClick={() => void connectCalendar()} disabled={busy}>
                    Connect calendar
                  </button>
                </>
              ) : null}
              {connected ? (
                <>
                  <p className="text-sm text-white/55">
                    Connected
                    {cronofyStatus?.linkedProfileName
                      ? `: ${cronofyStatus.linkedProfileName}`
                      : ""}
                    {cronofyStatus?.linkedProviderName
                      ? ` (${cronofyStatus.linkedProviderName})`
                      : ""}
                  </p>
                  {cronofyStatus?.calendars?.length ? (
                    <label className="block text-[11px] text-white/45">
                      Calendar
                      <select
                        className={cn(inputClass, "mt-1")}
                        value={selectedCalendarId}
                        onChange={(e) => setSelectedCalendarId(e.target.value)}
                      >
                        {cronofyStatus.calendars.map((c) => (
                          <option key={c.calendarId} value={c.calendarId}>
                            {c.calendarName} · {c.providerName}
                            {c.integratedConferencingAvailable ? " · Teams/Meet available" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    className={primaryBtn}
                    onClick={() => void createOnlineMeeting()}
                    disabled={busy}
                  >
                    Create online meeting
                  </button>
                  <button type="button" className={secondaryBtn} onClick={() => setStep(3)} disabled={busy}>
                    Skip online meeting for now
                  </button>
                </>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="text-sm text-white/55">
                Select board members for this meeting (invitations will be sent in a later phase).
              </p>
              <ul className="max-h-48 space-y-2 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
                {boardMembers.map((member) => (
                  <li key={member.id}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-white/75">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.has(member.id)}
                        onChange={(e) => {
                          setSelectedMemberIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(member.id);
                            else next.delete(member.id);
                            return next;
                          });
                        }}
                      />
                      <span>
                        {member.name}
                        <span className="block text-xs text-white/40">{member.role}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {meeting?.meetingInviteUrl ? (
                <p className="text-xs text-emerald-200/90 break-all">
                  Meeting invite: {meeting.meetingInviteUrl}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button type="button" className={secondaryBtn} onClick={resetAndClose} disabled={busy}>
            Cancel
          </button>
          {step === 1 ? (
            <button type="button" className={primaryBtn} onClick={() => void goStep1Next()} disabled={busy}>
              Next
            </button>
          ) : null}
          {step === 3 ? (
            <button type="button" className={primaryBtn} onClick={() => void finishWithMembers()} disabled={busy}>
              Finish
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
