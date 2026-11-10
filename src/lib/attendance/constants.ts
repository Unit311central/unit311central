import type { InternalOperationsView } from "@/lib/internal-operations-data";

/**
 * Verified from public.workspaces where slug = 'demo'
 * (Unit311 Central Demo, workspace_type Demo, status Active).
 * Do not substitute. Writes refuse any other id.
 */
export const DEMO_ATTENDANCE_WORKSPACE_ID = "9f555e68-6430-4c9a-889b-b135f2acf8bf";

export const ATTENDANCE_VIEWS = [
  "attendance-dashboard",
  "attendance-employees",
  "attendance-test",
] as const satisfies readonly InternalOperationsView[];

export type AttendanceView = (typeof ATTENDANCE_VIEWS)[number];

export const ATTENDANCE_TIME_ZONE = "Europe/London";

/** Minutes after the scheduled start or before the scheduled end that still count as on time. */
export const ATTENDANCE_GRACE_MINUTES = 5;

export function isAttendanceNavView(view: string | null | undefined): view is AttendanceView {
  return (ATTENDANCE_VIEWS as readonly string[]).includes(String(view ?? ""));
}
