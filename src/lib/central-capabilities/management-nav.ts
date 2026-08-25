import type { InternalOperationsView } from "@/lib/internal-operations-data";

import type { ManagementSectionId } from "./types";

const MANAGEMENT_SECTIONS = new Set<ManagementSectionId>([
  "dashboard",
  "meetings",
  "function-packs",
  "actions-decisions",
]);

/** Views that carry `section` query params for Management deep links. */
export const MANAGEMENT_QUERY_PARAM_VIEWS: ReadonlySet<InternalOperationsView> = new Set([
  "management",
]);

export function resolveManagementSection(param: string | null | undefined): ManagementSectionId {
  const section = String(param ?? "").trim() as ManagementSectionId;
  return MANAGEMENT_SECTIONS.has(section) ? section : "dashboard";
}
