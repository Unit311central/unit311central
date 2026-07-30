import { normalizePlatformUsername } from "@/lib/platform-auth";

import type { InternalNavSection, InternalOperationsView } from "./internal-operations-data";

export type InternalRoleView = "admin" | "c-suite" | "manager" | "staff";

export const INTERNAL_ROLE_VIEW_OPTIONS: {
  id: InternalRoleView;
  label: string;
}[] = [
  { id: "admin", label: "Admin" },
  { id: "c-suite", label: "C-Suite" },
  { id: "manager", label: "Manager" },
  { id: "staff", label: "Staff" },
];

export const ROLE_VIEW_STORAGE_PREFIX = "unit311-role-view";

export const STAFF_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "financials",
  "board-pack",
  "debtors",
  "creditors",
  "expenses",
  "hr",
  "social",
  "strategy",
  // competitors + whiteboard restored for all roles (nav regression fix)
  "users",
  "users-external",
  "grants",
  "representatives",
]);

export function roleViewStorageKey(username: string) {
  return `${ROLE_VIEW_STORAGE_PREFIX}:${normalizePlatformUsername(username)}`;
}

export function canSelectRoleView(username: string | undefined | null) {
  return normalizePlatformUsername(username ?? "") === "scott.parazynski";
}

export function getDefaultRoleView(username: string | undefined | null): InternalRoleView {
  if (canSelectRoleView(username)) {
    return "c-suite";
  }
  return "c-suite";
}

export function loadStoredRoleView(username: string | undefined | null): InternalRoleView | null {
  if (typeof window === "undefined" || !username) {
    return null;
  }

  const stored = window.localStorage.getItem(roleViewStorageKey(username));
  if (!stored) {
    return null;
  }

  return INTERNAL_ROLE_VIEW_OPTIONS.some((option) => option.id === stored)
    ? (stored as InternalRoleView)
    : null;
}

export function saveStoredRoleView(username: string, role: InternalRoleView) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(roleViewStorageKey(username), role);
}

export function isViewAllowedForRole(
  view: InternalOperationsView,
  role: InternalRoleView,
): boolean {
  if (role === "admin" || role === "c-suite" || role === "manager") {
    return true;
  }
  return !STAFF_HIDDEN_VIEWS.has(view);
}

/** Per-user grants win when present; null/undefined = unrestricted. */
export function isViewAllowedForGrants(
  view: InternalOperationsView,
  allowedViews: readonly InternalOperationsView[] | null | undefined,
): boolean {
  if (allowedViews == null) return true;
  return allowedViews.includes(view);
}

export function shouldHideFinancialBankBalances(role: InternalRoleView) {
  return role === "manager";
}

function filterNavSectionsByViewCheck(
  sections: readonly InternalNavSection[],
  isAllowed: (view: InternalOperationsView) => boolean,
): InternalNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (item.children?.length) {
            const children = item.children
              .map((child) => {
                if (child.children?.length) {
                  const nested = child.children.filter((nestedChild) => {
                    if (!nestedChild.view) return true;
                    return isAllowed(nestedChild.view);
                  });
                  if (nested.length === 0) return null;
                  return { ...child, children: nested };
                }
                if (!child.view) return child;
                return isAllowed(child.view) ? child : null;
              })
              .filter((child): child is NonNullable<typeof child> => child != null);
            if (children.length === 0) {
              return null;
            }
            return { ...item, children };
          }

          if (item.view && !isAllowed(item.view)) {
            return null;
          }

          return item;
        })
        .filter((item): item is NonNullable<typeof item> => item != null),
    }))
    .filter((section) => section.items.length > 0);
}

export function filterInternalNavSections(
  sections: readonly InternalNavSection[],
  role: InternalRoleView,
): InternalNavSection[] {
  return filterNavSectionsByViewCheck(sections, (view) => isViewAllowedForRole(view, role));
}

export function filterInternalNavSectionsByGrants(
  sections: readonly InternalNavSection[],
  allowedViews: readonly InternalOperationsView[] | null | undefined,
): InternalNavSection[] {
  if (allowedViews == null) return [...sections];
  return filterNavSectionsByViewCheck(sections, (view) =>
    isViewAllowedForGrants(view, allowedViews),
  );
}

const DEMO_HIDDEN_VIEWS = new Set<InternalOperationsView>(["testing", "telemetry"]);
const CORPCENTRE_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "testing",
  "telemetry",
  "unit311-details",
  "module-go-live",
  "quality-management",
  "qms-training",
  "qms-document-control",
  "qms-capa",
  "qms-internal-audits",
  "qms-management-review",
  "qms-reports",
  "external-client-access",
  "users-external",
  "website-management",
  "billing",
]);

const CORPCENTRE_HIDDEN_SECTION_LABELS = new Set([
  "QMS",
  "External Client Access",
]);

const CORPCENTRE_HIDDEN_ITEM_LABELS = new Set([
  "Unit311 Details",
  "Website Management",
  "Billing",
  "QMS Courses",
]);

function shouldHideDroneToolNavViews(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserDemoSurface } =
      require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    if (isBrowserDemoSurface()) return true;
  } catch {
    /* fall through to host checks */
  }

  try {
    const { isBrowserCorpCentreSurface } =
      require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
    if (isBrowserCorpCentreSurface()) return true;
  } catch {
    /* fall through */
  }

  return false;
}

function isCorpCentreNavSurface(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserCorpCentreSurface } =
      require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
    return isBrowserCorpCentreSurface();
  } catch {
    return false;
  }
}

export function filterInternalNavSectionsForDemoSurface(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  if (!shouldHideDroneToolNavViews()) return [...sections];

  const hideViews = isCorpCentreNavSurface() ? CORPCENTRE_HIDDEN_VIEWS : DEMO_HIDDEN_VIEWS;
  const hideUnit311Details = isCorpCentreNavSurface();
  const corpcentre = isCorpCentreNavSurface();

  return sections
    .map((section) => {
      if (
        corpcentre &&
        section.label &&
        CORPCENTRE_HIDDEN_SECTION_LABELS.has(section.label)
      ) {
        return { ...section, items: [] as typeof section.items };
      }
      return {
        ...section,
        items: section.items
          .map((item) => {
            if (item.view && hideViews.has(item.view)) return null;
            if (corpcentre && CORPCENTRE_HIDDEN_ITEM_LABELS.has(item.label)) return null;
            if (hideUnit311Details && item.label === "Unit311 Details") return null;
            if (item.children?.length) {
              const children = item.children.filter((child) => {
                if (child.view && hideViews.has(child.view)) return false;
                if (corpcentre && CORPCENTRE_HIDDEN_ITEM_LABELS.has(child.label)) return false;
                return true;
              });
              if (children.length === 0 && !item.view && !item.href) return null;
              const label =
                !hideUnit311Details && item.label === "Unit311 Details"
                  ? "Company Details"
                  : item.label;
              return { ...item, label, children };
            }
            if (!hideUnit311Details && item.label === "Unit311 Details") {
              return { ...item, label: "Company Details" };
            }
            if (item.href?.includes("/whatsapp/support-flow")) {
              return { ...item, label: "Support Messaging" };
            }
            return item;
          })
          .filter((item): item is NonNullable<typeof item> => item != null),
      };
    })
    .filter((section) => section.items.length > 0);
}
