import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";

import { buildCanonicalCatalogue, findCatalogueEntryByBinding } from "./canonical-catalogue";
import { runtimeBindingKey } from "./nav-leaves";
import {
  isShellCoverageView,
  resolveCoveragePriority,
  resolvePresentationTier,
} from "./priorities";
import type {
  TutorialCatalogueEntry,
  TutorialCoverageManifest,
  TutorialCoverageReconciliation,
  TutorialCoverageStatus,
  TutorialRegistryIdentity,
} from "./types";

function registryIdentities(): TutorialRegistryIdentity[] {
  return listTutorialDefinitions().map((tutorial) => ({
    tutorialId: tutorial.tutorialId,
    viewId: tutorial.viewId,
    tabKey: tutorial.tabKey,
    bindingKey: runtimeBindingKey(tutorial.viewId, tutorial.tabKey),
  }));
}

function resolveEntryStatus(
  bindingKey: string,
  viewId: string,
  registryByBinding: ReadonlyMap<string, TutorialRegistryIdentity>,
): { status: TutorialCoverageStatus; tutorialId?: string } {
  if (isShellCoverageView(viewId)) {
    return { status: "shell" };
  }

  const registered = registryByBinding.get(bindingKey);
  if (registered) {
    return { status: "live", tutorialId: registered.tutorialId };
  }

  return { status: "missing" };
}

function enrichCatalogueEntries(entries: TutorialCatalogueEntry[]): TutorialCatalogueEntry[] {
  const registryByBinding = new Map(
    registryIdentities().map((entry) => [entry.bindingKey, entry]),
  );

  return entries.map((entry) => {
    const { status, tutorialId } = resolveEntryStatus(
      entry.runtime.bindingKey,
      entry.runtime.viewId,
      registryByBinding,
    );
    const priority = resolveCoveragePriority({ moduleSlug: entry.canonical.moduleSlug });
    const presentationTier = resolvePresentationTier({
      tutorialId: tutorialId ?? entry.canonical.tutorialId,
      functionSlug: entry.canonical.functionSlug,
      status,
    });

    return {
      ...entry,
      canonical: {
        ...entry.canonical,
        tutorialId: tutorialId ?? entry.canonical.tutorialId,
      },
      priority,
      presentationTier,
      status,
    };
  });
}

function findSharedTutorialIds(
  entries: readonly TutorialCatalogueEntry[],
): TutorialCoverageReconciliation["sharedTutorialIds"] {
  const byTutorialId = new Map<string, string[]>();
  for (const entry of entries) {
    const list = byTutorialId.get(entry.canonical.tutorialId) ?? [];
    list.push(entry.runtime.bindingKey);
    byTutorialId.set(entry.canonical.tutorialId, list);
  }
  return [...byTutorialId.entries()]
    .filter(([, bindings]) => bindings.length > 1)
    .map(([tutorialId, bindingKeys]) => ({ tutorialId, bindingKeys }));
}

function findDuplicateRuntimeBindings(
  entries: readonly TutorialCatalogueEntry[],
): TutorialCoverageReconciliation["duplicateRuntimeBindings"] {
  const byBinding = new Map<string, string[]>();
  for (const entry of entries) {
    const list = byBinding.get(entry.runtime.bindingKey) ?? [];
    list.push(entry.canonical.tutorialId);
    byBinding.set(entry.runtime.bindingKey, list);
  }
  return [...byBinding.entries()]
    .filter(([, tutorialIds]) => tutorialIds.length > 1)
    .map(([bindingKey, tutorialIds]) => ({ bindingKey, tutorialIds }));
}

function findDuplicateRegistryTutorialIds(
  registered: readonly TutorialRegistryIdentity[],
): TutorialCoverageReconciliation["duplicateTutorialIds"] {
  const byId = new Map<string, string[]>();
  for (const entry of registered) {
    const list = byId.get(entry.tutorialId) ?? [];
    list.push(entry.bindingKey);
    byId.set(entry.tutorialId, list);
  }
  return [...byId.entries()]
    .filter(([, bindings]) => bindings.length > 1)
    .map(([tutorialId, bindingKeys]) => ({ tutorialId, bindingKeys }));
}

export function buildTutorialCoverageManifest(): TutorialCoverageManifest {
  const entries = enrichCatalogueEntries(buildCanonicalCatalogue());
  const shell = entries.filter((entry) => entry.status === "shell").length;
  const contentFunctions = entries.length - shell;

  return {
    entries,
    stats: {
      totalCanonicalFunctions: entries.length,
      contentFunctions,
      uniqueTutorialIds: new Set(entries.map((entry) => entry.canonical.tutorialId)).size,
      live: entries.filter((entry) => entry.status === "live").length,
      stub: entries.filter((entry) => entry.status === "stub").length,
      missing: entries.filter((entry) => entry.status === "missing").length,
      shell,
      confirmed: entries.filter((entry) => entry.mappingConfidence === "confirmed").length,
      derived: entries.filter((entry) => entry.mappingConfidence === "derived").length,
      needsMapping: entries.filter((entry) => entry.mappingConfidence === "needs_mapping").length,
    },
  };
}

export function reconcileTutorialCoverage(): TutorialCoverageReconciliation {
  const manifest = buildTutorialCoverageManifest();
  const registered = registryIdentities();
  const catalogueTutorialIds = new Set(
    manifest.entries.map((entry) => entry.canonical.tutorialId),
  );
  const catalogueBindings = new Set(manifest.entries.map((entry) => entry.runtime.bindingKey));

  const orphanRegistryEntries = registered.filter(
    (entry) => !catalogueBindings.has(entry.bindingKey),
  );

  const liveTutorials = registered.filter((entry) => catalogueBindings.has(entry.bindingKey));

  const duplicateTutorialIds = findDuplicateRegistryTutorialIds(registered);
  const sharedTutorialIds = findSharedTutorialIds(manifest.entries);
  const duplicateRuntimeBindings = findDuplicateRuntimeBindings(manifest.entries);

  return {
    manifest,
    orphanRegistryEntries,
    duplicateTutorialIds,
    sharedTutorialIds,
    duplicateRuntimeBindings,
    liveTutorials,
  };
}

export function findCatalogueEntry(
  manifest: TutorialCoverageManifest,
  viewId: string,
  tabKey?: string,
): TutorialCatalogueEntry | undefined {
  return findCatalogueEntryByBinding(manifest.entries, viewId, tabKey);
}

export function formatTutorialCoverageSummary(
  reconciliation: TutorialCoverageReconciliation,
): string {
  const { manifest, orphanRegistryEntries, duplicateTutorialIds, sharedTutorialIds, duplicateRuntimeBindings, liveTutorials } =
    reconciliation;
  const lines = [
    "Canonical Tutorial Catalogue",
    "============================",
    `Canonical runtime bindings: ${manifest.stats.totalCanonicalFunctions} (+ ${manifest.stats.shell} shell placeholders)`,
    `Unique product tutorial IDs: ${manifest.stats.uniqueTutorialIds}`,
    `  live: ${manifest.stats.live}`,
    `  missing: ${manifest.stats.missing}`,
    `  shell: ${manifest.stats.shell}`,
    `  stub: ${manifest.stats.stub}`,
    `  mapping confirmed: ${manifest.stats.confirmed}`,
    `  mapping derived: ${manifest.stats.derived}`,
    `  needs mapping: ${manifest.stats.needsMapping}`,
    "",
    "Live tutorials:",
  ];

  for (const tutorial of liveTutorials) {
    const entry = findCatalogueEntry(manifest, tutorial.viewId, tutorial.tabKey);
    const path = entry
      ? `${entry.canonical.moduleLabel} → ${entry.canonical.functionLabel}`
      : tutorial.bindingKey;
    lines.push(`  - ${tutorial.tutorialId} (${path})`);
  }

  if (orphanRegistryEntries.length > 0) {
    lines.push("", `Orphan registry entries: ${orphanRegistryEntries.length}`);
    for (const orphan of orphanRegistryEntries) {
      lines.push(`  - ${orphan.tutorialId} (${orphan.bindingKey})`);
    }
  }

  if (sharedTutorialIds.length > 0) {
    lines.push("", `Shared tutorial IDs (multi-binding): ${sharedTutorialIds.length}`);
    for (const shared of sharedTutorialIds) {
      lines.push(`  - ${shared.tutorialId}: ${shared.bindingKeys.join(", ")}`);
    }
  }

  if (duplicateTutorialIds.length > 0) {
    lines.push("", `Duplicate tutorial IDs: ${duplicateTutorialIds.length}`);
    for (const dup of duplicateTutorialIds) {
      lines.push(`  - ${dup.tutorialId}: ${dup.bindingKeys.join(", ")}`);
    }
  }

  if (duplicateRuntimeBindings.length > 0) {
    lines.push("", `Duplicate runtime bindings: ${duplicateRuntimeBindings.length}`);
    for (const dup of duplicateRuntimeBindings) {
      lines.push(`  - ${dup.bindingKey}: ${dup.tutorialIds.join(", ")}`);
    }
  }

  return lines.join("\n");
}

export function formatCanonicalCatalogueTable(
  manifest: TutorialCoverageManifest,
): string {
  const header = [
    "tutorialId",
    "module",
    "function",
    "viewId",
    "tabKey",
    "workspaces",
    "status",
    "mappingConfidence",
  ].join("\t");

  const rows = manifest.entries.map((entry) =>
    [
      entry.canonical.tutorialId,
      entry.canonical.moduleSlug,
      entry.canonical.functionSlug,
      entry.runtime.viewId,
      entry.runtime.tabKey ?? "",
      entry.availability.workspaceSlugs.join(","),
      entry.status,
      entry.mappingConfidence,
    ].join("\t"),
  );

  return [header, ...rows].join("\n");
}

export function listNeedsMappingEntries(
  manifest: TutorialCoverageManifest,
): readonly TutorialCatalogueEntry[] {
  return manifest.entries.filter((entry) => entry.mappingConfidence === "needs_mapping");
}
