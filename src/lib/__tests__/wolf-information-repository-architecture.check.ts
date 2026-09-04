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
  createPailexInfrastructureDiagram,
  createWolfArchitectureDiagram,
  createWolfIrCustomDiagramSlug,
  isWolfIrCustomDiagramSlug,
  isWolfIrManagedDiagramSlug,
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
