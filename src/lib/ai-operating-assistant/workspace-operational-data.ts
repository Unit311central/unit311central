/**
 * Workspace-aware operational datasets for EA tools.
 * Resolved via EaWorkspacePack operationalDataProvider with central defaults.
 */

import {
  ensureEaWorkspacePacksRegistered,
  getEaWorkspacePackForSlug,
} from "@/lib/ai-operating-assistant/workspace-packs";
import {
  defaultLoadCandidates,
  defaultLoadInventory,
  defaultLoadLeaveRequests,
  defaultLoadPerformanceReviews,
  defaultLoadVacancies,
} from "@/lib/ai-operating-assistant/workspace-packs/operational-data-default";
import type { HrLeaveRequest } from "@/lib/hr-leave-data";
import type { HrPerformanceReview } from "@/lib/hr-performance-data";
import type { HrVacancy } from "@/lib/hr-recruitment-data";
import type { HrCandidate } from "@/lib/hr-recruitment-data";
import type { InventoryMockState } from "@/lib/inventory-mock-store";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function loadWorkspaceLeaveRequests(slug?: string | null): HrLeaveRequest[] {
  ensureEaWorkspacePacksRegistered();
  const provider = getEaWorkspacePackForSlug(slug)?.operationalDataProvider;
  return provider?.loadLeaveRequests?.(slug) ?? defaultLoadLeaveRequests(slug);
}

export function loadWorkspacePerformanceReviews(slug?: string | null): HrPerformanceReview[] {
  ensureEaWorkspacePacksRegistered();
  const provider = getEaWorkspacePackForSlug(slug)?.operationalDataProvider;
  return provider?.loadPerformanceReviews?.(slug) ?? defaultLoadPerformanceReviews(slug);
}

export function loadWorkspaceVacancies(slug?: string | null): HrVacancy[] {
  ensureEaWorkspacePacksRegistered();
  const provider = getEaWorkspacePackForSlug(slug)?.operationalDataProvider;
  return provider?.loadVacancies?.(slug) ?? defaultLoadVacancies(slug);
}

export function loadWorkspaceCandidates(slug?: string | null): HrCandidate[] {
  ensureEaWorkspacePacksRegistered();
  const provider = getEaWorkspacePackForSlug(slug)?.operationalDataProvider;
  return provider?.loadCandidates?.(slug) ?? defaultLoadCandidates(slug);
}

export function loadWorkspaceInventory(slug?: string | null): InventoryMockState {
  ensureEaWorkspacePacksRegistered();
  const provider = getEaWorkspacePackForSlug(slug)?.operationalDataProvider;
  return provider?.loadInventory?.(slug) ?? defaultLoadInventory(slug);
}

/** Leave overlapping today (approved or pending covering as-of). */
export function leaveCurrentlyActive(
  requests: HrLeaveRequest[],
  asOf: string = todayIso(),
): HrLeaveRequest[] {
  return requests.filter(
    (row) =>
      row.status !== "rejected" &&
      row.status !== "cancelled" &&
      row.startDate <= asOf &&
      row.endDate >= asOf,
  );
}

export function recruitmentSummaryLines(slug?: string | null): string[] {
  const vacancies = loadWorkspaceVacancies(slug).filter((v) => v.status === "open");
  const candidates = loadWorkspaceCandidates(slug);
  if (vacancies.length === 0 && candidates.length === 0) {
    return ["No open vacancies or candidates on the current recruitment register."];
  }
  const lines = [
    `${vacancies.length} open vacanc${vacancies.length === 1 ? "y" : "ies"}`,
    ...vacancies
      .slice(0, 5)
      .map(
        (v) =>
          `${v.title} · ${v.department} · ${v.location}${v.hiringManager ? ` · HM ${v.hiringManager}` : ""}`,
      ),
  ];
  if (candidates.length > 0) {
    lines.push(`${candidates.length} candidate${candidates.length === 1 ? "" : "s"} in pipeline`);
  }
  return lines;
}
