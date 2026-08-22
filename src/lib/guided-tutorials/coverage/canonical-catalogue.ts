import {
  internalViewTitles,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";

import { getCanonicalLabelIndex } from "./canonical-labels";
import { resolveCanonicalProductMapping } from "./canonical-mappings";
import { extractAllDiscoveredNavLeaves, runtimeBindingKey } from "./nav-leaves";
import type {
  DiscoveredNavLeaf,
  TutorialCanonicalEntry,
  TutorialCatalogueEntry,
  TutorialRuntimeBinding,
} from "./types";

export { getCanonicalLabelIndex, resetCanonicalLabelIndexForTests } from "./canonical-labels";
export { deriveTutorialId, resolveCanonicalProductMapping } from "./canonical-mappings";
export type { CanonicalProductMapping } from "./canonical-mappings";
export type { TutorialMappingConfidence } from "./types";

type CanonicalLabels = {
  moduleLabel: string;
  sectionLabel: string;
  functionLabel: string;
};

function resolveCanonicalLabels(leaf: DiscoveredNavLeaf): CanonicalLabels {
  const fromBase = getCanonicalLabelIndex().get(runtimeBindingKey(leaf.viewId, leaf.tabKey));
  if (fromBase) return fromBase;

  const titles = internalViewTitles[leaf.viewId as InternalOperationsView];
  if (titles) {
    return {
      moduleLabel: titles.subtitle || titles.title,
      sectionLabel: titles.subtitle || titles.title,
      functionLabel: titles.title,
    };
  }

  return {
    moduleLabel: leaf.viewId,
    sectionLabel: leaf.viewId,
    functionLabel: leaf.tabKey ?? leaf.viewId,
  };
}

function mappingToCanonicalEntry(
  mapping: ReturnType<typeof resolveCanonicalProductMapping>,
): TutorialCanonicalEntry {
  return {
    tutorialId: mapping.tutorialId,
    moduleSlug: mapping.moduleSlug,
    functionSlug: mapping.functionSlug,
    moduleLabel: mapping.moduleLabel,
    functionLabel: mapping.functionLabel,
    sectionLabel: mapping.sectionLabel,
  };
}

export function buildCanonicalEntry(
  leaf: DiscoveredNavLeaf,
  labels: CanonicalLabels,
): TutorialCanonicalEntry {
  const mapping = resolveCanonicalProductMapping(leaf, labels, {
    inBaseNav: getCanonicalLabelIndex().has(runtimeBindingKey(leaf.viewId, leaf.tabKey)),
  });
  return mappingToCanonicalEntry(mapping);
}

export function buildRuntimeBinding(leaf: DiscoveredNavLeaf): TutorialRuntimeBinding {
  return {
    viewId: leaf.viewId,
    tabKey: leaf.tabKey,
    bindingKey: runtimeBindingKey(leaf.viewId, leaf.tabKey),
  };
}

export function buildCanonicalCatalogueFromDiscovery(
  discovered: readonly DiscoveredNavLeaf[],
): TutorialCatalogueEntry[] {
  return discovered.map((leaf) => {
    const labels = resolveCanonicalLabels(leaf);
    const mapping = resolveCanonicalProductMapping(leaf, labels, {
      inBaseNav: getCanonicalLabelIndex().has(runtimeBindingKey(leaf.viewId, leaf.tabKey)),
    });
    return {
      canonical: mappingToCanonicalEntry(mapping),
      runtime: buildRuntimeBinding(leaf),
      availability: { workspaceSlugs: leaf.workspaceSlugs },
      mappingConfidence: mapping.mappingConfidence,
      priority: "P2" as const,
      presentationTier: "B" as const,
      status: "missing" as const,
    };
  });
}

export function buildCanonicalCatalogue(): TutorialCatalogueEntry[] {
  return buildCanonicalCatalogueFromDiscovery(extractAllDiscoveredNavLeaves());
}

export function findCatalogueEntryByTutorialId(
  entries: readonly TutorialCatalogueEntry[],
  tutorialId: string,
): TutorialCatalogueEntry | undefined {
  return entries.find((entry) => entry.canonical.tutorialId === tutorialId);
}

export function findCatalogueEntryByBinding(
  entries: readonly TutorialCatalogueEntry[],
  viewId: string,
  tabKey?: string,
): TutorialCatalogueEntry | undefined {
  const key = runtimeBindingKey(viewId, tabKey);
  return entries.find((entry) => entry.runtime.bindingKey === key);
}
