import { DEMO_ATTENDANCE_WORKSPACE_ID } from "@/lib/attendance/constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertDemoAttendanceWorkspace(workspace: {
  id: string;
  slug: string;
}): void {
  if (
    workspace.slug.trim().toLowerCase() !== "demo" ||
    workspace.id !== DEMO_ATTENDANCE_WORKSPACE_ID
  ) {
    throw new Error("Attendance is only available in the demo workspace.");
  }
}

/**
 * Delete filter for a simulation reset.
 * Genuine NFC rows have a null simulation id and source NFC, so they cannot match.
 */
export function simulationResetFilter(simulationId: string): {
  workspaceId: string;
  simulationId: string;
  source: "SIMULATED";
} {
  const id = simulationId.trim();
  if (!UUID_PATTERN.test(id)) {
    throw new Error("A simulation id is required.");
  }
  return {
    workspaceId: DEMO_ATTENDANCE_WORKSPACE_ID,
    simulationId: id,
    source: "SIMULATED",
  };
}
