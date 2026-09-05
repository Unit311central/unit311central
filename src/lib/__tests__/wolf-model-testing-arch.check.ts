/**
 * WOLF MODEL TESTING ARCH living repository regression checks.
 *
 * Run: npx tsx src/lib/__tests__/wolf-model-testing-arch.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  WOLF_INFORMATION_REPOSITORY_PROFILE,
  groupRepositoryCategoriesIntoRows,
  isWolfModelTestingArchCategoryId,
  resolveInformationRepositoryProfile,
} from "@/lib/information-repository-profile";
import { parseUnit311DetailCategoryId } from "@/lib/unit311-details-service";
import { WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG } from "@/components/testflighthub/information-repository-workspace-config";
import { createMission1ModelTestingArchitectureDiagram } from "@/lib/wolf/wolf-model-testing-arch-diagram";
import {
  WOLF_MODEL_TESTING_ARCH_MODELS,
  WOLF_MODEL_TESTING_ARCH_VIDEOS,
} from "@/lib/wolf/wolf-model-testing-arch-data";
import { buildWolfModelTestingArchPayload } from "@/lib/wolf/wolf-model-testing-arch-service";
import { WOLF_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-model-testing-arch-types";
import {
  createWolfArchitectureDiagram,
  createPailexInfrastructureDiagram,
} from "@/lib/wolf/wolf-information-repository-architecture-data";

assert.ok(isWolfModelTestingArchCategoryId(WOLF_MODEL_TESTING_ARCH_CATEGORY_ID));
assert.equal(parseUnit311DetailCategoryId(WOLF_MODEL_TESTING_ARCH_CATEGORY_ID), "model-testing-arch");
assert.equal(parseUnit311DetailCategoryId("platform-overview"), "platform-overview");
assert.equal(parseUnit311DetailCategoryId("invalid"), null);

const wolfProfile = resolveInformationRepositoryProfile("wolf-central");
assert.equal(wolfProfile.id, WOLF_INFORMATION_REPOSITORY_PROFILE.id);
assert.equal(wolfProfile.builtinCategories.length, 1);
assert.equal(wolfProfile.builtinCategories[0]?.id, WOLF_MODEL_TESTING_ARCH_CATEGORY_ID);
assert.equal(wolfProfile.builtinCategories[0]?.folderName, "1");

const wolfRows = groupRepositoryCategoriesIntoRows(wolfProfile.builtinCategories, wolfProfile);
assert.equal(wolfRows.length, 1);
assert.equal(wolfRows[0]?.[0]?.label, "MODEL TESTING ARCH");

assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.modelTestingArch, true);

const payload = buildWolfModelTestingArchPayload();
assert.equal(payload.models.length, 7);
assert.equal(payload.videos.length, 9);
assert.ok(payload.diagram.nodes.length >= 14);
assert.equal(
  payload.models.filter((node) => node.id.startsWith("wolf")).length,
  0,
  "model ids should not be wolf-*",
);

const wolfAiNodes = payload.diagram.nodes.filter((node) => node.data.label === "WOLF AI");
assert.ok(wolfAiNodes.length >= 5, "diagram must show WOLF AI between each stage");

const megadetector = payload.models.find((model) => model.id === "megadetector-v6");
assert.ok(megadetector);
assert.equal(megadetector?.outcome, "ACCEPTED");

const bytetrack = payload.models.find((model) => model.id === "bytetrack");
assert.ok(bytetrack);
assert.equal(bytetrack?.outcome, "PENDING");
assert.ok(!bytetrack?.modelFunction.toLowerCase().includes("species"));

const namib = payload.models.find((model) => model.id === "namib-desert-v1");
assert.ok(namib);
assert.equal(namib?.outcome, "LICENCE_REVIEW");

for (const video of payload.videos) {
  assert.equal(video.detectionCount, "Not yet benchmarked");
  assert.equal(video.uniqueAnimalCount, "Not yet benchmarked");
}

const diagram = createMission1ModelTestingArchitectureDiagram();
assert.ok(diagram.nodes.some((node) => node.id === "megadetector"));
assert.ok(diagram.nodes.some((node) => node.id === "bytetrack"));
assert.ok(diagram.nodes.some((node) => node.data.meta?.speciesModelSlot === true));
assert.ok(diagram.nodes.some((node) => node.id === "species-model"));
assert.ok(diagram.nodes.some((node) => node.id === "counting"));

const speciesNode = diagram.nodes.find((node) => node.id === "species-model");
assert.ok(speciesNode);
assert.match(String(speciesNode?.data.label), /REPLACEMENT SPECIES MODEL|accepted/i);

assert.equal(WOLF_MODEL_TESTING_ARCH_MODELS.length, 7);
assert.equal(WOLF_MODEL_TESTING_ARCH_VIDEOS.length, 9);
assert.deepEqual(
  WOLF_MODEL_TESTING_ARCH_VIDEOS.map((video) => video.slug).sort(),
  [
    "animals",
    "dazzle_anafi_zebra",
    "dazzle_mavic_zebra",
    "kabr_air_lowerres",
    "kabr_focal_giraffe",
    "kabr_herd_late",
    "kabr_herd_midalt",
    "wildlive_mavic3_a",
    "wildlive_mavic3_b",
  ],
);

const unchangedWolfDiagram = createWolfArchitectureDiagram();
const unchangedPailexDiagram = createPailexInfrastructureDiagram();
assert.ok(unchangedWolfDiagram.nodes.length >= 8);
assert.ok(unchangedPailexDiagram.nodes.length >= 12);

const workspaceSource = readFileSync(
  join(process.cwd(), "src/components/testflighthub/Unit311DetailsWorkspace.tsx"),
  "utf8",
);
assert.ok(workspaceSource.includes("WolfModelTestingArchWorkspace"));
assert.ok(workspaceSource.includes("WOLF_MODEL_TESTING_ARCH_CATEGORY_ID"));

const apiSource = readFileSync(
  join(process.cwd(), "src/app/api/information-repository/model-testing-arch/route.ts"),
  "utf8",
);
assert.ok(apiSource.includes("buildWolfModelTestingArchPayload"));
assert.ok(apiSource.includes("isWolfCentralSlug"));

console.log("wolf-model-testing-arch.check.ts — all assertions passed.");
