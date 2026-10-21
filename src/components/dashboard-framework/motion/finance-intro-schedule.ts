/** Coordinated Finance dashboard motion timing (CFO control room). */

/** Above-the-fold hero + KPI row — runs on load only. */
export const FINANCE_HERO_TOTAL_MS = 2800;
export const FINANCE_HERO_ENTRANCE_S = 0.48;

/** Viewport sections — each chart block runs when scrolled into view. */
export const FINANCE_SECTION_CHART_S = 1.75;
export const FINANCE_SECTION_LINE_DRAW_S = 2;
export const FINANCE_SECTION_STACK_S = 1.65;
export const FINANCE_SECTION_ITEM_STAGGER_S = 0.14;

export type FinanceIntroLane =
  | "hero-panel"
  | "kpi-tile"
  | "liquidity-segment"
  | "ageing-bucket"
  | "chart-bar"
  | "chart-line"
  | "chart-area";

export function financeHeroDelaySec(lane: "hero-panel" | "kpi-tile", index: number): number {
  if (lane === "hero-panel") return 0.08;
  return 0.35 + index * 0.1;
}

export function financeSectionDelaySec(lane: FinanceIntroLane, index: number): number {
  switch (lane) {
    case "liquidity-segment":
      return 0.12 + index * 0.22;
    case "ageing-bucket":
      return 0.18 + index * FINANCE_SECTION_ITEM_STAGGER_S;
    case "chart-bar":
      return 0.15 + index * 0.08;
    case "chart-line":
    case "chart-area":
      return 0.1;
    default:
      return index * 0.06;
  }
}

export function financeSectionDelayMs(lane: FinanceIntroLane, index: number): number {
  return Math.round(financeSectionDelaySec(lane, index) * 1000);
}

/** AR buckets older than 60 days use overdue emphasis in motion UI. */
export function isFinanceAgeingOverdueBucket(bucketLabel: string): boolean {
  const normalized = bucketLabel.trim().toLowerCase();
  if (normalized.includes("90") || normalized.includes("61")) return true;
  if (normalized.includes("overdue")) return true;
  return false;
}
