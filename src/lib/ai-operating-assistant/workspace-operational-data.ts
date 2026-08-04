/**
 * Workspace-aware operational datasets for EA tools.
 * Prefer slug-selected builders so SSR answers match ABHI / CorpCentre / default seeds.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";
import { buildAbhiLeaveRequests } from "@/lib/abhi-hr-leave";
import { buildAbhiPerformanceReviews } from "@/lib/abhi-hr-performance";
import { buildAbhiRecruitmentVacancies } from "@/lib/abhi-hr-recruitment";
import { isCorpCentreWorkspaceSlug } from "@/lib/corpcentre-financials";
import { buildCorpCentrePerformanceReviews } from "@/lib/corpcentre-hr-performance";
import type { HrLeaveRequest } from "@/lib/hr-leave-data";
import type { HrPerformanceReview } from "@/lib/hr-performance-data";
import type { HrVacancy } from "@/lib/hr-recruitment-data";
import {
  listCandidates,
  listLeaveRequests,
  listPerformanceReviews,
  listVacancies,
} from "@/lib/hr-mock-store";
import {
  getInventoryMockSnapshot,
  getInventorySnapshotForWorkspace,
  type InventoryMockState,
} from "@/lib/inventory-mock-store";
import type { HrCandidate } from "@/lib/hr-recruitment-data";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function loadWorkspaceLeaveRequests(slug?: string | null): HrLeaveRequest[] {
  if (isAbhiSlug(slug)) return buildAbhiLeaveRequests();
  return listLeaveRequests();
}

export function loadWorkspacePerformanceReviews(slug?: string | null): HrPerformanceReview[] {
  if (isAbhiSlug(slug)) return buildAbhiPerformanceReviews();
  if (isCorpCentreWorkspaceSlug(slug)) return buildCorpCentrePerformanceReviews();
  return listPerformanceReviews();
}

export function loadWorkspaceVacancies(slug?: string | null): HrVacancy[] {
  if (isAbhiSlug(slug)) return buildAbhiRecruitmentVacancies();
  return listVacancies();
}

export function loadWorkspaceCandidates(slug?: string | null): HrCandidate[] {
  if (isAbhiSlug(slug)) return [];
  return listCandidates();
}

export function loadWorkspaceInventory(slug?: string | null): InventoryMockState {
  try {
    return getInventorySnapshotForWorkspace(slug);
  } catch {
    return getInventoryMockSnapshot();
  }
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
