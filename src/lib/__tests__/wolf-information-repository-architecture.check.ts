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
  WOLF_AI_MODELS_SEED_VERSION,
  createPailexInfrastructureDiagram,
  createWolfAiModelsDiagram,
  createWolfIntelligenceDiagram,
  createWolfArchitectureDiagram,
  createWolfIrCustomDiagramSlug,
  isWolfIrCustomDiagramSlug,
  isWolfIrManagedDiagramSlug,
  shouldRefreshWolfIrBuiltinDiagram,
} from "@/lib/wolf/wolf-information-repository-architecture-data";
import {
  WOLF_IR_DEFAULT_WOLF_DIAGRAM_SLUG,
  WOLF_MODEL_TESTING_ARCH_CATEGORY_ID,
} from "@/lib/wolf/wolf-model-testing-arch-types";

assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.architectureDiagrams, true);
assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.architectureHub, false);
assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.recordAttachments, true);

assert.equal(WOLF_IR_UNIT311_CANVAS_SLUGS.length, 4);
assert.equal(WOLF_IR_BUILTIN_DIAGRAM_SLUGS.length, 6);
assert.ok(isWolfIrManagedDiagramSlug("wolf-intelligence"));
assert.ok(isWolfIrManagedDiagramSlug("wolf-architecture"));
assert.ok(isWolfIrManagedDiagramSlug("wolf-pailex-infrastructure"));
assert.ok(isWolfIrManagedDiagramSlug("wolf-ai-models"));
assert.ok(isWolfIrManagedDiagramSlug("model-testing-arch"));
assert.ok(isWolfIrManagedDiagramSlug("mission-2-model-testing-arch"));
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

const wolfAiDiagram = createWolfAiModelsDiagram();
assert.equal(wolfAiDiagram.version, 1);
assert.equal(wolfAiDiagram.meta?.seedVersion, WOLF_AI_MODELS_SEED_VERSION);
assert.equal(wolfAiDiagram.meta?.liveRefresh, true);
assert.ok(wolfAiDiagram.nodes.length >= 20);
assert.ok(wolfAiDiagram.edges.length >= 15);
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "ffmpeg"));
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "runpod"));
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "supabase"));
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "unit311-central"));
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "wolf-workspace"));
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "raw-video-archive"));
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "mission-1"));
assert.ok(wolfAiDiagram.nodes.some((node) => node.id === "mission-6"));
const ffmpegNode = wolfAiDiagram.nodes.find((node) => node.id === "ffmpeg");
assert.ok(
  String(ffmpegNode?.data?.description ?? "").includes("does NOT perform telemetry"),
  "FFmpeg must not perform telemetry synchronisation",
);
const supabaseNode = wolfAiDiagram.nodes.find((node) => node.id === "supabase");
assert.ok(
  String(supabaseNode?.data?.description ?? "").includes("references"),
  "Supabase stores references to archived raw video",
);
assert.ok(
  shouldRefreshWolfIrBuiltinDiagram("wolf-ai-models", {
    version: 1,
    meta: { placeholder: true, generator: "wolf-information-repository-placeholder" },
    nodes: [],
    edges: [],
  }),
);
assert.ok(
  !shouldRefreshWolfIrBuiltinDiagram("wolf-ai-models", {
    version: 1,
    meta: { seedVersion: WOLF_AI_MODELS_SEED_VERSION, generator: "wolf-information-repository" },
    nodes: [],
    edges: [],
  }),
);

const wolfIntelligenceDiagram = createWolfIntelligenceDiagram();
assert.equal(wolfIntelligenceDiagram.version, 1);
assert.ok(wolfIntelligenceDiagram.nodes.some((node) => node.id === "wolf-intelligence-core"));
assert.ok(wolfIntelligenceDiagram.nodes.some((node) => node.id === "operator-review"));
assert.ok(wolfIntelligenceDiagram.nodes.some((node) => node.id === "unit311-central"));
assert.ok(wolfIntelligenceDiagram.edges.length >= 8);

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
assert.ok(workspace.includes("WolfMission2ModelTestingArchWorkspace"));
assert.ok(workspace.includes("WOLF_IR_DEFAULT_WOLF_DIAGRAM_SLUG"));
assert.ok(workspace.includes("overflow-x-auto"));
assert.ok(workspace.includes("isModelTestingArchSlug"));
const modelTestingArchRender = workspace.indexOf(
  "wolfNavArea === \"model-testing\"",
);
const errorFallbackRender = workspace.indexOf(") : error ? (");
assert.ok(
  modelTestingArchRender !== -1 && errorFallbackRender !== -1 && modelTestingArchRender < errorFallbackRender,
  "Model testing mission workspace must render before the error fallback branch",
);
assert.ok(workspace.includes("WolfMission2ModelTestingArchWorkspace"));
assert.ok(workspace.includes("WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID"));
assert.ok(workspace.includes("if (scope === \"wolf\" && isModelTestingArchSlug(sectionSlug))"));
assert.ok(workspace.includes("WOLF_MODEL_TESTING_ARCH_AREA_LABEL"));
assert.ok(workspace.includes("WOLF_MODEL_TESTING_MISSIONS"));
assert.ok(workspace.includes("filterWolfGeneralDiagramTabs"));
assert.ok(workspace.includes('aria-label="Model testing missions"'));

const interfaceWorkspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InterfaceWorxInformationRepositoryWorkspace.tsx"),
  "utf8",
);
assert.ok(interfaceWorkspace.includes("WolfInformationRepositoryArchitectureWorkspace"));
assert.ok(interfaceWorkspace.includes("architectureDiagrams"));

console.log("wolf-information-repository-architecture.check.ts — all assertions passed.");
