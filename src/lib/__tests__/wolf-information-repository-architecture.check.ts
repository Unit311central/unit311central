/**
 * WOLF Information Repository architecture diagram regression checks.
 *
 * Run: npx tsx src/lib/__tests__/wolf-information-repository-architecture.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG } from "@/components/testflighthub/information-repository-workspace-config";
import {
  WOLF_IR_BUILTIN_DIAGRAM_SLUGS,
  WOLF_IR_UNIT311_CANVAS_SLUGS,
  WOLF_IR_WOLF_CATALOG,
  WOLF_IR_BUILTIN_DIAGRAM_LABELS,
  createPailexInfrastructureDiagram,
  createWolfArchitectureDiagram,
  createWolfIrCustomDiagramSlug,
  isWolfIrCustomDiagramSlug,
  isWolfIrManagedDiagramSlug,
} from "@/lib/wolf/wolf-information-repository-architecture-data";
import {
  WOLF_IR_DEFAULT_WOLF_DIAGRAM_SLUG,
  WOLF_MODEL_TESTING_ARCH_CATEGORY_ID,
} from "@/lib/wolf/wolf-model-testing-arch-types";

assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.architectureDiagrams, true);
assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.architectureHub, false);
assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.recordAttachments, true);

assert.equal(WOLF_IR_UNIT311_CANVAS_SLUGS.length, 4);
assert.equal(WOLF_IR_BUILTIN_DIAGRAM_SLUGS.length, 4);
assert.ok(isWolfIrManagedDiagramSlug("wolf-architecture"));
assert.ok(isWolfIrManagedDiagramSlug("wolf-pailex-infrastructure"));
assert.ok(isWolfIrManagedDiagramSlug("wolf-ai-models"));
assert.ok(isWolfIrManagedDiagramSlug("model-testing-arch"));
assert.ok(!isWolfIrManagedDiagramSlug("platform-overview"));

assert.equal(
  WOLF_IR_BUILTIN_DIAGRAM_LABELS[WOLF_MODEL_TESTING_ARCH_CATEGORY_ID],
  "MODEL TESTING ARCH",
);
assert.equal(WOLF_IR_DEFAULT_WOLF_DIAGRAM_SLUG, WOLF_MODEL_TESTING_ARCH_CATEGORY_ID);
assert.equal(WOLF_IR_WOLF_CATALOG[0]?.sectionSlug, WOLF_MODEL_TESTING_ARCH_CATEGORY_ID);
assert.equal(WOLF_IR_WOLF_CATALOG[0]?.title, "MODEL TESTING ARCH");
assert.equal(WOLF_IR_BUILTIN_DIAGRAM_SLUGS[0], WOLF_MODEL_TESTING_ARCH_CATEGORY_ID);

const catalogWithCustom = [
  ...WOLF_IR_WOLF_CATALOG,
  {
    sectionSlug: "wolf-custom-wolf-ai-test",
    title: "WOLF AI",
    description: "Custom WOLF architecture diagram",
    navOrder: 1000,
    seedTemplate: "blank" as const,
  },
];
assert.equal(catalogWithCustom[0]?.title, "MODEL TESTING ARCH");
assert.ok(catalogWithCustom.some((entry) => entry.title === "WOLF AI"));
assert.equal(
  catalogWithCustom.filter((entry) => entry.title === "WOLF ARCHITECTURE").length,
  1,
);

const customSlug = createWolfIrCustomDiagramSlug("Reserve telemetry");
assert.ok(isWolfIrCustomDiagramSlug(customSlug));
assert.ok(isWolfIrManagedDiagramSlug(customSlug));
assert.ok(customSlug.startsWith("wolf-custom-"));

const wolfDiagram = createWolfArchitectureDiagram();
assert.equal(wolfDiagram.version, 1);
assert.ok(wolfDiagram.nodes.length >= 8);
assert.ok(wolfDiagram.edges.length >= 5);

const pailexDiagram = createPailexInfrastructureDiagram();
assert.equal(pailexDiagram.version, 1);
assert.ok(pailexDiagram.nodes.length >= 12);
assert.ok(pailexDiagram.edges.length >= 10);
assert.ok(pailexDiagram.nodes.some((node) => node.id === "drone"));
assert.ok(pailexDiagram.nodes.some((node) => node.id === "runpod"));
assert.ok(pailexDiagram.nodes.some((node) => node.id === "vercel"));

const apiRoute = readFileSync(
  join(process.cwd(), "src/app/api/information-repository/architecture-diagrams/route.ts"),
  "utf8",
);
assert.ok(apiRoute.includes("requireWolfInformationRepositoryArchitectureSession"));
assert.ok(apiRoute.includes('scope === "wolf"'));
assert.ok(apiRoute.includes("DELETE"));

const workspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/WolfInformationRepositoryArchitectureWorkspace.tsx"),
  "utf8",
);
assert.ok(workspace.includes("WolfModelTestingArchWorkspace"));
assert.ok(workspace.includes("WOLF_IR_DEFAULT_WOLF_DIAGRAM_SLUG"));
assert.ok(workspace.includes("overflow-x-auto"));
assert.ok(workspace.includes("isModelTestingArchSlug"));
const modelTestingArchRender = workspace.indexOf(
  "topScope === \"wolf\" && isModelTestingArchSlug(activeSlug)",
);
const errorFallbackRender = workspace.indexOf(") : error ? (");
assert.ok(
  modelTestingArchRender !== -1 && errorFallbackRender !== -1 && modelTestingArchRender < errorFallbackRender,
  "MODEL TESTING ARCH workspace must render before the error fallback branch",
);
assert.ok(workspace.includes("if (scope === \"wolf\" && isModelTestingArchSlug(sectionSlug))"));

const interfaceWorkspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InterfaceWorxInformationRepositoryWorkspace.tsx"),
  "utf8",
);
assert.ok(interfaceWorkspace.includes("WolfInformationRepositoryArchitectureWorkspace"));
assert.ok(interfaceWorkspace.includes("architectureDiagrams"));

console.log("wolf-information-repository-architecture.check.ts — all assertions passed.");
