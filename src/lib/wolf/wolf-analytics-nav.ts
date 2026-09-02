import type { InternalNavSection } from "@/lib/internal-operations-data";
import { buildRealtimeVideoWorkbenchNavItem } from "@/lib/realtime-video-workbench-nav";

/** WOLF Central Analytics — cloned from Internal (no Website Analytics or SAEC Feedback). */
export function buildWolfAnalyticsNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Analytics",
    icon: "BarChart3",
    color: "#38BDF8",
    items: [
      { label: "Platform Analytics", icon: "LayoutDashboard", view: "platform-analytics" },
      { label: "System Health", icon: "Activity", view: "system-health" },
      buildRealtimeVideoWorkbenchNavItem(),
    ],
  };
}

export const WOLF_CENTRAL_ANALYTICS_VIEWS = [
  "platform-analytics",
  "system-health",
  "realtime-video-pipeline",
] as const;

export const WOLF_CENTRAL_ANALYTICS_SUBMODULE_KEYS = [
  "analytics:platform-analytics",
  "analytics:system-health",
  "analytics:realtime-video-pipeline",
] as const;
