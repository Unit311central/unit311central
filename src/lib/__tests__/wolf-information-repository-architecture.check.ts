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
  WOLF_AI_MODELS_SEED_VERSION,
  createPailexInfrastructureDiagram,
  createWolfAiModelsDiagram,
  createWolfArchitectureDiagram,
  createWolfIrCustomDiagramSlug,
  isWolfIrCustomDiagramSlug,
  isWolfIrManagedDiagramSlug,
  shouldRefreshWolfIrBuiltinDiagram,
} from "@/lib/wolf/wolf-information-repository-architecture-data";

assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.architectureDiagrams, true);
assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.architectureHub, false);
assert.equal(WOLF_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.recordAttachments, true);

assert.equal(WOLF_IR_UNIT311_CANVAS_SLUGS.length, 4);
assert.equal(WOLF_IR_BUILTIN_DIAGRAM_SLUGS.length, 3);
assert.ok(isWolfIrManagedDiagramSlug("wolf-architecture"));
assert.ok(isWolfIrManagedDiagramSlug("wolf-pailex-infrastructure"));
assert.ok(isWolfIrManagedDiagramSlug("wolf-ai-models"));
assert.ok(!isWolfIrManagedDiagramSlug("platform-overview"));

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

const apiRoute = readFileSync(
  join(process.cwd(), "src/app/api/information-repository/architecture-diagrams/route.ts"),
  "utf8",
);
assert.ok(apiRoute.includes("requireWolfInformationRepositoryArchitectureSession"));
assert.ok(apiRoute.includes('scope === "wolf"'));
assert.ok(apiRoute.includes("DELETE"));

const workspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InterfaceWorxInformationRepositoryWorkspace.tsx"),
  "utf8",
);
assert.ok(workspace.includes("WolfInformationRepositoryArchitectureWorkspace"));
assert.ok(workspace.includes("architectureDiagrams"));

console.log("wolf-information-repository-architecture.check.ts — all assertions passed.");
