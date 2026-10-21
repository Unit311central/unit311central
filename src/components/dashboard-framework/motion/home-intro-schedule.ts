/** Coordinated Executive Home “dashboard story” timing (seconds from sequence start). */

export const HOME_INTRO_TOTAL_MS = 5200;
export const HOME_INTRO_COUNT_UP_MS = 2400;
export const HOME_INTRO_CHART_BAR_MS = 1.25;
export const HOME_INTRO_LINE_DRAW_S = 2.1;

export type HomeIntroLane =
  | "ai-metric"
  | "kpi"
  | "chart-annotation"
  | "chart-line"
  | "chart-bar"
  | "activity"
  | "queue";

export function homeIntroDelaySec(lane: HomeIntroLane, index: number): number {
  switch (lane) {
    case "ai-metric":
      return 0.2 + index * 0.14;
    case "kpi":
      return 0.55 + index * 0.24;
    case "chart-annotation":
      return 1.35 + index * 0.1;
    case "chart-line":
      return 1.25;
    case "chart-bar":
      return 1.85 + index * 0.08;
    case "activity":
      return 2.05 + index * 0.11;
    case "queue":
      return 2.65 + index * 0.13;
    default:
      return 0;
  }
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
