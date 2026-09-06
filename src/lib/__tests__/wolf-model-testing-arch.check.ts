/**
 * WOLF MODEL TESTING ARCH living repository regression checks.
 *
 * Run: npx tsx src/lib/__tests__/wolf-model-testing-arch.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveInformationRepositoryProfile } from "@/lib/information-repository-profile";
import { createMission1ModelTestingArchitectureDiagram } from "@/lib/wolf/wolf-model-testing-arch-diagram";
import {
  WOLF_MODEL_TESTING_ARCH_MODELS,
  WOLF_MODEL_TESTING_ARCH_VIDEOS,
} from "@/lib/wolf/wolf-model-testing-arch-data";
import { buildWolfModelTestingArchPayload } from "@/lib/wolf/wolf-model-testing-arch-service";
import { WOLF_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-model-testing-arch-types";
import {
  WOLF_IR_BUILTIN_DIAGRAM_LABELS,
  WOLF_IR_BUILTIN_DIAGRAM_SLUGS,
  WOLF_IR_WOLF_CATALOG,
  createWolfArchitectureDiagram,
  createPailexInfrastructureDiagram,
  isWolfIrBuiltinDiagramSlug,
  isWolfIrManagedDiagramSlug,
  resolveWolfIrSeedDiagram,
} from "@/lib/wolf/wolf-information-repository-architecture-data";

assert.equal(WOLF_MODEL_TESTING_ARCH_CATEGORY_ID, "model-testing-arch");
assert.ok(isWolfIrBuiltinDiagramSlug(WOLF_MODEL_TESTING_ARCH_CATEGORY_ID));
assert.ok(isWolfIrManagedDiagramSlug(WOLF_MODEL_TESTING_ARCH_CATEGORY_ID));
assert.equal(WOLF_IR_BUILTIN_DIAGRAM_SLUGS.length, 5);
assert.equal(
  WOLF_IR_BUILTIN_DIAGRAM_LABELS[WOLF_MODEL_TESTING_ARCH_CATEGORY_ID],
  "MODEL TESTING ARCH",
);

const catalogEntry = WOLF_IR_WOLF_CATALOG.find(
  (entry) => entry.sectionSlug === WOLF_MODEL_TESTING_ARCH_CATEGORY_ID,
);
assert.ok(catalogEntry);
assert.equal(catalogEntry?.title, "MODEL TESTING ARCH");

const wolfProfile = resolveInformationRepositoryProfile("wolf-central");
assert.equal(wolfProfile.builtinCategories.length, 0);

const payload = buildWolfModelTestingArchPayload();
assert.equal(payload.models.length, 10);
assert.equal(payload.videos.length, 9);
assert.ok(payload.diagram.nodes.length >= 14);

const wolfAiNodes = payload.diagram.nodes.filter((node) => node.data.label === "WOLF AI");
assert.ok(wolfAiNodes.length >= 5, "diagram must show WOLF AI between each stage");

const megadetector = payload.models.find((model) => model.id === "megadetector-v6");
assert.ok(megadetector);
assert.equal(megadetector?.outcome, "ACCEPTED");

const bytetrack = payload.models.find((model) => model.id === "bytetrack");
assert.ok(bytetrack);
assert.equal(bytetrack?.outcome, "PENDING");
assert.ok(!bytetrack?.modelFunction.toLowerCase().includes("species"));

const bioclip2 = payload.models.find((model) => model.id === "bioclip2");
assert.ok(bioclip2);
assert.equal(bioclip2?.outcome, "TESTED");

const biotrove = payload.models.find((model) => model.id === "biotrove-clip-b");
assert.ok(biotrove);
assert.equal(biotrove?.outcome, "REJECTED");

const speciesnet = payload.models.find((model) => model.id === "speciesnet");
assert.ok(speciesnet);
assert.equal(speciesnet?.outcome, "REJECTED");

const namib = payload.models.find((model) => model.id === "namib-desert-v1");
assert.ok(namib);
assert.equal(namib?.outcome, "LICENCE_REVIEW");

for (const video of payload.videos) {
  if (video.slug === "animals" || video.slug.startsWith("kabr_")) {
    assert.notEqual(video.detectionCount, "Mission 1 GT benchmark");
  } else if (
    video.slug === "wildlive_mavic3_a" ||
    video.slug === "wildlive_mavic3_b" ||
    video.slug === "dazzle_mavic_zebra" ||
    video.slug === "dazzle_anafi_zebra"
  ) {
    assert.equal(video.detectionCount, "Mission 1 GT benchmark");
  }
}

const diagram = createMission1ModelTestingArchitectureDiagram();
assert.ok(diagram.nodes.some((node) => node.id === "megadetector"));
assert.ok(diagram.nodes.some((node) => node.id === "bytetrack"));
assert.ok(diagram.nodes.some((node) => node.data.meta?.speciesModelSlot === true));
assert.ok(diagram.nodes.some((node) => node.id === "species-model"));

const speciesNode = diagram.nodes.find((node) => node.id === "species-model");
assert.ok(speciesNode);
assert.match(String(speciesNode?.data.label), /REPLACEMENT SPECIES MODEL/);
assert.doesNotMatch(String(speciesNode?.data.label), /SpeciesNet/i);

const seeded = resolveWolfIrSeedDiagram(WOLF_MODEL_TESTING_ARCH_CATEGORY_ID);
assert.equal(seeded.meta?.generator, "wolf-model-testing-arch");

assert.equal(WOLF_MODEL_TESTING_ARCH_MODELS.length, 10);
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

const architectureWorkspaceSource = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfInformationRepositoryArchitectureWorkspace.tsx"),
  "utf8",
);
assert.ok(architectureWorkspaceSource.includes("WolfModelTestingArchWorkspace"));
assert.ok(architectureWorkspaceSource.includes("WOLF_IR_DEFAULT_WOLF_DIAGRAM_SLUG"));
assert.ok(architectureWorkspaceSource.includes("overflow-x-auto"));

const detailsWorkspaceSource = readFileSync(
  join(process.cwd(), "src/components/testflighthub/Unit311DetailsWorkspace.tsx"),
  "utf8",
);
assert.doesNotMatch(detailsWorkspaceSource, /WolfModelTestingArchWorkspace/);

const modelTestingWorkspaceSource = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfModelTestingArchWorkspace.tsx"),
  "utf8",
);
assert.ok(modelTestingWorkspaceSource.includes("Mission 1 — Animal Detection & Counting"));
assert.ok(
  modelTestingWorkspaceSource.includes(
    "Mission 1 — Animal Detection & Counting · Living Model Testing Summary",
  ),
);
assert.ok(modelTestingWorkspaceSource.includes("layoutOverlayMode"));
assert.ok(modelTestingWorkspaceSource.includes("living architecture diagram, not a static document"));

console.log("wolf-model-testing-arch.check.ts — all assertions passed.");
