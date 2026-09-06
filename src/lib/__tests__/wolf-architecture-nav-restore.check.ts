/**
 * Regression check: WOLF architecture tabs must always include the full catalogue
 * even when the API catalog response is empty (PR #55 regression).
 *
 * Run: npx tsx src/lib/__tests__/wolf-architecture-nav-restore.check.ts
 */
import assert from "node:assert/strict";

import { WOLF_IR_WOLF_CATALOG } from "@/lib/wolf/wolf-information-repository-architecture-data";
import {
  filterWolfPrimaryDiagramTabs,
  filterWolfSecondaryDiagramTabs,
  isWolfModelTestingMissionSlug,
  resolveWolfDiagramNavLabel,
} from "@/lib/wolf/wolf-model-testing-nav";
import { isWolfIrManagedDiagramSlug } from "@/lib/wolf/wolf-information-repository-architecture-data";

function buildWolfTabsLikeWorkspace(input: {
  diagramCatalog: Array<{ sectionSlug: string; title: string; navOrder?: number }>;
  existingDiagrams: Array<{ sectionSlug: string; title: string }>;
}) {
  const { diagramCatalog, existingDiagrams } = input;
  const diagramBySlug = new Map(existingDiagrams.map((item) => [item.sectionSlug, item]));
  const catalogBySlug = new Map(
    [...WOLF_IR_WOLF_CATALOG, ...diagramCatalog].map((entry) => [entry.sectionSlug, entry]),
  );

  const slugSet = new Set<string>([
    ...WOLF_IR_WOLF_CATALOG.map((entry) => entry.sectionSlug),
    ...diagramCatalog.map((entry) => entry.sectionSlug),
    ...existingDiagrams.map((item) => item.sectionSlug),
  ]);

  return [...slugSet]
    .filter((slug) => isWolfIrManagedDiagramSlug(slug))
    .map((slug) => {
      const catalog = catalogBySlug.get(slug);
      const diagram = diagramBySlug.get(slug);
      const fallbackTitle = diagram?.title ?? catalog?.title ?? slug;
      return {
        slug,
        title: resolveWolfDiagramNavLabel(slug, fallbackTitle),
        navOrder: catalog?.navOrder ?? 9999,
      };
    })
    .sort((a, b) => {
      if (a.navOrder !== b.navOrder) return a.navOrder - b.navOrder;
      return a.title.localeCompare(b.title);
    });
}

// Simulate PR #55 regression: API returns only mission slugs, empty catalog
const regressionTabs = buildWolfTabsLikeWorkspace({
  diagramCatalog: [],
  existingDiagrams: [
    { sectionSlug: "model-testing-arch", title: "MODEL TESTING ARCH" },
    { sectionSlug: "mission-2-model-testing-arch", title: "MISSION 2 MODEL TESTING ARCH" },
  ],
});

const primary = filterWolfPrimaryDiagramTabs(regressionTabs);
const secondary = filterWolfSecondaryDiagramTabs(regressionTabs);

assert.equal(
  primary.map((tab) => tab.slug).join(","),
  "wolf-ai-models,wolf-intelligence",
  "Primary WOLF architecture tabs must always be present",
);
assert.equal(primary[0]?.title, "WOLF AI Architecture");
assert.equal(primary[1]?.title, "WOLF Intelligence");

assert.ok(secondary.some((tab) => tab.slug === "wolf-architecture"));
assert.ok(secondary.some((tab) => tab.slug === "wolf-pailex-infrastructure"));

assert.ok(isWolfModelTestingMissionSlug("model-testing-arch"));
assert.ok(regressionTabs.some((tab) => tab.slug === "model-testing-arch"));

console.log("wolf-architecture-nav-restore.check.ts — all assertions passed.");
