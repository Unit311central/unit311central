import { FINANCES_MODULE_LABEL } from "@/lib/finances-nav";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import {
  internalSurveyNavSections,
  internalViewTitles,
  type InternalNavChildItem,
  type InternalNavItem,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";

import { extractAllDiscoveredNavLeaves, runtimeBindingKey, tabKeyFromNavQuery } from "./nav-leaves";
import type {
  DiscoveredNavLeaf,
  TutorialCanonicalEntry,
  TutorialCatalogueEntry,
  TutorialRuntimeBinding,
} from "./types";

/** Stable module slug from canonical product labels (not workspace renames). */
const MODULE_SLUG_BY_LABEL: Readonly<Record<string, string>> = {
  Pins: "pins",
  HOME: "pins",
  "EXECUTIVE ASSISTANT": "pins",
  "Business Central": "business-central",
  [SALES_MANAGEMENT_MODULE_LABEL]: "sales-management",
  [FINANCES_MODULE_LABEL]: "finances",
  "Human Resources": "human-resources",
  "Corporate Information": "corporate-information",
  "Technology Management": "technology-management",
  "Business Productivity": "business-productivity",
  "Support Desk": "support-desk",
  Operations: "operations",
  Training: "training",
  QMS: "qms",
  Tools: "tools",
  "External Client Access": "external-client-access",
  Settings: "settings",
  Board: "board",
  Fundraising: "fundraising",
  Engineering: "engineering",
  "OnwardAir Intelligence": "onwardair-intelligence",
  "Marketing & Events": "marketing-events",
  "Project Management": "project-management",
  "IP & Patents": "ip-patents",
  "ABHI Intelligence": "abhi-intelligence",
  "Talanton Intelligence": "talanton-intelligence",
  Funds: "funds",
  "Portfolio Companies": "portfolio-companies",
  "Marketing & Stories": "marketing-stories",
  "Unit311 Details": "unit311-details",
};

type CanonicalLabels = {
  moduleLabel: string;
  sectionLabel: string;
  functionLabel: string;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function walkCanonicalLabelIndex(
  items: readonly InternalNavItem[],
  moduleLabel: string,
  sectionTrail: string[],
  acc: Map<string, CanonicalLabels>,
): void {
  for (const item of items) {
    const sectionLabel = sectionTrail.length ? sectionTrail[sectionTrail.length - 1]! : moduleLabel;
    if (item.children?.length) {
      for (const child of item.children) {
        collectCanonicalChildLabels(child, moduleLabel, [...sectionTrail, item.label], acc);
      }
      continue;
    }
    if (!item.view) continue;
    const tabKey = tabKeyFromNavQuery(item.query);
    acc.set(runtimeBindingKey(item.view, tabKey), {
      moduleLabel,
      sectionLabel,
      functionLabel: item.label,
    });
  }
}

function collectCanonicalChildLabels(
  child: InternalNavChildItem,
  moduleLabel: string,
  sectionTrail: string[],
  acc: Map<string, CanonicalLabels>,
): void {
  if (child.children?.length) {
    for (const nested of child.children) {
      collectCanonicalChildLabels(nested, moduleLabel, [...sectionTrail, child.label], acc);
    }
    return;
  }
  if (!child.view) return;
  const tabKey = tabKeyFromNavQuery(child.query);
  const sectionLabel = sectionTrail.length ? sectionTrail[sectionTrail.length - 1]! : moduleLabel;
  acc.set(runtimeBindingKey(child.view, tabKey), {
    moduleLabel,
    sectionLabel,
    functionLabel: child.label,
  });
}

let canonicalLabelIndex: Map<string, CanonicalLabels> | null = null;

/** Labels from base platform nav — stable across workspace renames (e.g. ABHI Members). */
export function getCanonicalLabelIndex(): ReadonlyMap<string, CanonicalLabels> {
  if (canonicalLabelIndex) return canonicalLabelIndex;

  const acc = new Map<string, CanonicalLabels>();
  for (const section of internalSurveyNavSections) {
    const moduleLabel = section.label ?? "Pins";
    walkCanonicalLabelIndex(section.items, moduleLabel, [], acc);
  }
  canonicalLabelIndex = acc;
  return acc;
}

export function resetCanonicalLabelIndexForTests(): void {
  canonicalLabelIndex = null;
}

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

export function moduleSlugFromLabel(moduleLabel: string): string {
  return MODULE_SLUG_BY_LABEL[moduleLabel] ?? slugify(moduleLabel);
}

export function functionSlugFromLabels(functionLabel: string, tabKey?: string): string {
  if (tabKey) return slugify(tabKey);
  return slugify(functionLabel);
}

/** Derive workspace-independent tutorialId aligned with the live registry pattern. */
export function deriveTutorialId(input: {
  viewId: string;
  tabKey?: string;
  functionLabel: string;
}): string {
  const bindingKey = runtimeBindingKey(input.viewId, input.tabKey);
  const registered = listTutorialDefinitions().find(
    (tutorial) => runtimeBindingKey(tutorial.viewId, tutorial.tabKey) === bindingKey,
  );
  if (registered) return registered.tutorialId;

  if (input.viewId === "home") return "home";
  if (input.viewId === "executive-assistant") return "executive-assistant";
  if (input.tabKey) return `${input.viewId}.${input.tabKey}`;
  if (slugify(input.functionLabel) === "dashboard") return `${input.viewId}.dashboard`;
  return input.viewId;
}

export function buildCanonicalEntry(
  leaf: DiscoveredNavLeaf,
  labels: CanonicalLabels,
): TutorialCanonicalEntry {
  const moduleSlug = moduleSlugFromLabel(labels.moduleLabel);
  const functionSlug = functionSlugFromLabels(labels.functionLabel, leaf.tabKey);
  const tutorialId = deriveTutorialId({
    viewId: leaf.viewId,
    tabKey: leaf.tabKey,
    functionLabel: labels.functionLabel,
  });

  return {
    tutorialId,
    moduleSlug,
    functionSlug,
    moduleLabel: labels.moduleLabel,
    functionLabel: labels.functionLabel,
    sectionLabel: labels.sectionLabel,
  };
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
    const canonical = buildCanonicalEntry(leaf, labels);
    const runtime = buildRuntimeBinding(leaf);
    return {
      canonical,
      runtime,
      availability: { workspaceSlugs: leaf.workspaceSlugs },
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
