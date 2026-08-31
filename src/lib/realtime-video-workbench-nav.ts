import type { InternalNavChildItem, InternalNavItem, InternalOperationsView } from "@/lib/internal-operations-data";

/** Workbench sections — routed via LHS nav `?view=realtime-video-pipeline&tab=<urlSlug>`. */
export const WORKBENCH_TABS = [
  { id: "overview", label: "Overview", urlSlug: "overview", description: "Live engineering summary tiles" },
  { id: "pipeline", label: "Master Pipeline", urlSlug: "master-pipeline", description: "58-stage latency model & CRUD" },
  { id: "flight", label: "Flight Scenarios", urlSlug: "flight-scenarios", description: "Schedule, aircraft, connectivity" },
  { id: "missions", label: "Mission Profiles", urlSlug: "mission-profiles", description: "Compute intensity per mission" },
  { id: "video", label: "Video & Bandwidth", urlSlug: "video-bandwidth", description: "Bitrate, GB/TB, contention" },
  { id: "cost", label: "Cost Calculator", urlSlug: "cost-calculator", description: "WOLF vs Safari · 1–24 months" },
  { id: "latency", label: "Latency & Success", urlSlug: "latency-success", description: "Performance & PASS/FAIL criteria" },
  { id: "architectures", label: "Living Architectures", urlSlug: "living-architectures", description: "Dynamic pipeline views" },
  { id: "assumptions", label: "Assumptions", urlSlug: "assumptions", description: "Reference data register" },
  { id: "test-runs", label: "Test Runs", urlSlug: "test-runs", description: "Measured field telemetry" },
  { id: "failure", label: "Failure & Resilience", urlSlug: "failure-resilience", description: "Failure modes & recovery" },
  { id: "architecture-options", label: "Architecture Options", urlSlug: "architecture-options", description: "Cloud / edge / on-site" },
] as const;

export type WorkbenchTabId = (typeof WORKBENCH_TABS)[number]["id"];

export const REALTIME_VIDEO_WORKBENCH_NAV_LABEL = "Real-Time Video & AI Pipeline";

export const REALTIME_VIDEO_WORKBENCH_VIEW = "realtime-video-pipeline" as const;

export const DEFAULT_REALTIME_VIDEO_WORKBENCH_TAB_SLUG = "overview";

/** Views that carry `tab` query params for workbench deep links. */
export const REALTIME_VIDEO_WORKBENCH_QUERY_VIEWS: ReadonlySet<InternalOperationsView> = new Set([
  REALTIME_VIDEO_WORKBENCH_VIEW,
]);

const TAB_SLUG_BY_ID = Object.fromEntries(
  WORKBENCH_TABS.map((tab) => [tab.id, tab.urlSlug]),
) as Record<WorkbenchTabId, string>;

const TAB_ID_BY_SLUG = Object.fromEntries(
  WORKBENCH_TABS.map((tab) => [tab.urlSlug, tab.id]),
) as Record<string, WorkbenchTabId>;

export function isRealtimeVideoWorkbenchTabSlug(value: string | null | undefined): value is string {
  return value != null && value in TAB_ID_BY_SLUG;
}

export function resolveWorkbenchTabIdFromSlug(tabParam: string | null | undefined): WorkbenchTabId {
  if (tabParam && isRealtimeVideoWorkbenchTabSlug(tabParam)) {
    return TAB_ID_BY_SLUG[tabParam];
  }
  return "overview";
}

export function workbenchTabSlug(tabId: WorkbenchTabId): string {
  return TAB_SLUG_BY_ID[tabId];
}

export function getWorkbenchTabLabel(tabId: WorkbenchTabId): string {
  return WORKBENCH_TABS.find((tab) => tab.id === tabId)?.label ?? "Overview";
}

export function resolveRealtimeVideoWorkbenchShellTitles(tabParam: string | null | undefined): {
  title: string;
  subtitle: string;
  breadcrumb: readonly string[];
} {
  const tabId = resolveWorkbenchTabIdFromSlug(tabParam);
  const tabLabel = getWorkbenchTabLabel(tabId);
  return {
    title: tabLabel,
    subtitle: REALTIME_VIDEO_WORKBENCH_NAV_LABEL,
    breadcrumb: ["Analytics", REALTIME_VIDEO_WORKBENCH_NAV_LABEL, tabLabel],
  };
}

function workbenchNavChild(tabId: WorkbenchTabId, label: string): InternalNavChildItem {
  return {
    label,
    view: REALTIME_VIDEO_WORKBENCH_VIEW,
    query: { tab: workbenchTabSlug(tabId) },
  };
}

/** Nested LHS item under Analytics — expandable workbench parent with 12 destinations. */
export function buildRealtimeVideoWorkbenchNavItem(): InternalNavItem {
  return {
    label: REALTIME_VIDEO_WORKBENCH_NAV_LABEL,
    icon: "Video",
    children: WORKBENCH_TABS.map((tab) => workbenchNavChild(tab.id, tab.label)),
  };
}
