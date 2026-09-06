/**
 * WOLF Model Testing Architecture navigation regression checks.
 *
 * Run: npx tsx src/lib/__tests__/wolf-model-testing-nav.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  WOLF_MODEL_TESTING_ARCH_AREA_LABEL,
  WOLF_MODEL_TESTING_MISSIONS,
  filterWolfGeneralDiagramTabs,
  getWolfModelTestingMissionSlugs,
  isWolfGeneralArchitectureDiagramSlug,
  isWolfModelTestingMissionSlug,
} from "@/lib/wolf/wolf-model-testing-nav";
import { WOLF_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-model-testing-arch-types";
import { WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-mission2-model-testing-arch-types";

assert.equal(WOLF_MODEL_TESTING_ARCH_AREA_LABEL, "Model Testing Architecture");
assert.equal(WOLF_MODEL_TESTING_MISSIONS.length, 2);
assert.equal(WOLF_MODEL_TESTING_MISSIONS[0]?.slug, "model-testing-arch");
assert.equal(WOLF_MODEL_TESTING_MISSIONS[1]?.slug, "mission-2-model-testing-arch");
assert.equal(
  WOLF_MODEL_TESTING_MISSIONS[0]?.title,
  "Mission 1 — Animal Detection & Counting",
);
assert.equal(
  WOLF_MODEL_TESTING_MISSIONS[1]?.title,
  "Mission 2 — Animal Injury / Welfare",
);

assert.ok(isWolfModelTestingMissionSlug("model-testing-arch"));
assert.ok(isWolfModelTestingMissionSlug("mission-2-model-testing-arch"));
assert.ok(!isWolfModelTestingMissionSlug("platform-overview"));
assert.ok(!isWolfModelTestingMissionSlug("wolf-architecture"));

assert.ok(isWolfGeneralArchitectureDiagramSlug("wolf-architecture"));
assert.ok(!isWolfGeneralArchitectureDiagramSlug("model-testing-arch"));
assert.ok(!isWolfGeneralArchitectureDiagramSlug("mission-2-model-testing-arch"));

const missionSlugs = getWolfModelTestingMissionSlugs();
assert.deepEqual(missionSlugs, [
  WOLF_MODEL_TESTING_ARCH_CATEGORY_ID,
  WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID,
]);

const mixedTabs = [
  { slug: "model-testing-arch", title: "Mission 1" },
  { slug: "mission-2-model-testing-arch", title: "Mission 2" },
  { slug: "platform-overview", title: "Platform Overview" },
  { slug: "vercel-stack", title: "Vercel" },
  { slug: "supabase-stack", title: "Supabase" },
  { slug: "codebase-stack", title: "Codebase" },
  { slug: "wolf-architecture", title: "WOLF ARCHITECTURE" },
];

const generalTabs = filterWolfGeneralDiagramTabs(mixedTabs);
assert.ok(!generalTabs.some((tab) => tab.slug === "model-testing-arch"));
assert.ok(!generalTabs.some((tab) => tab.slug === "mission-2-model-testing-arch"));
assert.ok(generalTabs.some((tab) => tab.slug === "wolf-architecture"));

assert.ok(!missionSlugs.includes("platform-overview"));
assert.ok(!missionSlugs.includes("vercel-stack"));
assert.ok(!missionSlugs.includes("supabase-stack"));
assert.ok(!missionSlugs.includes("codebase-stack"));
assert.ok(!WOLF_MODEL_TESTING_MISSIONS.some((mission) => mission.slug === "platform-overview"));
assert.ok(!WOLF_MODEL_TESTING_MISSIONS.some((mission) => mission.slug === "vercel-stack"));
assert.ok(!WOLF_MODEL_TESTING_MISSIONS.some((mission) => mission.slug === "supabase-stack"));
assert.ok(!WOLF_MODEL_TESTING_MISSIONS.some((mission) => mission.slug === "codebase-stack"));

const workspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfInformationRepositoryArchitectureWorkspace.tsx"),
  "utf8",
);
assert.ok(workspace.includes("WOLF_MODEL_TESTING_ARCH_AREA_LABEL"));
assert.ok(workspace.includes("WOLF_MODEL_TESTING_MISSIONS"));
assert.ok(workspace.includes("filterWolfGeneralDiagramTabs"));
assert.ok(workspace.includes('aria-label="Model testing missions"'));
assert.ok(workspace.includes("wolfNavArea === \"model-testing\""));

const mission1Workspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfModelTestingArchWorkspace.tsx"),
  "utf8",
);
assert.ok(mission1Workspace.includes("layoutOverlayMode"));
assert.ok(mission1Workspace.includes("hideLibrary"));

const mission2Workspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfMission2ModelTestingArchWorkspace.tsx"),
  "utf8",
);
assert.ok(mission2Workspace.includes("STATIONARY_ACROSS_OBSERVATIONS"));
assert.ok(mission2Workspace.includes("VISIBLE_ABNORMALITY_DETECTED"));
assert.ok(mission2Workspace.includes("layoutOverlayMode"));

console.log("wolf-model-testing-nav.check.ts — all assertions passed.");
