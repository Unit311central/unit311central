import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** Generic Demo nav sections — central view IDs only (no OA/Talanton/ABHI specialist views). */
const DEMO_FUNDRAISING_NAV: InternalNavSection = {
  kind: "workspace",
  label: "Fundraising",
  icon: "TrendingUp",
  color: "#D97706",
  items: [
    { label: "Dashboard", icon: "LayoutDashboard", view: "fundraising-dashboard" as const },
    { label: "Investors", icon: "Users", view: "fundraising-investors" as const },
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
    { label: "Stories", icon: "BookOpen", view: "portfolio-stories" as const },
  ],
};

const DEMO_ENGINEERING_NAV: InternalNavSection = {
  kind: "workspace",
  label: "Engineering",
  icon: "Wrench",
  color: "#0D9488",
  items: [
    { label: "Overview", icon: "LayoutDashboard", view: "engineering-dashboard" as const },
    { label: "Programs & Milestones", icon: "Milestone", view: "engineering-resources" as const },
    { label: "Team & Capacity", icon: "Users", view: "engineering-capacity" as const },
    { label: "Supply & Dependencies", icon: "Package", view: "engineering-capacity" as const },
    { label: "Risks", icon: "AlertTriangle", view: "engineering-capacity" as const },
  ],
};

const CORPORATE_BOARD_VIEWS = new Set<InternalOperationsView>([
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
  let insertedEngineering = false;

  for (const section of sections) {
    if (section.label === "Financials") {
      out.push(section);
      if (!insertedFundraising) {
        out.push(DEMO_FUNDRAISING_NAV);
        insertedFundraising = true;
      }
      continue;
    }

    if (section.label === "Corporate Information") {
      out.push({
        ...section,
        items: section.items.filter(
          (item) => !item.view || !CORPORATE_BOARD_VIEWS.has(item.view as InternalOperationsView),
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
      continue;
    }

    if (section.label === "Operations") {
      out.push(section);
      if (!insertedEngineering) {
        out.push(DEMO_ENGINEERING_NAV);
        insertedEngineering = true;
      }
      continue;
    }

    out.push(section);
  }

  if (!insertedFundraising) out.push(DEMO_FUNDRAISING_NAV);
  if (!insertedBoard) out.push(DEMO_BOARD_NAV);
  if (!insertedMarketing) out.push(DEMO_MARKETING_NAV);
  if (!insertedEngineering) out.push(DEMO_ENGINEERING_NAV);

  return out;
}
