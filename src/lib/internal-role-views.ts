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
  if (allowedViews.includes(view)) return true;
  // Member Intelligence ships with the Members / Client Directory module surface.
  if (
    view === "member-intelligence" &&
    (allowedViews.includes("clients") || allowedViews.includes("clients-dashboard"))
  ) {
    return true;
  }
  // Regulatory Intelligence is available alongside Members for ABHI operators.
  if (
    (view === "regulatory-dashboard" ||
      view === "regulatory-updates" ||
      view === "regulatory-impact" ||
      view === "regulatory-alerts") &&
    (allowedViews.includes("clients") ||
      allowedViews.includes("member-intelligence") ||
      allowedViews.includes("regulatory-dashboard"))
  ) {
    return true;
  }
  return false;
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
    const withPortfolio = [...pins, ...TALANTON_IMPACT_NAV_SECTIONS, ...rest];
    return insertTalantonBoardSection(withPortfolio);
  } catch {
    return insertTalantonBoardSection(sections);
  }
}

const TALANTON_BOARD_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Board",
  icon: "ShieldCheck",
  color: "#1B8A5A",
  items: [
    { label: "Board Dashboard", icon: "LayoutDashboard", view: "board-dashboard" as const },
    { label: "Board Meetings", icon: "CalendarDays", view: "board-meetings" as const },
    { label: "Board Decks", icon: "ScrollText", view: "board-pack" as const },
    { label: "Minutes & Decisions", icon: "ClipboardCheck", view: "board-minutes" as const },
    { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" as const },
    { label: "Board Members", icon: "Users", view: "board-members" as const },
  ],
};

function insertTalantonBoardSection(sections: readonly InternalNavSection[]): InternalNavSection[] {
  if (sections.some((s) => s.label === "Board")) return [...sections];
  const out: InternalNavSection[] = [];
  let inserted = false;
  for (const section of sections) {
    out.push(section);
    if (section.label === "Portfolio Companies") {
      out.push(TALANTON_BOARD_NAV_SECTION);
      inserted = true;
    }
  }
  if (!inserted) out.push(TALANTON_BOARD_NAV_SECTION);
  return out;
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

function isOnwardAirNavSurface(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserOnwardAirSurface } =
      require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
    return isBrowserOnwardAirSurface();
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

  if (!items.some((item) => item.view === "board-meetings")) {
    const meetingsItem = {
      label: "Board Meetings",
      icon: "CalendarDays",
      view: "board-meetings" as const,
    };
    const boardIdx = items.findIndex((item) => item.view === "board-pack");
    if (boardIdx >= 0) {
      items = [...items.slice(0, boardIdx + 1), meetingsItem, ...items.slice(boardIdx + 1)];
    } else {
      items = [...items, meetingsItem];
    }
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

function injectAbhiMemberIntelligenceNav(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Business Central") return section;
  return {
    ...section,
    items: section.items.map((item) => {
      const isMembersGroup =
        item.label === "Clients" ||
        item.label === "Members" ||
        item.children?.some((child) => child.view === "clients");
      if (!isMembersGroup || !item.children?.length) return item;
      if (item.children.some((child) => child.view === "member-intelligence")) return item;
      const directoryIdx = item.children.findIndex((child) => child.view === "clients");
      const intelligenceChild = {
        label: "Member Intelligence",
        view: "member-intelligence" as const,
      };
      if (directoryIdx < 0) {
        return { ...item, children: [...item.children, intelligenceChild] };
      }
      const children = [...item.children];
      children.splice(directoryIdx + 1, 0, intelligenceChild);
      return { ...item, children };
    }),
  };
}

function reshapeAbhiNavSection(section: InternalNavSection): InternalNavSection {
  return renameAbhiClientNavLabels(
    injectAbhiMemberIntelligenceNav(
      filterAbhiHiddenNavItems(
        reshapeAbhiProductivitySection(
          reshapeAbhiCorporateSection(reshapeAbhiTrainingSection(section)),
        ),
      ),
    ),
  );
}

const ABHI_BOARD_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Board",
  icon: "ShieldCheck",
  color: "#C2185B",
  items: [
    { label: "Board Dashboard", icon: "LayoutDashboard", view: "board-dashboard" as const },
    { label: "Board Meetings", icon: "CalendarDays", view: "board-meetings" as const },
    { label: "Board Decks", icon: "ScrollText", view: "board-pack" as const },
    { label: "Minutes & Decisions", icon: "ClipboardCheck", view: "board-minutes" as const },
    { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" as const },
    { label: "Board Members", icon: "Users", view: "board-members" as const },
  ],
};

/** OnwardAir BOARD — same capability surface as ABHI, isolated tenant data. */
const ONWARDAIR_BOARD_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Board",
  icon: "ShieldCheck",
  color: "#0EA5E9",
  items: [
    { label: "Board Dashboard", icon: "LayoutDashboard", view: "board-dashboard" as const },
    { label: "Board Meetings", icon: "CalendarDays", view: "board-meetings" as const },
    { label: "Board Decks", icon: "ScrollText", view: "board-pack" as const },
    { label: "Minutes & Decisions", icon: "ClipboardCheck", view: "board-minutes" as const },
    { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" as const },
    { label: "Board Members", icon: "Users", view: "board-members" as const },
  ],
};

const ONWARDAIR_ENGINEERING_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Engineering",
  icon: "Cpu",
  color: "#38BDF8",
  items: [
    { label: "Test Plans", icon: "ClipboardCheck", view: "oa-test-plans" as const },
    { label: "Test Runs", icon: "FlaskConical", view: "oa-test-runs" as const },
    { label: "Defects", icon: "AlertTriangle", view: "oa-defects" as const },
    { label: "UAT Tracking", icon: "Users", view: "oa-uat-tracking" as const },
  ],
};

const ONWARDAIR_OPERATIONS_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Operations",
  icon: "Activity",
  color: "#34D399",
  items: [
    { label: "Platform Health", icon: "Activity", view: "oa-platform-health" as const },
    { label: "Monitoring", icon: "Radio", view: "oa-monitoring" as const },
    { label: "Incident Management", icon: "AlertTriangle", view: "oa-incident-management" as const },
    { label: "Change Management", icon: "Layers", view: "oa-change-management" as const },
    { label: "Release Tracking", icon: "ScrollText", view: "oa-release-tracking" as const },
  ],
};

function insertOnwardAirNavSections(sections: readonly InternalNavSection[]): InternalNavSection[] {
  const out: InternalNavSection[] = [];
  let insertedBoard = false;
  for (const section of sections) {
    if (section.label === "Corporate Information") {
      out.push({
        ...section,
        items: section.items.filter(
          (item) =>
            item.view !== "board-meetings" &&
            item.view !== "board-pack" &&
            item.view !== "corporate-risk-register",
        ),
      });
      out.push(ONWARDAIR_BOARD_NAV_SECTION);
      insertedBoard = true;
    } else {
      out.push(section);
    }
  }
  if (!insertedBoard) out.push(ONWARDAIR_BOARD_NAV_SECTION);
  out.push(ONWARDAIR_ENGINEERING_NAV_SECTION, ONWARDAIR_OPERATIONS_NAV_SECTION);
  return out.filter((section) => section.items.length > 0);
}

function insertAbhiMarketingSection(sections: readonly InternalNavSection[]): InternalNavSection[] {
  try {
    const { ABHI_MARKETING_NAV_SECTION, ABHI_REGULATORY_NAV_SECTION } =
      require("@/lib/abhi/nav") as typeof import("@/lib/abhi/nav");
    const out: InternalNavSection[] = [];
    let insertedMarketing = false;
    let insertedRegulatory = false;
    let insertedBoard = false;
    for (const section of sections) {
      const next = reshapeAbhiNavSection(section);
      // Drop Board Meetings / Board deck / Risk from Corporate Information when BOARD section exists.
      if (next.label === "Corporate Information") {
        out.push({
          ...next,
          items: next.items.filter(
            (item) =>
              item.view !== "board-meetings" &&
              item.view !== "board-pack" &&
              item.view !== "corporate-risk-register",
          ),
        });
      } else {
        out.push(next);
      }
      if (section.label === "Business Central") {
        out.push(ABHI_REGULATORY_NAV_SECTION);
        insertedRegulatory = true;
      }
      if (section.label === "Human Resources") {
        out.push(ABHI_MARKETING_NAV_SECTION);
        insertedMarketing = true;
      }
      if (section.label === "Corporate Information") {
        out.push(ABHI_BOARD_NAV_SECTION);
        insertedBoard = true;
      }
    }
    if (!insertedRegulatory) out.push(ABHI_REGULATORY_NAV_SECTION);
    if (!insertedMarketing) out.push(ABHI_MARKETING_NAV_SECTION);
    if (!insertedBoard) out.push(ABHI_BOARD_NAV_SECTION);
    return out.filter((section) => section.items.length > 0);
  } catch {
    return [
      ...sections.map((section) => reshapeAbhiNavSection(section)),
      ABHI_BOARD_NAV_SECTION,
    ];
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

function stripMemberIntelligenceNav(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (!item.children?.length) {
            return item.view === "member-intelligence" ? null : item;
          }
          const children = item.children.filter(
            (child) => child.view !== "member-intelligence",
          );
          if (children.length === 0 && !item.view && !item.href) return null;
          return { ...item, children };
        })
        .filter((item): item is NonNullable<typeof item> => item != null),
    }))
    .filter((section) => section.items.length > 0);
}

/** Hide Member Intelligence on non-ABHI hosts only (keep on SSR until host is known). */
function stripMemberIntelligenceNavForNonAbhi(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  if (typeof window === "undefined") return [...sections];
  if (isAbhiNavSurface()) return [...sections];
  return stripMemberIntelligenceNav(sections);
}

export function filterInternalNavSectionsForDemoSurface(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  // Talanton customer host: strip QMS/Website, restore Training, prepend Portfolio Companies.
  if (isTalantonNavSurface()) {
    return appendTalantonNavSections(
      filterTalantonBaseNav(stripMemberIntelligenceNavForNonAbhi(sections)),
    );
  }

  // ABHI: keep Member Intelligence under Members; inject Marketing & Events.
  if (isAbhiNavSurface()) {
    return insertAbhiMarketingSection(sections);
  }

  // OnwardAir: BOARD + Engineering/Operations placeholders (clean tenant, no ABHI data).
  if (isOnwardAirNavSurface()) {
    return insertOnwardAirNavSections(stripMemberIntelligenceNavForNonAbhi(sections));
  }

  if (!shouldHideDroneToolNavViews()) {
    return injectInternalPlatformAnalytics(stripMemberIntelligenceNavForNonAbhi(sections));
  }

  const hideViews = isCorpCentreNavSurface() ? CORPCENTRE_HIDDEN_VIEWS : DEMO_HIDDEN_VIEWS;
  const hideUnit311Details = isCorpCentreNavSurface();
  const corpcentre = isCorpCentreNavSurface();

  const filtered = stripMemberIntelligenceNavForNonAbhi(sections)
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
