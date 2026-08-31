/**
 * Workbench UI structure audit — LHS nav routing and workspace wiring.
 * Run: npm run prove:realtime-video-workbench-ui
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  WORKBENCH_TABS,
  buildRealtimeVideoWorkbenchNavItem,
  resolveWorkbenchTabIdFromSlug,
  workbenchTabSlug,
} from "@/lib/realtime-video-workbench-nav";

const EXPECTED_TAB_SLUGS = [
  "overview",
  "master-pipeline",
  "flight-scenarios",
  "mission-profiles",
  "video-bandwidth",
  "cost-calculator",
  "latency-success",
  "living-architectures",
  "assumptions",
  "test-runs",
  "failure-resilience",
  "architecture-options",
] as const;

assert.equal(WORKBENCH_TABS.length, 12, "Workbench must expose 12 sections");
for (const slug of EXPECTED_TAB_SLUGS) {
  assert.ok(
    WORKBENCH_TABS.some((t) => t.urlSlug === slug),
    `Missing URL slug: ${slug}`,
  );
}

const navItem = buildRealtimeVideoWorkbenchNavItem();
assert.equal(navItem.label, "Real-Time Video & AI Pipeline");
assert.equal(navItem.children?.length, 12);
assert.ok(!navItem.view, "Parent nav item must not duplicate as a flat view leaf");
for (const child of navItem.children ?? []) {
  assert.equal(child.view, "realtime-video-pipeline");
  assert.ok(child.query?.tab, `Child ${child.label} must deep-link with tab query`);
}

assert.equal(resolveWorkbenchTabIdFromSlug("cost-calculator"), "cost");
assert.equal(workbenchTabSlug("pipeline"), "master-pipeline");

const workspacePath = path.join(
  process.cwd(),
  "src/components/testflighthub/RealtimeVideoPipelineWorkspace.tsx",
);
const workspaceSrc = fs.readFileSync(workspacePath, "utf8");

assert.doesNotMatch(workspaceSrc, /WorkbenchNav/, "Horizontal WorkbenchNav must be removed");
assert.match(workspaceSrc, /resolveWorkbenchTabIdFromSlug/, "Workspace must read tab from URL");
assert.match(workspaceSrc, /CostCalculatorTab/, "Workspace must wire CostCalculatorTab");
assert.match(workspaceSrc, /MissionProfilesTab/, "Workspace must wire MissionProfilesTab");
assert.match(workspaceSrc, /VideoBandwidthTab/, "Workspace must wire VideoBandwidthTab");
assert.match(workspaceSrc, /LatencySuccessTab/, "Workspace must wire LatencySuccessTab");
assert.match(workspaceSrc, /FailureResilienceTab/, "Workspace must wire FailureResilienceTab");
assert.match(workspaceSrc, /ArchitectureOptionsTab/, "Workspace must wire ArchitectureOptionsTab");
assert.match(workspaceSrc, /TestRunsTab/, "Workspace must wire TestRunsTab");
assert.doesNotMatch(workspaceSrc, /CostModelTab/, "Legacy CostModelTab must be replaced");
assert.doesNotMatch(workspaceSrc, /CompareTab/, "Legacy CompareTab must be replaced");

const roleViewsSrc = fs.readFileSync(
  path.join(process.cwd(), "src/lib/internal-role-views.ts"),
  "utf8",
);
assert.match(roleViewsSrc, /buildRealtimeVideoWorkbenchNavItem/, "Analytics nav must nest workbench");

console.log("realtime-video-workbench-ui.check.ts: ok");
