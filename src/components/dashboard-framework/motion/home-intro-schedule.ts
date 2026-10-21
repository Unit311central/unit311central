/** Coordinated Executive Home motion timing. */

/** Hero (above-the-fold) intro — AI summary + KPI row on load. */
export const HOME_HERO_COUNT_UP_MS = 2200;
export const HOME_HERO_TOTAL_MS = 3800;

/** Viewport sections — each runs ~1.5–2.5s when scrolled into view. */
export const HOME_SECTION_COUNT_UP_MS = 2000;
export const HOME_SECTION_CHART_BAR_S = 1.85;
export const HOME_SECTION_LINE_DRAW_S = 2.05;
export const HOME_SECTION_ITEM_STAGGER_S = 0.11;

/** @deprecated Use HOME_HERO_TOTAL_MS for hero scheduler. */
export const HOME_INTRO_TOTAL_MS = HOME_HERO_TOTAL_MS;
export const HOME_INTRO_COUNT_UP_MS = HOME_HERO_COUNT_UP_MS;
export const HOME_INTRO_CHART_BAR_MS = HOME_SECTION_CHART_BAR_S;
export const HOME_INTRO_LINE_DRAW_S = HOME_SECTION_LINE_DRAW_S;

export type HomeIntroLane =
  | "ai-metric"
  | "kpi"
  | "chart-annotation"
  | "chart-line"
  | "chart-bar"
  | "activity"
  | "queue";

/** Delays from hero sequence start (load). */
export function homeHeroDelaySec(lane: "ai-metric" | "kpi", index: number): number {
  switch (lane) {
    case "ai-metric":
      return 0.15 + index * 0.12;
    case "kpi":
      return 0.4 + index * 0.2;
    default:
      return 0;
  }
}

/** Delays from section viewport entry (each section timeline starts at 0). */
export function homeSectionDelaySec(lane: HomeIntroLane, index: number): number {
  switch (lane) {
    case "chart-annotation":
      return 0.08 + index * 0.09;
    case "chart-line":
      return 0.05;
    case "chart-bar":
      return 0.2 + index * 0.07;
    case "activity":
      return index * HOME_SECTION_ITEM_STAGGER_S;
    case "queue":
      return index * HOME_SECTION_ITEM_STAGGER_S;
    default:
      return 0;
  }
}

/** @deprecated Hero-only lanes; use homeHeroDelaySec or homeSectionDelaySec. */
export function homeIntroDelaySec(lane: HomeIntroLane, index: number): number {
  if (lane === "ai-metric" || lane === "kpi") return homeHeroDelaySec(lane, index);
  return homeSectionDelaySec(lane, index);
}

export function homeHeroDelayMs(lane: "ai-metric" | "kpi", index: number): number {
  return Math.round(homeHeroDelaySec(lane, index) * 1000);
}

export function homeSectionDelayMs(lane: HomeIntroLane, index: number): number {
  return Math.round(homeSectionDelaySec(lane, index) * 1000);
}

export function homeIntroDelayMs(lane: HomeIntroLane, index: number): number {
  return Math.round(homeIntroDelaySec(lane, index) * 1000);
}

/** Priority → attention bar width (static business signal, not simulated live progress). */
export function queueAttentionFraction(priority: "high" | "medium" | "low" | undefined): number {
  switch (priority) {
    case "high":
      return 1;
    case "medium":
      return 0.68;
    case "low":
      return 0.42;
    default:
      return 0.55;
  }
}
