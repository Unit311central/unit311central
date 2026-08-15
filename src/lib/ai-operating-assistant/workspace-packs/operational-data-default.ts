/**
 * Default operational data loaders — used when a workspace pack has no provider override.
 */

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
import type { HrLeaveRequest } from "@/lib/hr-leave-data";
import type { HrPerformanceReview } from "@/lib/hr-performance-data";
import type { HrVacancy } from "@/lib/hr-recruitment-data";

export function defaultLoadLeaveRequests(_slug?: string | null): HrLeaveRequest[] {
  return listLeaveRequests();
}

export function defaultLoadPerformanceReviews(_slug?: string | null): HrPerformanceReview[] {
  return listPerformanceReviews();
}

export function defaultLoadVacancies(_slug?: string | null): HrVacancy[] {
  return listVacancies();
}

export function defaultLoadCandidates(_slug?: string | null): HrCandidate[] {
  return listCandidates();
}

export function defaultLoadInventory(slug?: string | null): InventoryMockState {
  try {
    return getInventorySnapshotForWorkspace(slug);
  } catch {
    return getInventoryMockSnapshot();
  }
}
