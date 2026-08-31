/**
 * Workbench UI structure audit — ensures all 12 tabs are defined and wired.
 * Run: npm run prove:realtime-video-workbench-ui
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { WORKBENCH_TABS } from "@/components/testflighthub/realtime-video-workbench/shared";

const EXPECTED_TABS = [
  "overview",
  "pipeline",
  "flight",
  "missions",
  "video",
  "cost",
  "latency",
  "architectures",
  "assumptions",
  "test-runs",
  "failure",
  "architecture-options",
] as const;

assert.equal(WORKBENCH_TABS.length, 12, "Workbench must expose 12 top-level tabs");
for (const id of EXPECTED_TABS) {
  assert.ok(
    WORKBENCH_TABS.some((t) => t.id === id),
    `Missing tab: ${id}`,
  );
}

const workspacePath = path.join(
  process.cwd(),
  "src/components/testflighthub/RealtimeVideoPipelineWorkspace.tsx",
);
const workspaceSrc = fs.readFileSync(workspacePath, "utf8");

assert.match(workspaceSrc, /WorkbenchNav/, "Workspace must render WorkbenchNav");
assert.match(workspaceSrc, /CostCalculatorTab/, "Workspace must wire CostCalculatorTab");
assert.match(workspaceSrc, /MissionProfilesTab/, "Workspace must wire MissionProfilesTab");
assert.match(workspaceSrc, /VideoBandwidthTab/, "Workspace must wire VideoBandwidthTab");
assert.match(workspaceSrc, /LatencySuccessTab/, "Workspace must wire LatencySuccessTab");
assert.match(workspaceSrc, /FailureResilienceTab/, "Workspace must wire FailureResilienceTab");
assert.match(workspaceSrc, /ArchitectureOptionsTab/, "Workspace must wire ArchitectureOptionsTab");
assert.match(workspaceSrc, /TestRunsTab/, "Workspace must wire TestRunsTab");
assert.doesNotMatch(workspaceSrc, /CostModelTab/, "Legacy CostModelTab must be replaced");
assert.doesNotMatch(workspaceSrc, /CompareTab/, "Legacy CompareTab must be replaced");
assert.doesNotMatch(workspaceSrc, /activeTab === "performance"/, "Legacy performance tab removed");
assert.doesNotMatch(workspaceSrc, /activeTab === "criteria"/, "Legacy criteria tab removed");

console.log("realtime-video-workbench-ui.check.ts: ok");
