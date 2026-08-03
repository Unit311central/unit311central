export type BoardPackCategory =
  | "executive"
  | "sales"
  | "commercial"
  | "financial"
  | "operations"
  | "governance"
  | "portfolio-company-report"
  | "impact-report";

export type BoardPackGraphType =
  | "none"
  | "accountancy-external"
  | "projects-portfolio"
  | "financial-pl"
  | "financial-revenue"
  | "financial-pipeline";

export type BoardPackPage = {
  id: string;
  title: string;
  category: BoardPackCategory;
  bodyText: string;
  graphType: BoardPackGraphType;
};

export type SavedBoardPack = {
  id: string;
  packName: string;
  savedAt: string;
  filename: string;
  folderPath: string;
  category: BoardPackCategory;
  pageCount: number;
  folderId: string | null;
  fileObjectId: string | null;
};

export const BOARD_PACK_CATEGORY_OPTIONS: { value: BoardPackCategory; label: string }[] = [
  { value: "executive", label: "Executive summary" },
  { value: "sales", label: "Sales" },
  { value: "commercial", label: "Commercial" },
  { value: "financial", label: "Financial" },
  { value: "operations", label: "Operations" },
  { value: "governance", label: "Governance" },
  { value: "portfolio-company-report", label: "Portfolio Company Report" },
  { value: "impact-report", label: "Impact Report" },
];

export const BOARD_PACK_GRAPH_OPTIONS: { value: BoardPackGraphType; label: string }[] = [
  { value: "none", label: "No graph" },
  { value: "accountancy-external", label: "External accountancy package" },
  { value: "projects-portfolio", label: "Projects portfolio" },
  { value: "financial-pl", label: "P & L" },
  { value: "financial-revenue", label: "Revenue trend" },
  { value: "financial-pipeline", label: "Pipeline by region" },
];

const PACK_PAGES_KEY = "unit311-board-pack-pages";
const SAVED_PACKS_KEY = "unit311-board-pack-saved";

export function createBlankBoardPackPage(): BoardPackPage {
  return {
    id: `page-${Date.now().toString(36)}`,
    title: "",
    category: "executive",
    bodyText: "",
    graphType: "none",
  };
}

export function defaultBoardPackPages(): BoardPackPage[] {
  if (typeof window !== "undefined") {
    try {
      const { isBrowserTalantonImpactSurface } =
        require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
      if (isBrowserTalantonImpactSurface()) {
        return [
          {
            id: "page-exec",
            title: "Executive Summary",
            category: "executive",
            bodyText:
              "Talanton Impact board overview — portfolio health, capital deployment, and impact outcomes across active African holdings.",
            graphType: "projects-portfolio",
          },
          {
            id: "page-portfolio-report",
            title: "Portfolio Company Report",
            category: "portfolio-company-report",
            bodyText:
              "Holding-level performance, ownership, revenue trajectory, and board actions for priority portfolio companies.",
            graphType: "projects-portfolio",
          },
          {
            id: "page-impact-report",
            title: "Impact Report",
            category: "impact-report",
            bodyText:
              "Jobs created, people served, communities impacted, and Impact Health Score with recommended board actions.",
            graphType: "none",
          },
          {
            id: "page-governance",
            title: "Governance & Risk",
            category: "governance",
            bodyText:
              "Risk register highlights, compliance posture, and resolutions requiring board endorsement.",
            graphType: "none",
          },
        ];
      }
    } catch {
      /* fall through */
    }
  }

  return [
    {
      id: "page-exec",
      title: "Executive Summary",
      category: "executive",
      bodyText:
        "Quarterly performance overview for the board. Revenue, margin, and pipeline remain on track against FY targets.",
      graphType: "financial-revenue",
    },
    {
      id: "page-sales",
      title: "Sales & Commercial",
      category: "sales",
      bodyText: "Pipeline conversion and key account activity for the quarter.",
      graphType: "financial-pipeline",
    },
  ];
}

export function loadBoardPackPages(): BoardPackPage[] {
  if (typeof window === "undefined") return defaultBoardPackPages();
  try {
    const raw = localStorage.getItem(PACK_PAGES_KEY);
    if (!raw) return defaultBoardPackPages();
    const parsed = JSON.parse(raw) as BoardPackPage[];
    return parsed.length > 0 ? parsed : defaultBoardPackPages();
  } catch {
    return defaultBoardPackPages();
  }
}

export function saveBoardPackPages(pages: BoardPackPage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PACK_PAGES_KEY, JSON.stringify(pages));
}

export function loadSavedBoardPacks(): SavedBoardPack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_PACKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedBoardPack[];
  } catch {
    return [];
  }
}

export function addSavedBoardPack(entry: SavedBoardPack) {
  const current = loadSavedBoardPacks();
  localStorage.setItem(SAVED_PACKS_KEY, JSON.stringify([entry, ...current]));
}

export function boardPackFolderName(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Board Pack ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function categoryLabel(category: BoardPackCategory) {
  return BOARD_PACK_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}
