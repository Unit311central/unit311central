/**
 * Request-scoped Talanton governance + risk register overlay for EA turns.
 */

import { AsyncLocalStorage } from "node:async_hooks";

import type { GovernanceMeeting } from "@/lib/talanton/governance-store";
import type { TiRiskRegisterState } from "@/lib/talanton/risk-register-store";

export type TalantonGovernanceState = {
  meetings: GovernanceMeeting[];
};

export type TalantonRequestOrgState = {
  governance?: TalantonGovernanceState | null;
  risks?: TiRiskRegisterState | null;
};

const storage = new AsyncLocalStorage<TalantonRequestOrgState>();

export function getTalantonRequestOrgState(): TalantonRequestOrgState {
  return storage.getStore() ?? {};
}

export function getTalantonRequestGovernance(): TalantonGovernanceState | null {
  return getTalantonRequestOrgState().governance ?? null;
}

export function getTalantonRequestRisks(): TiRiskRegisterState | null {
  return getTalantonRequestOrgState().risks ?? null;
}

export function runWithTalantonRequestOrgState<T>(
  state: TalantonRequestOrgState | null | undefined,
  fn: () => T,
): T {
  return storage.run(state ?? {}, fn);
}

export async function* iterateWithTalantonRequestOrgState<T>(
  state: TalantonRequestOrgState | null | undefined,
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

export function parseTalantonClientOrgState(raw: unknown): TalantonRequestOrgState | null {
  if (!isRecord(raw)) return null;

  const result: TalantonRequestOrgState = {};

  const govRaw = raw.governance;
  if (isRecord(govRaw) && Array.isArray(govRaw.meetings)) {
    const meetings = govRaw.meetings
      .filter(isRecord)
      .map((row) => ({
        id: String(row.id ?? ""),
        meetingDate: String(row.meetingDate ?? "").slice(0, 10),
        meetingType: String(row.meetingType ?? "Board Meeting") as GovernanceMeeting["meetingType"],
        title: String(row.title ?? ""),
        status: String(row.status ?? "Draft") as GovernanceMeeting["status"],
        attendees: Array.isArray(row.attendees) ? row.attendees : [],
        minutes: String(row.minutes ?? ""),
        decisions: Array.isArray(row.decisions) ? row.decisions : [],
        actions: Array.isArray(row.actions) ? row.actions : [],
        archived: Boolean(row.archived),
        createdAt: String(row.createdAt ?? new Date().toISOString()),
        updatedAt: String(row.updatedAt ?? new Date().toISOString()),
      }))
      .filter((row) => row.id && row.meetingDate);
    if (meetings.length > 0) {
      result.governance = { meetings: meetings as GovernanceMeeting[] };
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
        mitigation: String(row.mitigation ?? ""),
        status: String(row.status ?? "Open"),
        dateAdded: String(row.dateAdded ?? "").slice(0, 10),
        reviewDate: String(row.reviewDate ?? "").slice(0, 10),
        boardPackId: String(row.boardPackId ?? ""),
        boardPackLabel: String(row.boardPackLabel ?? ""),
        archived: Boolean(row.archived),
        createdAt: String(row.createdAt ?? new Date().toISOString()),
        updatedAt: String(row.updatedAt ?? new Date().toISOString()),
      }))
      .filter((row) => row.id && row.description);
    if (risks.length > 0) {
      result.risks = { risks };
    }
  }

  if (!result.governance && !result.risks) return null;
  return result;
}
