import { buildManagementNavItem } from "@/lib/central-capabilities/management-nav";
import type { InternalNavChildItem } from "@/lib/internal-operations-data";

/** Business stream shown inside Business Central → Management. */
export type ManagementContext = "unit311central" | "wolf";

export const MANAGEMENT_CONTEXT_QUERY_KEY = "managementContext";

export const MANAGEMENT_CONTEXT_STORAGE_KEY = "unit311.management-context";

export const MANAGEMENT_CONTEXT_CHANGE_EVENT = "unit311-management-context";

export const MANAGEMENT_CONTEXT_OPTIONS: ReadonlyArray<{
  id: ManagementContext;
  label: string;
}> = [
  { id: "unit311central", label: "UNIT311CENTRAL" },
  { id: "wolf", label: "WOLF" },
];

export const WOLF_MANAGEMENT_PLACEHOLDER = {
  title: "WOLF Management",
  subtitle: "This context is separate from Unit311Central Management.",
  message: "WOLF Management modules will be configured separately.",
} as const;

const UNIT311_MANAGEMENT_BASE_PATHS = new Set([
  "/",
  "/internaldashboard",
  "/internaldashboard_grants",
]);

export function isManagementContext(value: string | null | undefined): value is ManagementContext {
  return value === "unit311central" || value === "wolf";
}

/** Internal app shell only. Customer hosts use `/dashboard` and keep the current Management list. */
export function managementContextSelectorEnabled(basePath: string | null | undefined): boolean {
  return UNIT311_MANAGEMENT_BASE_PATHS.has(basePath ?? "");
}

/** Business Central → Management. Sales Management has its own group with the same label. */
export function isBusinessCentralManagementNav(
  sectionLabel: string | null | undefined,
  itemLabel: string,
): boolean {
  return sectionLabel === "Business Central" && itemLabel === "Management";
}

type SearchParamSource = { get(name: string): string | null };

/**
 * Page context for the open Management view.
 * WOLF is explicit (`managementContext=wolf` and no module section).
 * Every existing Management link stays Unit311Central.
 */
export function resolveManagementPageContext(searchParams: SearchParamSource | null | undefined): ManagementContext {
  if (!searchParams) return "unit311central";
  if (searchParams.get(MANAGEMENT_CONTEXT_QUERY_KEY) !== "wolf") return "unit311central";
  const section = searchParams.get("section")?.trim() ?? "";
  if (section && section !== "dashboard") return "unit311central";
  return "wolf";
}

export function managementNavChildrenForContext(
  context: ManagementContext,
): readonly InternalNavChildItem[] {
  if (context === "wolf") return [];
  return buildManagementNavItem().children ?? [];
}

export function readManagementContext(): ManagementContext | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(MANAGEMENT_CONTEXT_STORAGE_KEY);
    return isManagementContext(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeManagementContext(context: ManagementContext) {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MANAGEMENT_CONTEXT_STORAGE_KEY) === context) return;
    window.localStorage.setItem(MANAGEMENT_CONTEXT_STORAGE_KEY, context);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(MANAGEMENT_CONTEXT_CHANGE_EVENT));
}

export function subscribeManagementContext(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const notify = () => onStoreChange();
  window.addEventListener(MANAGEMENT_CONTEXT_CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(MANAGEMENT_CONTEXT_CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function managementContextServerSnapshot(): ManagementContext {
  return "unit311central";
}

export function managementContextClientSnapshot(): ManagementContext {
  return readManagementContext() ?? "unit311central";
}

/**
 * Context used by the sidebar.
 * On the Management view the URL wins. Elsewhere the last selection is kept, defaulting to Unit311Central.
 */
export function resolveManagementNavContext(options: {
  activeView: string;
  searchParams: SearchParamSource | null | undefined;
  stored: ManagementContext;
}): ManagementContext {
  if (options.activeView === "management") {
    return resolveManagementPageContext(options.searchParams);
  }
  return options.stored;
}

/**
 * Keep `managementContext` on the Management view only.
 * A navigation query replaces it; other views drop it.
 */
export function applyManagementContextSearchParam(
  params: URLSearchParams,
  activeView: string,
  navQuery: Record<string, string> | null,
): void {
  const key = MANAGEMENT_CONTEXT_QUERY_KEY;
  if (activeView !== "management") {
    params.delete(key);
    return;
  }
  if (!navQuery) return;
  if (navQuery[key] === "wolf") {
    params.set(key, "wolf");
    return;
  }
  params.delete(key);
}
