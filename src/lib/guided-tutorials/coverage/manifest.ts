import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";

import {
  COVERAGE_WORKSPACE_SLUGS,
  extractAllCoverageNavLeaves,
  tutorialIdentityKey,
} from "./nav-leaves";
import {
  isShellCoverageView,
  resolveCoveragePriority,
  resolvePresentationTier,
} from "./priorities";
import type {
  TutorialCoverageEntry,
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
    identityKey: tutorialIdentityKey(tutorial.viewId, tutorial.tabKey),
  }));
}

function findDuplicateRegistryIdentities(
  registered: readonly TutorialRegistryIdentity[],
): TutorialCoverageReconciliation["duplicateRegistryIdentities"] {
  const byKey = new Map<string, string[]>();
  for (const entry of registered) {
    const list = byKey.get(entry.identityKey) ?? [];
    list.push(entry.tutorialId);
    byKey.set(entry.identityKey, list);
  }
  return [...byKey.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([identityKey, tutorialIds]) => ({ identityKey, tutorialIds }));
}

function resolveEntryStatus(
  identityKey: string,
  viewId: string,
  registryByKey: ReadonlyMap<string, TutorialRegistryIdentity>,
): { status: TutorialCoverageStatus; tutorialId?: string } {
  if (isShellCoverageView(viewId)) {
    return { status: "shell" };
  }

  const registered = registryByKey.get(identityKey);
  if (registered) {
    return { status: "live", tutorialId: registered.tutorialId };
  }

  return { status: "missing" };
}

export function buildTutorialCoverageManifest(): TutorialCoverageManifest {
  const leaves = extractAllCoverageNavLeaves();
  const registryByKey = new Map(
    registryIdentities().map((entry) => [entry.identityKey, entry]),
  );

  const entries: TutorialCoverageEntry[] = leaves.map((leaf) => {
    const identityKey = tutorialIdentityKey(leaf.viewId, leaf.tabKey);
    const { status, tutorialId } = resolveEntryStatus(
      identityKey,
      leaf.viewId,
      registryByKey,
    );
    const priority = resolveCoveragePriority({
      moduleLabel: leaf.moduleLabel,
      viewId: leaf.viewId,
      functionLabel: leaf.functionLabel,
      tabKey: leaf.tabKey,
    });
    const presentationTier = resolvePresentationTier({
      viewId: leaf.viewId,
      tabKey: leaf.tabKey,
      functionLabel: leaf.functionLabel,
      status,
    });

    return {
      ...leaf,
      identityKey,
      priority,
      presentationTier,
      status,
      tutorialId,
    };
  });

  const stats = {
    total: entries.length,
    live: entries.filter((entry) => entry.status === "live").length,
    stub: entries.filter((entry) => entry.status === "stub").length,
    missing: entries.filter((entry) => entry.status === "missing").length,
    shell: entries.filter((entry) => entry.status === "shell").length,
  };

  return {
    entries,
    workspaceSlugs: COVERAGE_WORKSPACE_SLUGS,
    stats,
  };
}

export function reconcileTutorialCoverage(): TutorialCoverageReconciliation {
  const manifest = buildTutorialCoverageManifest();
  const registered = registryIdentities();
  const manifestKeys = new Set(manifest.entries.map((entry) => entry.identityKey));

  const orphanRegistryEntries = registered.filter(
    (entry) => !manifestKeys.has(entry.identityKey),
  );

  const liveTutorials = registered.filter((entry) => manifestKeys.has(entry.identityKey));

  return {
    manifest,
    orphanRegistryEntries,
    duplicateRegistryIdentities: findDuplicateRegistryIdentities(registered),
    liveTutorials,
  };
}

export function findCoverageEntry(
  manifest: TutorialCoverageManifest,
  viewId: string,
  tabKey?: string,
): TutorialCoverageEntry | undefined {
  const key = tutorialIdentityKey(viewId, tabKey);
  return manifest.entries.find((entry) => entry.identityKey === key);
}

export function formatTutorialCoverageSummary(
  reconciliation: TutorialCoverageReconciliation,
): string {
  const { manifest, orphanRegistryEntries, duplicateRegistryIdentities, liveTutorials } =
    reconciliation;
  const lines = [
    "Tutorial Coverage Manifest",
    "==========================",
    `Workspace packs: ${manifest.workspaceSlugs.join(", ")}`,
    `Nav-derived screens: ${manifest.stats.total}`,
    `  live: ${manifest.stats.live}`,
    `  missing: ${manifest.stats.missing}`,
    `  shell: ${manifest.stats.shell}`,
    `  stub: ${manifest.stats.stub}`,
    "",
    "Live tutorials:",
  ];

  for (const tutorial of liveTutorials) {
    const entry = findCoverageEntry(manifest, tutorial.viewId, tutorial.tabKey);
    const path = entry
      ? `${entry.moduleLabel} → ${entry.functionLabel}`
      : tutorial.identityKey;
    lines.push(`  - ${tutorial.tutorialId} (${path})`);
  }

  if (orphanRegistryEntries.length > 0) {
    lines.push("", `Orphan registry entries: ${orphanRegistryEntries.length}`);
    for (const orphan of orphanRegistryEntries) {
      lines.push(`  - ${orphan.tutorialId} (${orphan.identityKey})`);
    }
  }

  if (duplicateRegistryIdentities.length > 0) {
    lines.push("", `Duplicate registry identities: ${duplicateRegistryIdentities.length}`);
    for (const dup of duplicateRegistryIdentities) {
      lines.push(`  - ${dup.identityKey}: ${dup.tutorialIds.join(", ")}`);
    }
  }

  return lines.join("\n");
}
