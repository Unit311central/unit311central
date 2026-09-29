/** Board Dashboard tile layout (uses dashboard-view-tiles localStorage helpers). */

export const BOARD_DASHBOARD_TILE_STORAGE_KEY = "talanton-board-dashboard-tiles-v1";

export const BOARD_DASHBOARD_TILE_IDS = [
  "next-meeting",
  "latest-pack",
  "minutes-snapshot",
  "risk-heatmap",
] as const;

export type BoardDashboardTileId = (typeof BOARD_DASHBOARD_TILE_IDS)[number];

export const BOARD_DASHBOARD_TILE_LABELS: Record<BoardDashboardTileId, string> = {
  "next-meeting": "Next Board Meeting",
  "latest-pack": "Latest Approved Board Pack",
  "minutes-snapshot": "Minutes & Decisions",
  "risk-heatmap": "Risk Register Heat Map",
};

export const DEFAULT_BOARD_DASHBOARD_TILE_LAYOUT: BoardDashboardTileId[] = [
  ...BOARD_DASHBOARD_TILE_IDS,
];
