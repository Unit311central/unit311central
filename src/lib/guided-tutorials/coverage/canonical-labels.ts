import {
  internalSurveyNavSections,
  type InternalNavChildItem,
  type InternalNavItem,
} from "@/lib/internal-operations-data";

import { runtimeBindingKey, tabKeyFromNavQuery } from "./nav-leaves";

type CanonicalLabels = {
  moduleLabel: string;
  sectionLabel: string;
  functionLabel: string;
};

function walkCanonicalLabelIndex(
  items: readonly InternalNavItem[],
  moduleLabel: string,
  sectionTrail: string[],
  acc: Map<string, CanonicalLabels>,
): void {
  for (const item of items) {
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
      sectionLabel: sectionTrail.length ? sectionTrail[sectionTrail.length - 1]! : moduleLabel,
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
    const moduleLabel =
      section.label ??
      (section.items.some((item) => item.view === "home") ? "Home" : "Pins");
    walkCanonicalLabelIndex(section.items, moduleLabel === "Pins" ? "Home" : moduleLabel, [], acc);
  }
  canonicalLabelIndex = acc;
  return acc;
}

export function resetCanonicalLabelIndexForTests(): void {
  canonicalLabelIndex = null;
}
