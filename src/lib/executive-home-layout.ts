export type ExecutiveHomeTileId =
  | "ai"
  | "kpis"
  | "alerts-activity"
  | "analytics-queue";

export type ExecutiveHomeTileDefinition = {
  id: ExecutiveHomeTileId;
  title: string;
  description: string;
};

export const EXECUTIVE_HOME_TILE_CATALOG: ExecutiveHomeTileDefinition[] = [
  {
    id: "ai",
    title: "AI Executive Summary",
    description: "Headline briefing and next-up priorities.",
  },
  {
    id: "kpis",
    title: "KPI tiles",
    description: "Revenue, cash, burn rate, and clients.",
  },
  {
    id: "alerts-activity",
    title: "Alerts & activity",
    description: "Business alerts and recent activity.",
  },
  {
    id: "analytics-queue",
    title: "Performance & tasks",
    description: "Revenue vs spend chart and work queue.",
  },
];

export const DEFAULT_EXECUTIVE_HOME_LAYOUT: ExecutiveHomeTileId[] = [
  "ai",
  "kpis",
  "alerts-activity",
  "analytics-queue",
];

const STORAGE_KEY = "unit311-executive-home-tiles";
const catalogIds = new Set(EXECUTIVE_HOME_TILE_CATALOG.map((tile) => tile.id));

export function isExecutiveHomeTileId(value: string): value is ExecutiveHomeTileId {
  return catalogIds.has(value as ExecutiveHomeTileId);
}

export function loadExecutiveHomeLayout(): ExecutiveHomeTileId[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_EXECUTIVE_HOME_LAYOUT];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_EXECUTIVE_HOME_LAYOUT];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_EXECUTIVE_HOME_LAYOUT];
    const valid = parsed.filter((value): value is ExecutiveHomeTileId =>
      isExecutiveHomeTileId(String(value)),
    );
    return valid.length > 0 ? valid : [...DEFAULT_EXECUTIVE_HOME_LAYOUT];
  } catch {
    return [...DEFAULT_EXECUTIVE_HOME_LAYOUT];
  }
}

export function saveExecutiveHomeLayout(order: ExecutiveHomeTileId[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}
