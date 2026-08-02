import { isInternalDomainHost } from "@/lib/app-domains";
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

const DEMO_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "testing",
  "telemetry",
  "platform-analytics",
  "website-analytics",
]);
export const CORPCENTRE_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "testing",
  "telemetry",
  "platform-analytics",
  "website-analytics",
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
  "potential-clients",
  "grants",
  "representatives",
  "connections",
  "corporate-bank-accounts",
  "wise",
]);

/** Talanton Impact — hide QMS / Website Management / client CRM; Training stays. */
export const TALANTON_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "testing",
  "telemetry",
  "platform-analytics",
  "website-analytics",
  "unit311-details",
  "module-go-live",
  "quality-management",
  "qms-training",
  "qms-document-control",
  "qms-capa",
  "qms-internal-audits",
  "qms-management-review",
  "qms-reports",
  "website-management",
  // Portfolio companies are investments — not Business Central clients.
  "clients",
  "clients-dashboard",
  "crm",
  "crm-meetings",
  "client-onboarding",
  "potential-clients",
  "representatives",
  "portfolio-company",
]);

export const CORPCENTRE_HIDDEN_SECTION_LABELS = new Set([
  "QMS",
  "External Client Access",
]);

export const TALANTON_HIDDEN_SECTION_LABELS = new Set([
  "QMS",
]);

export const CORPCENTRE_HIDDEN_ITEM_LABELS = new Set([
  "Unit311 Details",
  "Website Management",
  "Billing",
  "QMS Courses",
  "Potential Clients",
  "Grants",
  "Partners",
  "Connections",
  "Bank Accounts",
  "Bank",
]);

export const TALANTON_HIDDEN_ITEM_LABELS = new Set([
  "Unit311 Details",
  "Website Management",
  "QMS Courses",
  "Module Go-Live",
  "Clients",
  "Client Directory",
  "Customer Management",
  "Pipeline",
  "Discovery & Demo",
  "Client Onboarding",
  "Potential Clients",
  "Partners",
  "Company Profile",
]);
/** Server-safe CorpCentre nav filter (no window). */
export function filterInternalNavSectionsForCorpCentreWorkspace(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return sections
    .map((section) => {
      if (section.label && CORPCENTRE_HIDDEN_SECTION_LABELS.has(section.label)) {
        return { ...section, items: [] as typeof section.items };
      }
      return {
        ...section,
        items: section.items
          .map((item) => {
            if (item.view && CORPCENTRE_HIDDEN_VIEWS.has(item.view)) return null;
            if (CORPCENTRE_HIDDEN_ITEM_LABELS.has(item.label)) return null;
            if (item.children?.length) {
              const children = item.children.filter((child) => {
                if (child.view && CORPCENTRE_HIDDEN_VIEWS.has(child.view)) return false;
                if (CORPCENTRE_HIDDEN_ITEM_LABELS.has(child.label)) return false;
                return true;
              });
              if (children.length === 0 && !item.view && !item.href) return null;
              return { ...item, children };
            }
            return item;
          })
          .filter((item): item is NonNullable<typeof item> => item != null),
      };
    })
    .filter((section) => section.items.length > 0);
}

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

function isTalantonNavSurface(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserTalantonImpactSurface } =
      require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
    return isBrowserTalantonImpactSurface();
  } catch {
    return false;
  }
}

function appendTalantonNavSections(sections: InternalNavSection[]): InternalNavSection[] {
  if (!isTalantonNavSurface()) return sections;
  try {
    const { TALANTON_IMPACT_NAV_SECTIONS } =
      require("@/lib/talanton/nav") as typeof import("@/lib/talanton/nav");
    // Portfolio platform sections lead the workspace nav (after pin items like Home).
    const pins = sections.filter((section) => section.kind === "pin");
    const rest = sections.filter((section) => section.kind !== "pin");
    return [...pins, ...TALANTON_IMPACT_NAV_SECTIONS, ...rest];
  } catch {
    return sections;
  }
}

function reshapeTalantonTrainingSection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Training") return section;
  return {
    ...section,
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "training-dashboard",
      },
      {
        label: "Staff Courses",
        icon: "GraduationCap",
        view: "training",
      },
      {
        label: "Portfolio Courses",
        icon: "GraduationCap",
        view: "portfolio-courses",
      },
      {
        label: "Course Management",
        icon: "GraduationCap",
        view: "portfolio-course-management",
      },
    ],
  };
}

function filterTalantonBaseNav(sections: readonly InternalNavSection[]): InternalNavSection[] {
  return sections
    .map((section) => {
      if (section.label && TALANTON_HIDDEN_SECTION_LABELS.has(section.label)) {
        return { ...section, items: [] as typeof section.items };
      }
      const filtered: InternalNavSection = {
        ...section,
        items: section.items
          .map((item) => {
            if (item.view && TALANTON_HIDDEN_VIEWS.has(item.view)) return null;
            if (TALANTON_HIDDEN_ITEM_LABELS.has(item.label)) return null;
            if (item.children?.length) {
              const children = item.children.filter((child) => {
                if (child.view && TALANTON_HIDDEN_VIEWS.has(child.view)) return false;
                if (TALANTON_HIDDEN_ITEM_LABELS.has(child.label)) return false;
                return true;
              });
              if (children.length === 0 && !item.view && !item.href) return null;
              return { ...item, children };
            }
            return item;
          })
          .filter((item): item is NonNullable<typeof item> => item != null),
      };
      return reshapeTalantonTrainingSection(filtered);
    })
    .filter((section) => section.items.length > 0);
}

function isAbhiNavSurface(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserAbhiSurface } =
      require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
    return isBrowserAbhiSurface();
  } catch {
    return false;
  }
}

/** ABHI — hide platform-internal / non-member equity surfaces. */
export const ABHI_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "corporate-cap-table",
  "testing",
  "telemetry",
  "platform-analytics",
  "website-analytics",
  "potential-clients",
  "qms-training",
  "marketing-training",
  "module-go-live",
  "unit311-details",
  // Technology Management: Settings only (do not hide top-level Settings section).
  "technology-settings",
]);

const ABHI_HIDDEN_ITEM_LABELS = new Set([
  "Cap Table Management",
  "Infrastructure & Cloud",
  "Networks & Domains",
  "Certificates & Identity",
  "Security",
  "Testing",
  "Telemetry",
  "Potential Clients",
  "QMS Courses",
  "Internal Training",
  "Module Go-Live",
  "Unit311 Details",
  "ABHI Details",
]);

/** ABHI Business Central: Clients → Members; Unit311 Details → ABHI Details. */
const ABHI_CLIENT_LABEL_RENAMES: Record<string, string> = {
  Clients: "Members",
  "Client Directory": "Member Directory",
  "Client Onboarding": "Member Onboarding",
  "Client Explorer": "Member Explorer",
  "Potential Clients": "Potential Members",
  "Unit311 Details": "ABHI Details",
};

function renameAbhiClientNavLabels(section: InternalNavSection): InternalNavSection {
  const rename = (label: string) => ABHI_CLIENT_LABEL_RENAMES[label] ?? label;
  return {
    ...section,
    items: section.items.map((item) => {
      const nextLabel = rename(item.label);
      if (!item.children?.length) {
        return nextLabel === item.label ? item : { ...item, label: nextLabel };
      }
      return {
        ...item,
        label: nextLabel,
        children: item.children.map((child) => {
          const childLabel = rename(child.label);
          return childLabel === child.label ? child : { ...child, label: childLabel };
        }),
      };
    }),
  };
}

function reshapeAbhiCorporateSection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Corporate Information") return section;

  let items = [...section.items];

  if (!items.some((item) => item.view === "corporate-risk-register")) {
    const riskItem = {
      label: "Risk Register",
      icon: "AlertTriangle",
      view: "corporate-risk-register" as const,
    };
    const boardIdx = items.findIndex((item) => item.view === "board-pack");
    const contractsIdx = items.findIndex((item) => item.view === "corporate-contracts");
    if (boardIdx >= 0) {
      items = [...items.slice(0, boardIdx), riskItem, ...items.slice(boardIdx)];
    } else if (contractsIdx >= 0) {
      items = [
        ...items.slice(0, contractsIdx + 1),
        riskItem,
        ...items.slice(contractsIdx + 1),
      ];
    } else {
      items = [...items, riskItem];
    }
  }

  if (!items.some((item) => item.view === "board-pack")) {
    items = [
      ...items,
      {
        label: "Board deck",
        icon: "ScrollText",
        view: "board-pack" as const,
      },
    ];
  }

  return { ...section, items };
}

function reshapeAbhiProductivitySection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Business Productivity") return section;
  if (section.items.some((item) => item.view === "whiteboard")) return section;
  return {
    ...section,
    items: [
      ...section.items,
      {
        label: "Whiteboard",
        icon: "PenLine",
        view: "whiteboard" as const,
      },
    ],
  };
}

function reshapeAbhiTrainingSection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Training") return section;
  // ABHI Training: Dashboard + Courses only (no QMS Courses, no Internal Training).
  return {
    ...section,
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "training-dashboard" as const,
      },
      {
        label: "Courses",
        icon: "GraduationCap",
        view: "training" as const,
      },
    ],
  };
}

function filterAbhiHiddenNavItems(section: InternalNavSection): InternalNavSection {
  return {
    ...section,
    items: section.items
      .map((item) => {
        if (item.view && ABHI_HIDDEN_VIEWS.has(item.view)) return null;
        if (ABHI_HIDDEN_ITEM_LABELS.has(item.label)) return null;
        if (item.children?.length) {
          const children = item.children.filter(
            (child) => !(child.view && ABHI_HIDDEN_VIEWS.has(child.view)),
          );
          if (children.length === 0 && !item.view && !item.href) return null;
          return { ...item, children };
        }
        return item;
      })
      .filter((item): item is NonNullable<typeof item> => item != null),
  };
}

function reshapeAbhiNavSection(section: InternalNavSection): InternalNavSection {
  return renameAbhiClientNavLabels(
    filterAbhiHiddenNavItems(
      reshapeAbhiProductivitySection(
        reshapeAbhiCorporateSection(reshapeAbhiTrainingSection(section)),
      ),
    ),
  );
}

function insertAbhiMarketingSection(sections: readonly InternalNavSection[]): InternalNavSection[] {
  try {
    const { ABHI_MARKETING_NAV_SECTION } =
      require("@/lib/abhi/nav") as typeof import("@/lib/abhi/nav");
    const out: InternalNavSection[] = [];
    let inserted = false;
    for (const section of sections) {
      const next = reshapeAbhiNavSection(section);
      out.push(next);
      if (section.label === "Human Resources") {
        out.push(ABHI_MARKETING_NAV_SECTION);
        inserted = true;
      }
    }
    if (!inserted) out.push(ABHI_MARKETING_NAV_SECTION);
    return out.filter((section) => section.items.length > 0);
  } catch {
    return sections.map((section) => reshapeAbhiNavSection(section));
  }
}

/**
 * Analytics — Internal host only.
 * Top-level section (after Executive Assistant) with Platform + Website Analytics.
 * Never in shared tenant catalogues. Replaces legacy Tools → Clarity link and PA pin.
 */
function injectInternalPlatformAnalytics(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  if (typeof window === "undefined") return [...sections];
  if (!isInternalDomainHost(window.location.hostname)) return [...sections];

  // Strip legacy Tools → Platform Analytics Clarity href and old PA pin.
  const cleaned = sections
    .map((section) => {
      if (section.label === "Tools") {
        return {
          ...section,
          items: section.items.filter((item) => item.label !== "Platform Analytics"),
        };
      }
      if (
        section.kind === "pin" &&
        section.items.some((item) => item.view === "platform-analytics")
      ) {
        return {
          ...section,
          items: section.items.filter((item) => item.view !== "platform-analytics"),
        };
      }
      return section;
    })
    .filter((section) => section.items.length > 0);

  if (cleaned.some((section) => section.label === "Analytics")) {
    return cleaned;
  }

  const analyticsSection: InternalNavSection = {
    kind: "workspace",
    label: "Analytics",
    icon: "BarChart3",
    color: "#38BDF8",
    items: [
      {
        label: "Platform Analytics",
        icon: "LayoutDashboard",
        view: "platform-analytics",
      },
      {
        label: "Website Analytics",
        icon: "Globe",
        view: "website-analytics",
      },
    ],
  };

  const out: InternalNavSection[] = [];
  let inserted = false;
  for (const section of cleaned) {
    out.push(section);
    const isEaPin =
      section.kind === "pin" &&
      section.items.some((item) => item.view === "executive-assistant");
    if (isEaPin && !inserted) {
      out.push(analyticsSection);
      inserted = true;
    }
  }
  if (!inserted) {
    const homeIdx = out.findIndex(
      (section) =>
        section.kind === "pin" && section.items.some((item) => item.view === "home"),
    );
    if (homeIdx >= 0) out.splice(homeIdx + 1, 0, analyticsSection);
    else out.unshift(analyticsSection);
  }
  return out;
}

export function filterInternalNavSectionsForDemoSurface(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  // Talanton customer host: strip QMS/Website, restore Training, prepend Portfolio Companies.
  if (isTalantonNavSurface()) {
    return appendTalantonNavSections(filterTalantonBaseNav(sections));
  }

  // ABHI: inject Marketing & Events after Human Resources.
  if (isAbhiNavSurface()) {
    return insertAbhiMarketingSection(sections);
  }

  if (!shouldHideDroneToolNavViews()) {
    return injectInternalPlatformAnalytics(sections);
  }

  const hideViews = isCorpCentreNavSurface() ? CORPCENTRE_HIDDEN_VIEWS : DEMO_HIDDEN_VIEWS;
  const hideUnit311Details = isCorpCentreNavSurface();
  const corpcentre = isCorpCentreNavSurface();

  const filtered = sections
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

  return injectInternalPlatformAnalytics(filtered);
}
