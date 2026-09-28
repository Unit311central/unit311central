/**
 * Talanton governance — client cache backed by Supabase (via /api/talanton/governance/*).
 */

import {
  deleteGovernanceMeetingApi,
  fetchGovernanceMeetings,
  migrateLocalGovernanceOnce,
  patchGovernanceMeeting,
  postGovernanceMeeting,
} from "@/lib/talanton/governance-api-client";
import type {
  ActionStatus,
  DecisionStatus,
  GovernanceAction,
  GovernanceDecision,
  GovernanceMeeting,
  GovernanceSnapshot,
  MeetingStatus,
  MeetingType,
} from "@/lib/talanton/governance-types";

export type {
  ActionStatus,
  DecisionStatus,
  GovernanceAction,
  GovernanceAttendee,
  GovernanceDecision,
  GovernanceMeeting,
  GovernanceLoadStatus,
  GovernanceSnapshot,
  MeetingStatus,
  MeetingType,
} from "@/lib/talanton/governance-types";

type Listener = () => void;

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

let snapshot: GovernanceSnapshot = {
  meetings: [],
  status: "idle",
  error: null,
};

const listeners = new Set<Listener>();
let loadPromise: Promise<void> | null = null;

function emit() {
  snapshot = { ...snapshot, meetings: [...snapshot.meetings] };
  for (const l of listeners) l();
}

function setSnapshot(partial: Partial<GovernanceSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  emit();
}

export function subscribeTalantonGovernanceStore(listener: Listener) {
  listeners.add(listener);
  void ensureGovernanceLoaded();
  return () => listeners.delete(listener);
}

export function getTalantonGovernanceSnapshot(): GovernanceSnapshot {
  void ensureGovernanceLoaded();
  return snapshot;
}

export function getTalantonGovernanceServerSnapshot(): GovernanceSnapshot {
  return { meetings: [], status: "idle", error: null };
}

export async function refreshGovernanceFromServer(): Promise<void> {
  setSnapshot({ status: "loading", error: null });
  try {
    await migrateLocalGovernanceOnce();
    const meetings = await fetchGovernanceMeetings();
    setSnapshot({ meetings, status: "ready", error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load governance data.";
    console.error("[governance-store refresh]", message);
    setSnapshot({ meetings: [], status: "error", error: message });
  }
}

function ensureGovernanceLoaded() {
  if (typeof window === "undefined") return Promise.resolve();
  if (snapshot.status === "ready" || snapshot.status === "error") return Promise.resolve();
  if (!loadPromise) {
    loadPromise = refreshGovernanceFromServer().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export function listMeetings(opts?: { includeArchived?: boolean }) {
  const includeArchived = opts?.includeArchived ?? true;
  return snapshot.meetings
    .filter((m) => (includeArchived ? true : !m.archived))
    .sort((a, b) => Date.parse(b.meetingDate) - Date.parse(a.meetingDate));
}

export async function upsertMeeting(
  input: Omit<GovernanceMeeting, "createdAt" | "updatedAt"> & { createdAt?: string },
): Promise<GovernanceMeeting> {
  const existing = snapshot.meetings.find((m) => m.id === input.id);
  const draft: GovernanceMeeting = {
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  const saved = existing
    ? await patchGovernanceMeeting(draft)
    : await postGovernanceMeeting(draft);
  const meetings = existing
    ? snapshot.meetings.map((m) => (m.id === saved.id ? saved : m))
    : [saved, ...snapshot.meetings];
  setSnapshot({ meetings, status: "ready", error: null });
  return saved;
}

export async function createMeeting(
  partial?: Partial<GovernanceMeeting>,
): Promise<GovernanceMeeting> {
  const saved = await postGovernanceMeeting({
    meetingDate: partial?.meetingDate ?? new Date().toISOString().slice(0, 10),
    meetingType: partial?.meetingType ?? "Management Meeting",
    title: partial?.title ?? "New governance meeting",
    status: partial?.status ?? "Draft",
    attendees: partial?.attendees ?? [],
    minutes: partial?.minutes ?? "",
    decisions: partial?.decisions ?? [],
    actions: partial?.actions ?? [],
    archived: false,
  });
  setSnapshot({
    meetings: [saved, ...snapshot.meetings],
    status: "ready",
    error: null,
  });
  return saved;
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  await deleteGovernanceMeetingApi(meetingId);
  setSnapshot({
    meetings: snapshot.meetings.filter((m) => m.id !== meetingId),
    status: "ready",
    error: null,
  });
}

export async function archiveMeeting(meetingId: string, archived = true): Promise<void> {
  const existing = snapshot.meetings.find((m) => m.id === meetingId);
  if (!existing) throw new Error("Meeting not found.");
  await upsertMeeting({
    ...existing,
    archived,
    status: archived
      ? "Archived"
      : existing.status === "Archived"
        ? "Held"
        : existing.status,
  });
}

export function allDecisions() {
  return listMeetings().flatMap((m) =>
    m.decisions.map((d) => ({
      ...d,
      meetingId: m.id,
      meetingTitle: m.title,
      meetingDate: m.meetingDate,
      meetingType: m.meetingType,
    })),
  );
}

export function allActions() {
  return listMeetings().flatMap((m) =>
    m.actions.map((a) => ({
      ...a,
      meetingId: m.id,
      meetingTitle: m.title,
      meetingDate: m.meetingDate,
      meetingType: m.meetingType,
    })),
  );
}

export function governanceKpis() {
  const active = listMeetings({ includeArchived: false });
  const decisions = allDecisions();
  const actions = allActions();
  const openActions = actions.filter(
    (a) => a.status === "Open" || a.status === "Underway" || a.status === "Overdue",
  );
  const overdue = actions.filter((a) => a.status === "Overdue");
  const approved = decisions.filter((d) => d.status === "Approved");
  return {
    meetingsActive: active.length,
    meetingsHeld: active.filter((m) => m.status === "Held").length,
    decisionsApproved: approved.length,
    decisionsPending: decisions.filter(
      (d) => d.status === "Proposed" || d.status === "Deferred",
    ).length,
    actionsOpen: openActions.length,
    actionsOverdue: overdue.length,
  };
}

export function governanceMinutesKpis() {
  const active = listMeetings({ includeArchived: false });
  const decisions = allDecisions();
  const actions = allActions();
  const openActions = actions.filter(
    (a) => a.status === "Open" || a.status === "Underway" || a.status === "Overdue",
  );
  return {
    minutesRecorded: active.filter((m) => m.minutes.trim().length > 0).length,
    decisionsTotal: decisions.length,
    decisionsPending: decisions.filter(
      (d) => d.status === "Proposed" || d.status === "Deferred",
    ).length,
    actionsOpen: openActions.length,
    actionsOverdue: actions.filter((a) => a.status === "Overdue").length,
    timelineEvents: governanceTimeline().length,
  };
}

export function governanceTimeline() {
  const events: {
    id: string;
    date: string;
    kind: "Meeting" | "Decision" | "Action";
    title: string;
    detail: string;
    status: string;
  }[] = [];

  for (const m of listMeetings()) {
    events.push({
      id: `t-m-${m.id}`,
      date: m.meetingDate,
      kind: "Meeting",
      title: m.title,
      detail: `${m.meetingType} · ${m.status}`,
      status: m.status,
    });
    for (const d of m.decisions) {
      events.push({
        id: `t-d-${d.id}`,
        date: m.meetingDate,
        kind: "Decision",
        title: d.text,
        detail: `${m.title} · Owner ${d.owner}`,
        status: d.status,
      });
    }
    for (const a of m.actions) {
      events.push({
        id: `t-a-${a.id}`,
        date: a.dueDate,
        kind: "Action",
        title: a.title,
        detail: `${m.title} · Owner ${a.owner}`,
        status: a.status,
      });
    }
  }

  return events.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function blankDecision(): GovernanceDecision {
  return { id: id("dec"), text: "", status: "Proposed", owner: "Harry Turner" };
}

export function blankAction(): GovernanceAction {
  return {
    id: id("act"),
    title: "",
    owner: "Portfolio Ops",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "Open",
  };
}
