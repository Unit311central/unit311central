/**
 * Architecture diagram layout overlay persistence regression checks.
 *
 * Run: npx tsx src/lib/__tests__/architecture-diagram-layout.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  applyLayoutOverlay,
  architectureDiagramLayoutStorageKey,
  clearArchitectureDiagramLayoutOverlay,
  extractLayoutOverlay,
  loadArchitectureDiagramLayoutOverlay,
  saveArchitectureDiagramLayoutOverlay,
} from "@/lib/architecture-diagram-layout";
import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";

const canonical: ArchitectureDiagramDocument = {
  version: 1,
  viewport: { x: 0, y: 0, zoom: 1 },
  nodes: [
    {
      id: "a",
      position: { x: 10, y: 20 },
      data: { label: "Node A", nodeKind: "service", collapsed: false },
    },
    {
      id: "b",
      position: { x: 100, y: 200 },
      data: { label: "Node B", nodeKind: "database", collapsed: true },
    },
  ],
  edges: [{ id: "a-b", source: "a", target: "b" }],
  meta: { generator: "test" },
};

assert.equal(applyLayoutOverlay(canonical, null).nodes[0]?.position.x, 10);

const overlay = extractLayoutOverlay(canonical);
overlay.nodes = overlay.nodes.map((node) =>
  node.id === "a" ? { ...node, position: { x: 500, y: 600 } } : node,
);
overlay.viewport = { x: 12, y: 34, zoom: 1.4 };

const merged = applyLayoutOverlay(canonical, overlay);
assert.equal(merged.nodes[0]?.position.x, 500);
assert.equal(merged.nodes[0]?.position.y, 600);
assert.equal(merged.nodes[1]?.position.x, 100);
assert.equal(merged.viewport?.zoom, 1.4);
assert.equal(merged.meta?.generator, "test");
assert.equal(canonical.nodes[0]?.position.x, 10, "canonical must remain unchanged");

const storageKey = architectureDiagramLayoutStorageKey("user-1", "model-testing-arch");
assert.match(storageKey, /model-testing-arch/);

if (typeof globalThis.localStorage !== "undefined") {
  saveArchitectureDiagramLayoutOverlay("user-1", "model-testing-arch", overlay);
  const loaded = loadArchitectureDiagramLayoutOverlay("user-1", "model-testing-arch");
  assert.equal(loaded?.nodes[0]?.position?.x, 500);
  clearArchitectureDiagramLayoutOverlay("user-1", "model-testing-arch");
  assert.equal(loadArchitectureDiagramLayoutOverlay("user-1", "model-testing-arch"), null);
}

const viewer = readFileSync(
  join(process.cwd(), "src/components/architecture/ArchitectureViewer.tsx"),
  "utf8",
);
assert.ok(viewer.includes("layoutOverlayMode"));
assert.ok(viewer.includes("onLayoutOverlayChange"));
assert.ok(viewer.includes("Reset layout"));

console.log("architecture-diagram-layout.check.ts — all assertions passed.");
