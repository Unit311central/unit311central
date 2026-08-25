import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalOperationsView,
} from "@/lib/internal-operations-data";

import type { ManagementSectionId } from "./types";

const MANAGEMENT_SECTIONS = new Set<ManagementSectionId>([
  "dashboard",
  "meetings",
  "function-packs",
  "actions-decisions",
]);

export const MANAGEMENT_SECTION_NAV: ReadonlyArray<{
  id: ManagementSectionId;
  label: string;
}> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "meetings", label: "Meetings" },
  { id: "function-packs", label: "Function Packs" },
  { id: "actions-decisions", label: "Actions & Decisions" },
];

/** Views that carry `section` query params for Management deep links. */
export const MANAGEMENT_QUERY_PARAM_VIEWS: ReadonlySet<InternalOperationsView> = new Set([
  "management",
]);

export function resolveManagementSection(param: string | null | undefined): ManagementSectionId {
  const section = String(param ?? "").trim() as ManagementSectionId;
  return MANAGEMENT_SECTIONS.has(section) ? section : "dashboard";
}

export function resolveManagementShellTitle(section: ManagementSectionId): string {
  return MANAGEMENT_SECTION_NAV.find((row) => row.id === section)?.label ?? "Dashboard";
}

function managementSectionChild(section: ManagementSectionId, label: string): InternalNavChildItem {
  if (section === "dashboard") {
    return { label, view: "management" };
  }
  return { label, view: "management", query: { section } };
}

/** Business Central → Management nested sidebar group (central catalogue source). */
export function buildManagementNavItem(): InternalNavItem {
  return {
    label: "Management",
    icon: "ClipboardList",
    children: MANAGEMENT_SECTION_NAV.map(({ id, label }) => managementSectionChild(id, label)),
  };
}

export function isManagementNavChildActive(
  item: InternalNavChildItem,
  activeView: InternalOperationsView,
  searchParams?: URLSearchParams | null,
): boolean {
  if (item.view !== "management") return false;
  if (activeView !== "management") return false;
  const param = searchParams?.get("section");
  if (!item.query?.section) {
    return !param || param === "dashboard";
  }
  return param === item.query.section;
}
