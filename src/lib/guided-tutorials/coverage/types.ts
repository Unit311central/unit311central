import type { TutorialPresentationTier, TutorialCoveragePriority } from "./priorities";

/** Coverage status for a navigable screen identity. */
export type TutorialCoverageStatus = "live" | "stub" | "missing" | "shell";

/** Nav-derived screen identity — viewId plus optional tab/filter/section key. */
export type TutorialNavLeaf = {
  viewId: string;
  tabKey?: string;
  moduleLabel: string;
  sectionLabel: string;
  functionLabel: string;
  /** Workspace packs where this leaf appears in LHS navigation. */
  workspaceSlugs: readonly string[];
};

export type TutorialCoverageEntry = TutorialNavLeaf & {
  /** Stable key: `${viewId}:${tabKey ?? ""}` */
  identityKey: string;
  priority: TutorialCoveragePriority;
  presentationTier: TutorialPresentationTier;
  status: TutorialCoverageStatus;
  /** Set when status is live or stub. */
  tutorialId?: string;
};

export type TutorialRegistryIdentity = {
  tutorialId: string;
  viewId: string;
  tabKey?: string;
  identityKey: string;
};

export type TutorialCoverageManifest = {
  entries: readonly TutorialCoverageEntry[];
  workspaceSlugs: readonly string[];
  stats: {
    total: number;
    live: number;
    stub: number;
    missing: number;
    shell: number;
  };
};

export type TutorialCoverageReconciliation = {
  manifest: TutorialCoverageManifest;
  /** Registry tutorials with no matching nav leaf on any covered workspace. */
  orphanRegistryEntries: readonly TutorialRegistryIdentity[];
  /** Multiple registry entries sharing the same viewId + tabKey. */
  duplicateRegistryIdentities: readonly {
    identityKey: string;
    tutorialIds: readonly string[];
  }[];
  /** Live tutorials reconciled from the registry. */
  liveTutorials: readonly TutorialRegistryIdentity[];
};
