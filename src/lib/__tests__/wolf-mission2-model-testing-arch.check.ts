/**
 * WOLF MISSION 2 MODEL TESTING ARCH living repository regression checks.
 *
 * Run: npx tsx src/lib/__tests__/wolf-mission2-model-testing-arch.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createMission2ModelTestingArchitectureDiagram } from "@/lib/wolf/wolf-mission2-model-testing-arch-diagram";
import {
  WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS,
  WOLF_MISSION2_MODEL_TESTING_ARCH_VIDEOS,
} from "@/lib/wolf/wolf-mission2-model-testing-arch-data";
import { buildWolfMission2ModelTestingArchPayload } from "@/lib/wolf/wolf-mission2-model-testing-arch-service";
import { WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-mission2-model-testing-arch-types";
import {
  WOLF_IR_BUILTIN_DIAGRAM_LABELS,
  WOLF_IR_BUILTIN_DIAGRAM_SLUGS,
  WOLF_IR_WOLF_CATALOG,
  isWolfIrBuiltinDiagramSlug,
  isWolfIrManagedDiagramSlug,
  resolveWolfIrSeedDiagram,
} from "@/lib/wolf/wolf-information-repository-architecture-data";

assert.equal(WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID, "mission-2-model-testing-arch");
assert.ok(isWolfIrBuiltinDiagramSlug(WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID));
assert.ok(isWolfIrManagedDiagramSlug(WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID));
assert.equal(WOLF_IR_BUILTIN_DIAGRAM_SLUGS.length, 5);
assert.equal(
  WOLF_IR_BUILTIN_DIAGRAM_LABELS[WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID],
  "MISSION 2 MODEL TESTING ARCH",
);

const catalogEntry = WOLF_IR_WOLF_CATALOG.find(
  (entry) => entry.sectionSlug === WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID,
);
assert.ok(catalogEntry);
assert.equal(catalogEntry?.title, "MISSION 2 MODEL TESTING ARCH");

const payload = buildWolfMission2ModelTestingArchPayload();
assert.equal(payload.models.length, 17);
assert.equal(payload.videos.length, 5);
assert.ok(payload.diagram.nodes.length >= 12);
assert.match(payload.operationalStackLabel, /MegaDetector V6/);

const megadetector = payload.models.find((model) => model.id === "megadetector-v6");
assert.ok(megadetector);
assert.equal(megadetector?.outcome, "ACCEPTED");

const bytetrack = payload.models.find((model) => model.id === "bytetrack");
assert.ok(bytetrack);
assert.equal(bytetrack?.outcome, "ACCEPTED");

const temporal = payload.models.find((model) => model.id === "wolf-temporal-logic");
assert.ok(temporal);
assert.equal(temporal?.outcome, "ACCEPTED");

const superanimal = payload.models.find((model) => model.id === "superanimal-quadruped");
assert.ok(superanimal);
assert.equal(superanimal?.outcome, "TESTED");

const owlv2 = payload.models.find((model) => model.id === "owlv2-injury");
assert.ok(owlv2);
assert.equal(owlv2?.outcome, "TESTED");

const wolfRedTissue = payload.models.find((model) => model.id === "wolf-red-tissue-heuristic");
assert.ok(wolfRedTissue);
assert.equal(wolfRedTissue?.outcome, "TESTED");

const sam2Pipeline = payload.models.find((model) => model.id === "sam2-chromatic-saliency-pipeline");
assert.ok(sam2Pipeline);
assert.equal(sam2Pipeline?.outcome, "TESTED");

const seeded = resolveWolfIrSeedDiagram(WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID);
assert.equal(seeded.meta?.generator, "wolf-mission2-model-testing-arch");

const diagram = createMission2ModelTestingArchitectureDiagram();
assert.ok(diagram.nodes.some((node) => node.id === "megadetector"));
assert.ok(diagram.nodes.some((node) => node.id === "bytetrack"));
assert.ok(diagram.nodes.some((node) => node.id === "temporal-logic"));
assert.ok(diagram.nodes.some((node) => node.id === "visible-abnormality-signal"));
assert.ok(diagram.nodes.some((node) => node.id === "welfare-intelligence"));

const architectureWorkspaceSource = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfInformationRepositoryArchitectureWorkspace.tsx"),
  "utf8",
);
assert.ok(architectureWorkspaceSource.includes("WolfMission2ModelTestingArchWorkspace"));
assert.ok(architectureWorkspaceSource.includes("WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID"));

const mission2WorkspaceSource = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfMission2ModelTestingArchWorkspace.tsx"),
  "utf8",
);
assert.ok(mission2WorkspaceSource.includes("Mission 2 — Animal Injury / Welfare"));
assert.ok(mission2WorkspaceSource.includes("STATIONARY_ACROSS_OBSERVATIONS"));
assert.ok(mission2WorkspaceSource.includes("VISIBLE_ABNORMALITY_DETECTED"));

console.log("wolf-mission2-model-testing-arch.check.ts — all assertions passed.");
