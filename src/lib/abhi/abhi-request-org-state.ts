/**
 * Request-scoped ABHI Board Meetings + Risk Register overlay for EA turns.
 * Browser localStorage is authoritative in the UI; the client sends a snapshot
 * with each chat request so server-side tools see the same data.
 */

import { AsyncLocalStorage } from "node:async_hooks";

import type { AbhiBoardMeetingsState } from "@/lib/abhi/board-meetings-store";
import type { AbhiRiskRegisterState } from "@/lib/abhi/risk-register-store";

export type AbhiRequestOrgState = {
  meetings?: AbhiBoardMeetingsState | null;
  risks?: AbhiRiskRegisterState | null;
};

const storage = new AsyncLocalStorage<AbhiRequestOrgState>();

export function getAbhiRequestOrgState(): AbhiRequestOrgState {
  return storage.getStore() ?? {};
}

export function getAbhiRequestMeetings(): AbhiBoardMeetingsState | null {
  return getAbhiRequestOrgState().meetings ?? null;
}

export function getAbhiRequestRisks(): AbhiRiskRegisterState | null {
  return getAbhiRequestOrgState().risks ?? null;
}

/** Run a sync/async function inside the ABHI org-state ALS context. */
export function runWithAbhiRequestOrgState<T>(
  state: AbhiRequestOrgState | null | undefined,
  fn: () => T,
): T {
  return storage.run(state ?? {}, fn);
}

/**
 * Iterate an async generator while re-entering ALS on each step
 * (required so tool calls after `yield` still see client org state).
 */
export async function* iterateWithAbhiRequestOrgState<T>(
  state: AbhiRequestOrgState | null | undefined,
  generator: AsyncGenerator<T>,
): AsyncGenerator<T> {
  const store = state ?? {};
  const iterator = generator[Symbol.asyncIterator]();
  while (true) {
    const next = await storage.run(store, () => iterator.next());
    if (next.done) return;
    yield next.value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** Validate/normalize client payload from the EA chat request body. */
export function parseAbhiClientOrgState(raw: unknown): AbhiRequestOrgState | null {
  if (!isRecord(raw)) return null;

  const result: AbhiRequestOrgState = {};

  const meetingsRaw = raw.meetings;
  if (isRecord(meetingsRaw) && Array.isArray(meetingsRaw.meetings)) {
    const meetings = meetingsRaw.meetings
      .filter(isRecord)
      .map((row) => ({
        id: String(row.id ?? ""),
        meetingDate: String(row.meetingDate ?? "").slice(0, 10),
        title: String(row.title ?? ""),
        attendees: Array.isArray(row.attendees) ? row.attendees : [],
        agenda: Array.isArray(row.agenda) ? row.agenda.map(String) : [],
        decisions: Array.isArray(row.decisions) ? row.decisions : [],
        actions: Array.isArray(row.actions) ? row.actions : [],
        notes: String(row.notes ?? ""),
        resolutions: Array.isArray(row.resolutions) ? row.resolutions.map(String) : [],
        status: String(row.status ?? "Draft") as
          | "Draft"
          | "Scheduled"
          | "Held"
          | "Archived",
        createdAt: String(row.createdAt ?? new Date().toISOString()),
        updatedAt: String(row.updatedAt ?? new Date().toISOString()),
      }))
      .filter((row) => row.id && row.meetingDate);
    if (meetings.length > 0) {
      result.meetings = { meetings: meetings as AbhiBoardMeetingsState["meetings"] };
    }
  }

  const risksRaw = raw.risks;
  if (isRecord(risksRaw) && Array.isArray(risksRaw.risks)) {
    const risks = risksRaw.risks
      .filter(isRecord)
      .map((row) => ({
        id: String(row.id ?? ""),
        description: String(row.description ?? ""),
        owner: String(row.owner ?? ""),
        impact: (["H", "M", "L"].includes(String(row.impact))
          ? String(row.impact)
          : "M") as "H" | "M" | "L",
        likelihood: (["H", "M", "L"].includes(String(row.likelihood))
          ? String(row.likelihood)
          : "M") as "H" | "M" | "L",
        rating: Number(row.rating) || 0,
        trend: (["↑", "→", "↓"].includes(String(row.trend))
          ? String(row.trend)
          : "→") as "↑" | "→" | "↓",
        mitigation: String(row.mitigation ?? ""),
        status: String(row.status ?? "Active"),
        dateRaised: String(row.dateRaised ?? "").slice(0, 10),
        reviewDate: String(row.reviewDate ?? "").slice(0, 10),
        archived: Boolean(row.archived),
        createdAt: String(row.createdAt ?? new Date().toISOString()),
        updatedAt: String(row.updatedAt ?? new Date().toISOString()),
      }))
      .filter((row) => row.id && row.description);
    if (risks.length > 0) {
      result.risks = { risks };
    }
  }

  if (!result.meetings && !result.risks) return null;
  return result;
}
