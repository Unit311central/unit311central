import { FINANCES_MODULE_LABEL } from "@/lib/finances-nav";
import { isInternalDomainHost } from "@/lib/app-domains";
import { buildWorkspacesNavSection } from "@/lib/workspaces-nav";
import { normalizePlatformUsername } from "@/lib/platform-auth";
import {
  buildProjectManagementNavSection,
  stripProjectsFromBusinessCentral,
} from "@/lib/project-management-nav";
import {
  ONWARDAIR_EA_ACCENT,
  ONWARDAIR_HOME_ACCENT,
  ONWARDAIR_MODULE_ACCENTS,
} from "@/lib/onwardair-surface";
import { ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER } from "@/lib/onwardair-nav-order";
import { TALANTON_LOCKED_WORKSPACE_SECTION_ORDER } from "@/lib/talanton-nav-order";

import type {
  InternalNavItem,
  InternalNavSection,
  InternalOperationsView,
} from "./internal-operations-data";
import { internalSurveyNavSections } from "./internal-operations-data";

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
  // OnwardAir Marketing & Events ships with the Operations surface.
  if (
    (view === "oa-marketing-dashboard" ||
      view === "marketing-newsletter" ||
      view === "marketing-events" ||
      view === "marketing-event-management" ||
      view === "marketing-mailing-list") &&
    (allowedViews.includes("operations-dashboard") ||
      allowedViews.includes("assets") ||
      allowedViews.includes("oa-marketing-dashboard"))
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
  "workspaces-overview",
  "workspaces-new",
]);
export const CORPCENTRE_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "testing",
  "telemetry",
  "platform-analytics",
  "website-analytics",
  "workspaces-overview",
  "workspaces-new",
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
  "workspaces-overview",
  "workspaces-new",
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
  "sales-management",
  "client-onboarding",
  "potential-clients",
  "representatives",
  "portfolio-company",
  // Remediation: remove unused modules
  "grants",
  "technology-infrastructure",
  "technology-reports",
  "technology-settings",
  // Keep File Explorer (Internal + External); hide Client Explorer only.
  "files-client",
  // Board of Directors list lives under Board → Board Members.
  "corporate-board-directors",
  // Minutes & Decisions retired — Board meetings own minutes/decisions content.
  "board-minutes",
]);

export const CORPCENTRE_HIDDEN_SECTION_LABELS = new Set([
  "QMS",
  "External Client Access",
]);

export const TALANTON_HIDDEN_SECTION_LABELS = new Set(["QMS", "Sales Management"]);

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
  "Grants",
  "Infrastructure & Cloud",
  "Infrastructure",
  "Cloud",
  "Networks & Domains",
  "Certificates & Identity",
  "Certificates",
  "Security",
  "Client Explorer",
  "Member Explorer",
  "Board of Directors",
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

/** Server-safe Talanton LHS nav — same shape as the live customer sidebar. */
export function buildTalantonImpactNavSections(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  const { TALANTON_IMPACT_NAV_SECTIONS } =
    require("@/lib/talanton/nav") as typeof import("@/lib/talanton/nav");
  const pins = sections.filter((section) => section.kind === "pin");
  const rest = sections.filter((section) => section.kind !== "pin");
  const withPortfolio = [...pins, ...TALANTON_IMPACT_NAV_SECTIONS, ...rest];
  // Module order is applied from Settings / localStorage — do not pre-sort here.
  return insertTalantonBoardSection(withPortfolio);
}

export function getTalantonImpactNavSections(): InternalNavSection[] {
  return buildTalantonImpactNavSections(
    filterTalantonBaseNav(stripMemberIntelligenceNavForNonAbhi(internalSurveyNavSections)),
  );
}

/** Server-safe ABHI LHS nav — same shape as the live customer sidebar (factory order applied separately). */
export function buildAbhiNavSections(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return insertAbhiMarketingSection(stripCustomerPlatformNav(sections));
}

export function getAbhiNavSections(): InternalNavSection[] {
  return buildAbhiNavSections(internalSurveyNavSections);
}

/** Server-safe OnwardAir LHS nav — same shape as the live customer sidebar. */
export function buildOnwardAirNavSections(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return insertOnwardAirNavSections(
    stripCustomerPlatformNav(stripMemberIntelligenceNavForNonAbhi(sections)),
  );
}

export function getOnwardAirNavSections(): InternalNavSection[] {
  return buildOnwardAirNavSections(internalSurveyNavSections);
}

function appendTalantonNavSections(sections: InternalNavSection[]): InternalNavSection[] {
  if (!isTalantonNavSurface()) return sections;
  try {
    return buildTalantonImpactNavSections(sections);
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

/** Pins first, then locked Talanton workspace order, Settings last. */
function sortTalantonSectionsByLockedOrder(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  const pins: InternalNavSection[] = [];
  const movable: InternalNavSection[] = [];
  let settings: InternalNavSection | null = null;

  for (const section of sections) {
    if (section.kind === "pin") {
      pins.push(section);
      continue;
    }
    if (section.label === "Settings") {
      settings = section;
      continue;
    }
    movable.push(section);
  }

  const byLabel = new Map(
    movable.map((section) => [String(section.label ?? ""), section] as const),
  );
  const ordered: InternalNavSection[] = [];
  for (const label of TALANTON_LOCKED_WORKSPACE_SECTION_ORDER) {
    const section = byLabel.get(label);
    if (section) {
      ordered.push(section);
      byLabel.delete(label);
    }
  }
  for (const section of byLabel.values()) ordered.push(section);

  return [...pins, ...ordered, ...(settings ? [settings] : [])];
}

function insertTalantonBoardSection(sections: readonly InternalNavSection[]): InternalNavSection[] {
  if (sections.some((s) => s.label === "Board")) return [...sections];
  const out: InternalNavSection[] = [];
  let inserted = false;
  const hasTalantonIntelligence = sections.some((s) => s.label === "Talanton Intelligence");
  const hasLegacyPortfolioIntelligence = sections.some(
    (s) => s.label === "Portfolio Intelligence",
  );
  for (const section of sections) {
    out.push(section);
    if (hasTalantonIntelligence && section.label === "Talanton Intelligence") {
      out.push(TALANTON_BOARD_NAV_SECTION);
      inserted = true;
    } else if (
      !hasTalantonIntelligence &&
      hasLegacyPortfolioIntelligence &&
      section.label === "Portfolio Intelligence"
    ) {
      out.push(TALANTON_BOARD_NAV_SECTION);
      inserted = true;
    } else if (
      !hasTalantonIntelligence &&
      !hasLegacyPortfolioIntelligence &&
      section.label === "Portfolio Companies"
    ) {
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
        label: "Portfolio Courses",
        icon: "GraduationCap",
        view: "portfolio-courses",
      },
      {
        label: "Learning Library",
        icon: "FolderOpen",
        view: "learning-library",
      },
      {
        label: "Certifications",
        icon: "ClipboardCheck",
        view: "training-certifications",
      },
      {
        label: "Company Progress",
        icon: "BarChart3",
        view: "company-progress",
      },
    ],
  };
}

const TALANTON_HIDDEN_CORPORATE_VIEWS = new Set<InternalOperationsView>([
  "corporate-board-directors",
  "corporate-risk-register",
  "board-pack",
  "board-meetings",
]);

const TALANTON_HIDDEN_CORPORATE_LABELS = new Set([
  "Board of Directors",
  "Risk Register",
  "Board deck",
  "Board Deck",
  "Board Decks",
  "Board Meetings",
]);

/** Risk / Board deck / Meetings / Directors live under Board — not Corporate Information. */
function reshapeTalantonCorporateSection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Corporate Information") return section;
  return {
    ...section,
    items: section.items.filter((item) => {
      if (TALANTON_HIDDEN_CORPORATE_LABELS.has(item.label)) return false;
      if (item.view && TALANTON_HIDDEN_CORPORATE_VIEWS.has(item.view)) return false;
      return true;
    }),
  };
}

/** Talanton — full Business Productivity with Management and Content Studio surfaced in-section. */
function reshapeTalantonProductivitySection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Business Productivity") return section;
  return {
    ...section,
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "productivity-dashboard" as const },
      { label: "Content Studio", icon: "Presentation", view: "content-studio" as const },
      {
        label: "File Explorer",
        icon: "FolderOpen",
        children: [
          { label: "Internal Files", view: "files-internal" as const },
          { label: "External Files", view: "files-external" as const },
          { label: "Client Explorer", view: "files-client" as const },
        ],
      },
      { label: "Email", icon: "Mail", view: "info-email" as const },
      { label: "Calendar", icon: "CalendarDays", view: "calendar" as const },
      { label: "Messaging", icon: "MessageSquare", view: "messaging" as const },
      { label: "Communications", icon: "Video", view: "communications" as const },
      { label: "Social", icon: "Share2", view: "social" as const },
      { label: "Whiteboard", icon: "PenLine", view: "whiteboard" as const },
      { label: "Management", icon: "ClipboardList", view: "management" as const },
    ],
  };
}

function reshapeTalantonBusinessCentralSection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Business Central") return section;
  return {
    ...section,
    label: "Project Management",
    icon: "FolderKanban",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "projects-dashboard" as const },
      { label: "Internal Projects", icon: "FolderKanban", view: "projects-internal" as const },
      { label: "External Projects", icon: "FolderOpen", view: "projects-external" as const },
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
      return reshapeTalantonProductivitySection(
        reshapeTalantonCorporateSection(
          reshapeTalantonTrainingSection(reshapeTalantonBusinessCentralSection(filtered)),
        ),
      );
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
  "corporate-board-directors",
  "testing",
  "telemetry",
  "platform-analytics",
  "website-analytics",
  "workspaces-overview",
  "workspaces-new",
  "potential-clients",
  "qms-training",
  "marketing-training",
  "module-go-live",
  "unit311-details",
  // Technology Management: Settings only (do not hide top-level Settings section).
  "technology-settings",
]);

/** Platform-ops modules hidden on customer workspaces (OnwardAir and peers). */
export const CUSTOMER_PLATFORM_HIDDEN_VIEWS = new Set<InternalOperationsView>([
  "unit311-details",
  "module-go-live",
  "workspaces-overview",
  "workspaces-new",
]);

const ABHI_HIDDEN_ITEM_LABELS = new Set([
  "Cap Table Management",
  "Board of Directors",
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

  let items = section.items.filter(
    (item) =>
      item.view !== "corporate-board-directors" && item.label !== "Board of Directors",
  );

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
  const items = section.items
    .filter((item) => item.label !== "Social" && item.view !== "social")
    .map((item) => ({ ...item }));
  if (!items.some((item) => item.view === "whiteboard")) {
    items.push({
      label: "Whiteboard",
      icon: "PenLine",
      view: "whiteboard" as const,
    });
  }
  return { ...section, items };
}

function reshapeAbhiTrainingSection(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Training") return section;
  // ABHI Training: dashboard, course builder, and staff courses (no QMS / external training clutter).
  return {
    ...section,
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "training-dashboard" as const,
      },
      {
        label: "Course Builder",
        icon: "Sparkles",
        view: "course-builder" as const,
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

function stripAbhiMemberIntelligenceFromMembers(section: InternalNavSection): InternalNavSection {
  if (section.label !== "Business Central") return section;
  return {
    ...section,
    items: section.items.map((item) => {
      const isMembersGroup =
        item.label === "Clients" ||
        item.label === "Members" ||
        item.children?.some((child) => child.view === "clients");
      if (!isMembersGroup || !item.children?.length) return item;
      return {
        ...item,
        children: item.children.filter((child) => child.view !== "member-intelligence"),
      };
    }),
  };
}

function reshapeAbhiNavSection(section: InternalNavSection): InternalNavSection {
  return renameAbhiClientNavLabels(
    stripAbhiMemberIntelligenceFromMembers(
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

/**
 * Unique OnwardAir LHS accents — every module from EA downward must differ.
 * Home stays ONWARDAIR_HOME_ACCENT (RGB 38,123,144).
 */
function applyOnwardAirSectionColors(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return sections.map((section) => {
    if (section.kind === "pin") {
      const isHome = section.items.some((item) => item.view === "home");
      const isEa = section.items.some((item) => item.view === "executive-assistant");
      if (isHome) return { ...section, color: ONWARDAIR_HOME_ACCENT };
      if (isEa) return { ...section, color: ONWARDAIR_EA_ACCENT };
      return section;
    }
    const accent = section.label ? ONWARDAIR_MODULE_ACCENTS[section.label] : undefined;
    return accent ? { ...section, color: accent } : section;
  });
}

/** OnwardAir BOARD — same capability surface as ABHI, isolated tenant data. */
const ONWARDAIR_BOARD_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Board",
  icon: "ShieldCheck",
  color: ONWARDAIR_MODULE_ACCENTS.Board,
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "board-dashboard" as const },
    { label: "Board Meetings", icon: "CalendarDays", view: "board-meetings" as const },
    { label: "Board Decks", icon: "ScrollText", view: "board-pack" as const },
    { label: "Minutes & Decisions", icon: "ClipboardCheck", view: "board-minutes" as const },
    { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" as const },
    { label: "Board Members", icon: "Users", view: "board-members" as const },
  ],
};

const ONWARDAIR_FUNDRAISING_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Fundraising",
  icon: "Landmark",
  color: ONWARDAIR_MODULE_ACCENTS.Fundraising,
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "fundraising-dashboard" as const },
    {
      label: "Cap Table Management",
      icon: "Layers",
      view: "corporate-cap-table" as const,
    },
    { label: "Investors", icon: "Users", view: "fundraising-investors" as const },
    { label: "Pipeline", icon: "Target", view: "fundraising-pipeline" as const },
    { label: "Meetings", icon: "CalendarDays", view: "fundraising-meetings" as const },
    { label: "Pitch Decks", icon: "ScrollText", view: "fundraising-pitch-decks" as const },
    { label: "Data Rooms", icon: "FolderOpen", view: "fundraising-data-rooms" as const },
  ],
};

const ONWARDAIR_ENGINEERING_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Engineering",
  icon: "Cpu",
  color: ONWARDAIR_MODULE_ACCENTS.Engineering,
  items: [
    {
      label: "Engineering Overview",
      icon: "LayoutDashboard",
      view: "oa-engineering-overview" as const,
    },
    {
      label: "Programs & Milestones",
      icon: "Target",
      view: "oa-programs-milestones" as const,
    },
    {
      label: "Team & Capacity",
      icon: "Users",
      view: "oa-team-capacity" as const,
    },
    {
      label: "Assurance & Certification",
      icon: "ShieldCheck",
      view: "oa-assurance-certification" as const,
    },
    {
      label: "Engineering Risks",
      icon: "AlertTriangle",
      view: "oa-engineering-risks" as const,
    },
    {
      label: "Integrations",
      icon: "Plug",
      view: "oa-engineering-integrations" as const,
    },
  ],
};

const ONWARDAIR_TECH_HIDDEN_LABELS = new Set([
  "Infrastructure & Cloud",
  "Networks & Domains",
  "Certificates & Identity",
  "Security",
  "Settings",
]);

function stripOnwardAirPlatformItems(section: InternalNavSection): InternalNavSection {
  return {
    ...section,
    items: section.items
      .map((item) => {
        if (item.view === "unit311-details" || item.view === "module-go-live") return null;
        if (item.label === "Unit311 Details") return null;
        if (item.children?.length) {
          const children = item.children.filter(
            (child) =>
              child.view !== "unit311-details" &&
              child.view !== "module-go-live" &&
              child.label !== "Unit311 Details" &&
              child.label !== "Module Go-Live",
          );
          return { ...item, children };
        }
        return item;
      })
      .filter((item): item is NonNullable<typeof item> => item != null),
  };
}

/** OnwardAir IP & Patents — appended to Corporate Information (not a Board / Cap Table item). */
const ONWARDAIR_IP_PATENTS_NAV_ITEM: InternalNavItem = {
  label: "IP & Patents",
  icon: "ScrollText",
  children: [
    { label: "IP Overview", view: "oa-ip-overview" as const },
    { label: "Patents Dashboard", view: "oa-ip-dashboard" as const },
    { label: "Patent Register", view: "oa-ip-register" as const },
    { label: "Patent Portfolio", view: "oa-ip-portfolio" as const },
    { label: "Patent Documents", view: "oa-ip-documents" as const },
    { label: "Search", view: "oa-ip-search" as const },
  ],
};

/** Top-level OnwardAir Intelligence — cert-race competitors + ecosystem partners. */
const ONWARDAIR_INTELLIGENCE_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "OnwardAir Intelligence",
  icon: "Sparkles",
  color: ONWARDAIR_MODULE_ACCENTS["OnwardAir Intelligence"],
  items: [
    {
      label: "Competitor Intelligence",
      icon: "Target",
      view: "oa-competitor-intelligence" as const,
    },
    {
      label: "Ecosystem Partners",
      icon: "Handshake",
      view: "oa-ecosystem-partners" as const,
    },
  ],
};

/** Top-level Project Management — moved out of Business Central for OnwardAir. */
const ONWARDAIR_PROJECT_MANAGEMENT_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Project Management",
  icon: "FolderKanban",
  color: ONWARDAIR_MODULE_ACCENTS["Project Management"],
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "projects-dashboard" as const },
    { label: "Internal Projects", icon: "FolderKanban", view: "projects-internal" as const },
    { label: "External Projects", icon: "FolderOpen", view: "projects-external" as const },
  ],
};

/** Top-level Marketing & Events — own LHS module (not nested under Operations). */
const ONWARDAIR_MARKETING_EVENTS_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Marketing & Events",
  icon: "Share2",
  color: ONWARDAIR_MODULE_ACCENTS["Marketing & Events"],
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "oa-marketing-dashboard" as const },
    { label: "Social", icon: "Share2", view: "social" as const },
    { label: "Digital Newsletter", icon: "Mail", view: "marketing-newsletter" as const },
    { label: "External Events", icon: "CalendarDays", view: "marketing-events" as const },
    { label: "Event Management", icon: "ClipboardCheck", view: "marketing-event-management" as const },
    {
      label: "Mailing List Management",
      icon: "Users",
      view: "marketing-mailing-list" as const,
    },
  ],
};

function stripOnwardAirBusinessCentralProjects(section: InternalNavSection): InternalNavSection {
  return {
    ...section,
    items: section.items
      .filter(
        (item) =>
          item.label !== "Projects" &&
          item.label !== "Project Management" &&
          item.label !== "OnwardAir Intelligence" &&
          item.view !== "oa-competitor-intelligence" &&
          item.view !== "oa-ecosystem-partners" &&
          item.label !== "Competitor Intelligence" &&
          item.label !== "Ecosystem Partners",
      )
      .map((item) => {
        if (!item.children?.length) return item;
        return {
          ...item,
          children: item.children.filter(
            (child) =>
              child.view !== "potential-clients" &&
              child.view !== "oa-ecosystem-partners" &&
              child.label !== "Potential Clients" &&
              child.label !== "Ecosystem Partners",
          ),
        };
      }),
};
}

function insertOnwardAirNavSections(sections: readonly InternalNavSection[]): InternalNavSection[] {
  const out: InternalNavSection[] = [];
  let insertedBoard = false;
  let insertedFundraising = false;
  let insertedEngineering = false;
  let insertedProjectManagement = false;
  let insertedIntelligence = false;
  let insertedMarketing = false;

  for (const section of sections) {
    if (section.kind === "pin") {
      const isHome = section.items.some((item) => item.view === "home");
      out.push(
        isHome
          ? {
              ...section,
              /** OnwardAir brand teal RGB(38, 123, 144) — matches onwardair.tech CTA. */
              color: ONWARDAIR_HOME_ACCENT,
            }
          : section,
      );
      continue;
    }

    if (section.label === FINANCES_MODULE_LABEL) {
      out.push(stripOnwardAirPlatformItems(section));
      out.push(ONWARDAIR_FUNDRAISING_NAV_SECTION);
      insertedFundraising = true;
      continue;
    }

    if (section.label === "Corporate Information") {
      const filteredItems = section.items.filter(
        (item) =>
          item.view !== "board-meetings" &&
          item.view !== "board-pack" &&
          item.view !== "corporate-risk-register" &&
          item.view !== "corporate-cap-table" &&
          item.view !== "corporate-board-directors" &&
          item.view !== "unit311-details" &&
          item.view !== "module-go-live" &&
          item.label !== "Unit311 Details" &&
          item.label !== "Cap Table Management" &&
          item.label !== "Board of Directors",
      );
      out.push({
        ...section,
        items: [...filteredItems, ONWARDAIR_IP_PATENTS_NAV_ITEM],
      });
      out.push(ONWARDAIR_BOARD_NAV_SECTION);
      insertedBoard = true;
      continue;
    }

    if (section.label === "Business Central") {
      const stripped = stripOnwardAirBusinessCentralProjects(section);
      out.push({
        ...stripped,
        items: [
          {
            label: "Dashboard",
            icon: "LayoutDashboard",
            view: "business-central-dashboard" as const,
          },
          ...stripped.items,
          { label: "Grants", icon: "ScrollText", view: "grants" as const },
        ],
      });
      out.push(ONWARDAIR_PROJECT_MANAGEMENT_NAV_SECTION);
      out.push(ONWARDAIR_INTELLIGENCE_NAV_SECTION);
      insertedProjectManagement = true;
      insertedIntelligence = true;
      continue;
    }

    if (section.label === "Technology Management") {
      out.push({
        ...section,
        items: section.items.filter((item) => !ONWARDAIR_TECH_HIDDEN_LABELS.has(item.label)),
      });
      continue;
    }

    if (section.label === "Business Productivity") {
      out.push({
        ...section,
        items: section.items
          .filter(
            (item) =>
              item.label !== "Social" &&
              item.view !== "social" &&
              item.label !== "Support Desk",
          )
          .map((item) => {
            if (!item.children?.length) return item;
            return {
              ...item,
              children: item.children.filter(
                (child) =>
                  child.view !== "files-client" &&
                  child.label !== "Client Explorer",
              ),
            };
          })
          .filter(
            (item) =>
              item.view !== "files-client" && item.label !== "Client Explorer",
          ),
      });
      continue;
    }

    if (section.label === "Operations") {
      const cleaned = stripOnwardAirPlatformItems(section);
      const hasDashboard = cleaned.items.some(
        (item) => item.view === "operations-dashboard" || item.label === "Dashboard",
      );
      const withoutNestedMarketing = (
        hasDashboard
          ? cleaned.items
          : [
              {
                label: "Dashboard",
                icon: "LayoutDashboard",
                view: "operations-dashboard" as const,
              },
              ...cleaned.items,
            ]
      ).filter((item) => item.label !== "Marketing & Events");
      out.push({
        ...cleaned,
        items: withoutNestedMarketing,
      });
      out.push(ONWARDAIR_ENGINEERING_NAV_SECTION);
      insertedEngineering = true;
      continue;
    }

    out.push(stripOnwardAirPlatformItems(section));
  }

  if (!insertedFundraising) {
    const financialsIdx = out.findIndex((s) => s.label === FINANCES_MODULE_LABEL);
    if (financialsIdx >= 0) {
      out.splice(financialsIdx + 1, 0, ONWARDAIR_FUNDRAISING_NAV_SECTION);
    } else {
      out.push(ONWARDAIR_FUNDRAISING_NAV_SECTION);
    }
  }
  if (!insertedBoard) out.push(ONWARDAIR_BOARD_NAV_SECTION);
  if (!insertedMarketing) {
    // Keep Support Desk directly under Business Productivity; Marketing sits after Support Desk.
    const supportIdx = out.findIndex((s) => s.label === "Support Desk");
    const productivityIdx = out.findIndex((s) => s.label === "Business Productivity");
    const insertAfter = supportIdx >= 0 ? supportIdx : productivityIdx;
    if (insertAfter >= 0) {
      out.splice(insertAfter + 1, 0, ONWARDAIR_MARKETING_EVENTS_NAV_SECTION);
    } else {
      out.push(ONWARDAIR_MARKETING_EVENTS_NAV_SECTION);
    }
  }
  if (!insertedEngineering) {
    const operationsIdx = out.findIndex((s) => s.label === "Operations");
    if (operationsIdx >= 0) {
      out.splice(operationsIdx + 1, 0, ONWARDAIR_ENGINEERING_NAV_SECTION);
    } else {
      out.push(ONWARDAIR_ENGINEERING_NAV_SECTION);
    }
  }
  if (!insertedProjectManagement) {
    const bcIdx = out.findIndex((s) => s.label === "Business Central");
    if (bcIdx >= 0) {
      out.splice(bcIdx + 1, 0, ONWARDAIR_PROJECT_MANAGEMENT_NAV_SECTION);
    } else {
      out.push(ONWARDAIR_PROJECT_MANAGEMENT_NAV_SECTION);
    }
  }
  if (!insertedIntelligence) {
    const pmIdx = out.findIndex((s) => s.label === "Project Management");
    if (pmIdx >= 0) {
      out.splice(pmIdx + 1, 0, ONWARDAIR_INTELLIGENCE_NAV_SECTION);
    } else {
      out.push(ONWARDAIR_INTELLIGENCE_NAV_SECTION);
    }
  }

  // Module order is applied from Settings / localStorage — do not pre-sort here.
  return applyOnwardAirSectionColors(out).filter((section) => section.items.length > 0);
}

/** Pins first, then locked workspace order, Settings last; unknown modules before Settings. */
function sortOnwardAirSectionsByLockedOrder(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  const pins: InternalNavSection[] = [];
  const movable: InternalNavSection[] = [];
  let settings: InternalNavSection | null = null;

  for (const section of sections) {
    if (section.kind === "pin") {
      pins.push(section);
      continue;
    }
    if (section.label === "Settings") {
      settings = section;
      continue;
    }
    movable.push(section);
  }

  const byLabel = new Map(
    movable.map((section) => [String(section.label ?? ""), section] as const),
  );
  const ordered: InternalNavSection[] = [];
  for (const label of ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER) {
    const section = byLabel.get(label);
    if (section) {
      ordered.push(section);
      byLabel.delete(label);
    }
  }
  for (const section of byLabel.values()) ordered.push(section);

  return [...pins, ...ordered, ...(settings ? [settings] : [])];
}

function insertAbhiMarketingSection(sections: readonly InternalNavSection[]): InternalNavSection[] {
  try {
    const { ABHI_MARKETING_NAV_SECTION, ABHI_INTELLIGENCE_NAV_SECTION } =
      require("@/lib/abhi/nav") as typeof import("@/lib/abhi/nav");
    const out: InternalNavSection[] = [];
    let insertedMarketing = false;
    let insertedIntelligence = false;
    let insertedBoard = false;
    let insertedProjectManagement = false;
    for (const section of sections) {
      if (section.label === "Regulatory Intelligence" || section.label === "ABHI Intelligence") {
        continue;
      }
      const next = reshapeAbhiNavSection(section);
      if (next.label === "Business Central") {
        out.push(stripProjectsFromBusinessCentral(next));
        if (!insertedProjectManagement) {
          out.push(
            buildProjectManagementNavSection({
              color: ONWARDAIR_MODULE_ACCENTS["Project Management"],
            }),
          );
          insertedProjectManagement = true;
        }
      } else if (next.label === "Corporate Information") {
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
      const isEaPin =
        next.kind === "pin" &&
        next.items.some((item) => item.view === "executive-assistant");
      if (isEaPin && !insertedIntelligence) {
        out.push(ABHI_INTELLIGENCE_NAV_SECTION);
        insertedIntelligence = true;
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
    if (!insertedIntelligence) {
      const eaIdx = out.findIndex(
        (section) =>
          section.kind === "pin" &&
          section.items.some((item) => item.view === "executive-assistant"),
      );
      if (eaIdx >= 0) {
        out.splice(eaIdx + 1, 0, ABHI_INTELLIGENCE_NAV_SECTION);
      } else {
        const homeIdx = out.findIndex(
          (section) =>
            section.kind === "pin" && section.items.some((item) => item.view === "home"),
        );
        out.splice(homeIdx >= 0 ? homeIdx + 1 : 0, 0, ABHI_INTELLIGENCE_NAV_SECTION);
      }
    }
    if (!insertedMarketing) out.push(ABHI_MARKETING_NAV_SECTION);
    if (!insertedBoard) out.push(ABHI_BOARD_NAV_SECTION);
    if (!insertedProjectManagement) {
      out.push(
        buildProjectManagementNavSection({
          color: ONWARDAIR_MODULE_ACCENTS["Project Management"],
        }),
      );
    }
    // Module order is applied from Settings / localStorage — do not pre-sort here.
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

/**
 * Workspaces — Internal host only.
 * Top-level section after Settings with Workspace Overview + New Workspace.
 * Never in shared tenant catalogues or customer surfaces.
 */
function injectInternalWorkspacesNav(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  if (typeof window === "undefined") return [...sections];
  if (!isInternalDomainHost(window.location.hostname)) return [...sections];

  const cleaned = sections.filter((section) => section.label !== "Workspaces");
  if (cleaned.some((section) => section.label === "Workspaces")) {
    return cleaned;
  }

  const workspacesSection = buildWorkspacesNavSection();
  const settingsIdx = cleaned.findIndex((section) => section.label === "Settings");
  if (settingsIdx >= 0) {
    const out = [...cleaned];
    out.splice(settingsIdx + 1, 0, workspacesSection);
    return out;
  }
  return [...cleaned, workspacesSection];
}

function injectInternalOnlyNav(sections: readonly InternalNavSection[]): InternalNavSection[] {
  return injectInternalWorkspacesNav(injectInternalPlatformAnalytics(sections));
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

function stripCustomerPlatformNav(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (item.view && CUSTOMER_PLATFORM_HIDDEN_VIEWS.has(item.view)) return null;
          if (item.label === "Unit311 Details" || item.label === "Module Go-Live") return null;
          if (item.children?.length) {
            const children = item.children.filter(
              (child) =>
                !(child.view && CUSTOMER_PLATFORM_HIDDEN_VIEWS.has(child.view)) &&
                child.label !== "Unit311 Details" &&
                child.label !== "Module Go-Live",
            );
            if (children.length === 0 && !item.view && !item.href) return null;
            return { ...item, children };
          }
          return item;
        })
        .filter((item): item is NonNullable<typeof item> => item != null),
    }))
    .filter((section) => section.items.length > 0);
}

export function filterInternalNavSectionsForDemoSurface(
  sections: readonly InternalNavSection[],
  options?: { allowHostSurfaces?: boolean },
): InternalNavSection[] {
  // Host detectors read `window`. Keep them off until the sidebar has hydrated so
  // SSR HTML and the first client paint match (avoids React hydration crashes).
  const allowHostSurfaces = options?.allowHostSurfaces !== false;

  // Talanton customer host: strip QMS/Website, restore Training, prepend Portfolio Companies.
  if (allowHostSurfaces && isTalantonNavSurface()) {
    return appendTalantonNavSections(
      filterTalantonBaseNav(stripMemberIntelligenceNavForNonAbhi(sections)),
    );
  }

  // ABHI: ABHI Intelligence after EA; Marketing & Events after HR.
  if (allowHostSurfaces && isAbhiNavSurface()) {
    return insertAbhiMarketingSection(sections);
  }

  // OnwardAir: BOARD + Engineering/Operations placeholders (clean tenant, no ABHI data).
  // Still strip platform-only modules (Unit311 Details / Module Go-Live).
  if (allowHostSurfaces && isOnwardAirNavSurface()) {
    return insertOnwardAirNavSections(
      stripCustomerPlatformNav(stripMemberIntelligenceNavForNonAbhi(sections)),
    );
  }

  if (!shouldHideDroneToolNavViews()) {
    const base = stripMemberIntelligenceNavForNonAbhi(sections);
    // Platform-only modules (Unit311 Details / Module Go-Live) stay on Internal/Demo.
    // SSR and customer hosts default to stripped nav so tenants never flash platform chrome.
    let isPlatformHost = false;
    if (allowHostSurfaces && typeof window !== "undefined") {
      try {
        const { resolveRuntimeSurface } =
          require("@/lib/runtime-surface") as typeof import("@/lib/runtime-surface");
        const surface = resolveRuntimeSurface(window.location.hostname);
        isPlatformHost = surface === "internal" || surface === "demo";
      } catch {
        isPlatformHost = false;
      }
    }
    if (!isPlatformHost) {
      return injectInternalOnlyNav(stripCustomerPlatformNav(base));
    }
    return injectInternalOnlyNav(base);
  }

  const hideViews =
    allowHostSurfaces && isCorpCentreNavSurface() ? CORPCENTRE_HIDDEN_VIEWS : DEMO_HIDDEN_VIEWS;
  const hideUnit311Details = allowHostSurfaces && isCorpCentreNavSurface();
  const corpcentre = allowHostSurfaces && isCorpCentreNavSurface();

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
            if (item.view === "whatsapp-integration" || item.href?.includes("/whatsapp/support-flow")) {
              return { ...item, label: "WhatsApp Integration", view: "whatsapp-integration" as const, href: undefined };
            }
            return item;
          })
          .filter((item): item is NonNullable<typeof item> => item != null),
      };
    })
    .filter((section) => section.items.length > 0);

  return applyDemoNavExtensions(injectInternalOnlyNav(filtered), options);
}

function isDemoNavSurface(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserDemoSurface } =
      require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    return isBrowserDemoSurface();
  } catch {
    return false;
  }
}

export function applyDemoNavExtensions(
  sections: readonly InternalNavSection[],
  options?: { allowHostSurfaces?: boolean },
): InternalNavSection[] {
  const allowHostSurfaces = options?.allowHostSurfaces !== false;
  if (!allowHostSurfaces || !isDemoNavSurface()) return [...sections];
  const { injectDemoNavSections } = require("@/lib/demo/nav") as typeof import("@/lib/demo/nav");
  const { injectIntelligenceNavIfMissing } =
    require("@/lib/intelligence/nav") as typeof import("@/lib/intelligence/nav");
  const { DEMO_WORKSPACE_SLUG } = require("@/lib/app-domains") as typeof import("@/lib/app-domains");
  return injectIntelligenceNavIfMissing(injectDemoNavSections(sections), DEMO_WORKSPACE_SLUG);
}
