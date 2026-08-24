import type { InternalNavSection } from "@/lib/internal-operations-data";
import { FINANCES_MODULE_LABEL } from "@/lib/finances-nav";
import { ENGINEERING_SOPS_NAV_ITEM } from "@/lib/engineering-nav";
import {
  PROJECT_MANAGEMENT_MODULE_LABEL,
  buildProjectManagementNavSection,
} from "@/lib/project-management-nav";

/** Generic Demo nav sections — central view IDs only (no OA/Talanton/ABHI specialist views). */
const DEMO_FUNDRAISING_NAV: InternalNavSection = {
  kind: "workspace",
  label: "Fundraising",
  icon: "TrendingUp",
  color: "#D97706",
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "fundraising-dashboard" as const },
    { label: "Investors", icon: "Users", view: "fundraising-investors" as const },
    { label: "Cap Table Management", icon: "Layers", view: "fundraising-cap-table" as const },
    { label: "Pipeline", icon: "GitBranch", view: "fundraising-pipeline" as const },
    { label: "Meetings", icon: "CalendarDays", view: "fundraising-meetings" as const },
    { label: "Pitch Decks", icon: "Presentation", view: "fundraising-pitch-decks" as const },
    { label: "Data Rooms", icon: "FolderLock", view: "fundraising-data-rooms" as const },
  ],
};

const DEMO_BOARD_NAV: InternalNavSection = {
  kind: "workspace",
  label: "Board",
  icon: "Landmark",
  color: "#1E3A5F",
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "board-dashboard" as const },
    { label: "Meetings", icon: "CalendarDays", view: "board-meetings" as const },
    { label: "Minutes & Decisions", icon: "ScrollText", view: "board-minutes" as const },
    { label: "Board Members", icon: "Users", view: "board-members" as const },
    { label: "Board deck", icon: "FileText", view: "board-pack" as const },
    { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" as const },
  ],
};

const DEMO_MARKETING_NAV: InternalNavSection = {
  kind: "workspace",
  label: "Marketing & Events",
  icon: "Megaphone",
  color: "#DB2777",
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "oa-marketing-dashboard" as const },
    { label: "Digital Newsletter", icon: "Mail", view: "marketing-newsletter" as const },
    { label: "External Events", icon: "CalendarDays", view: "marketing-events" as const },
    { label: "Event Management", icon: "Ticket", view: "marketing-event-management" as const },
    { label: "Mailing List", icon: "Users", view: "marketing-mailing-list" as const },
    { label: "Client Stories", icon: "BookOpen", view: "portfolio-stories" as const },
  ],
};

const DEMO_PROJECT_MANAGEMENT_NAV = buildProjectManagementNavSection();

const DEMO_ENGINEERING_NAV: InternalNavSection = {
  kind: "workspace",
  label: "Engineering",
  icon: "Wrench",
  color: "#0D9488",
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "engineering-dashboard" as const },
    { label: "Programs & Milestones", icon: "Milestone", view: "engineering-programs" as const },
    { label: "Team & Capacity", icon: "Users", view: "engineering-capacity" as const },
    { label: "Risks", icon: "AlertTriangle", view: "engineering-risks" as const },
    { label: "Technical Files", icon: "FolderKanban", view: "engineering-technical-files" as const },
    ENGINEERING_SOPS_NAV_ITEM,
  ],
};

const CORPORATE_BOARD_VIEWS = new Set([
  "board-meetings",
  "board-pack",
  "corporate-risk-register",
]);

/**
 * Inject full Demo SME module catalogue after Intelligence pin section.
 */
export function injectDemoNavSections(sections: readonly InternalNavSection[]): InternalNavSection[] {
  const out: InternalNavSection[] = [];
  let insertedFundraising = false;
  let insertedBoard = false;
  let insertedMarketing = false;
  let insertedProjects = false;
  let insertedEngineering = false;

  for (const section of sections) {
    if (section.label === FINANCES_MODULE_LABEL) {
      out.push(section);
      if (!insertedFundraising) {
        out.push(DEMO_FUNDRAISING_NAV);
        insertedFundraising = true;
      }
      continue;
    }

    if (section.label === "Business Central") {
      out.push({
        ...section,
        items: [
          {
            label: "Dashboard",
            icon: "LayoutDashboard",
            view: "business-central-dashboard" as const,
          },
          ...section.items
            .filter(
              (item) =>
                item.label !== "Projects" && item.label !== PROJECT_MANAGEMENT_MODULE_LABEL,
            )
            .map((item) => {
              if (item.label !== "Projects" || !item.children) return item;
              return {
                ...item,
                children: item.children.filter(
                  (child) =>
                    !child.view?.startsWith("projects") && child.view !== "projects-dashboard",
                ),
              };
            }),
          { label: "Grants", icon: "ScrollText", view: "grants" as const },
        ],
      });
      continue;
    }

    if (section.label === "Corporate Information") {
      const corpItems = section.items
        .filter(
          (item) =>
            item.view !== "corporate-board-directors" &&
            item.view !== "corporate-cap-table" &&
            item.view !== "unit311-details" &&
            item.view !== "module-go-live" &&
            item.label !== "Board of Directors" &&
            item.label !== "Cap Table Management" &&
            item.label !== "Unit311 Details" &&
            (!item.view || !CORPORATE_BOARD_VIEWS.has(item.view)) &&
            !item.children?.some(
              (child) => child.view === "unit311-details" || child.view === "module-go-live",
            ),
        )
        .map((item) =>
          item.view === "corporate-company-details"
            ? { ...item, label: "Company Information" }
            : item,
        );
      const dashboard = corpItems.find((item) => item.view === "corporate-dashboard");
      const companyInfo = corpItems.find((item) => item.view === "corporate-company-details");
      const rest = corpItems.filter(
        (item) => item.view !== "corporate-dashboard" && item.view !== "corporate-company-details",
      );
      out.push({
        ...section,
        items: [dashboard, companyInfo, ...rest].filter(
          (item): item is (typeof corpItems)[number] => Boolean(item),
        ),
      });
      if (!insertedBoard) {
        out.push(DEMO_BOARD_NAV);
        insertedBoard = true;
      }
      continue;
    }

    if (section.label === "Human Resources") {
      out.push(section);
      if (!insertedMarketing) {
        out.push(DEMO_MARKETING_NAV);
        insertedMarketing = true;
      }
      if (!insertedProjects) {
        out.push(DEMO_PROJECT_MANAGEMENT_NAV);
        insertedProjects = true;
      }
      if (!insertedEngineering) {
        out.push(DEMO_ENGINEERING_NAV);
        insertedEngineering = true;
      }
      continue;
    }

    if (section.label === "Technology Management") {
      out.push(section);
      continue;
    }

    if (section.label === "Operations") {
      const hasDashboard = section.items.some(
        (item) => item.view === "operations-dashboard" || item.label === "Dashboard",
      );
      out.push({
        ...section,
        items: hasDashboard
          ? [...section.items]
          : [
              {
                label: "Dashboard",
                icon: "LayoutDashboard",
                view: "operations-dashboard" as const,
              },
              ...section.items,
            ],
      });
      continue;
    }

    out.push(section);
  }

  if (!insertedFundraising) out.push(DEMO_FUNDRAISING_NAV);
  if (!insertedBoard) out.push(DEMO_BOARD_NAV);
  if (!insertedMarketing) out.push(DEMO_MARKETING_NAV);
  if (!insertedProjects) out.push(DEMO_PROJECT_MANAGEMENT_NAV);
  if (!insertedEngineering) out.push(DEMO_ENGINEERING_NAV);

  return out;
}
