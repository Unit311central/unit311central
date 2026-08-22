import type { TutorialPresentationTier, TutorialCoveragePriority } from "./priorities";

/** Coverage status for a canonical product function. */
export type TutorialCoverageStatus = "live" | "stub" | "missing" | "shell";

/** Workspace-independent tutorial identity — module + function. */
export type TutorialCanonicalEntry = {
  tutorialId: string;
  moduleSlug: string;
  functionSlug: string;
  moduleLabel: string;
  functionLabel: string;
  sectionLabel: string;
};

/** Runtime screen binding for resolving a canonical tutorial. */
export type TutorialRuntimeBinding = {
  viewId: string;
  tabKey?: string;
  /** `${viewId}:${tabKey ?? ""}` — used by the tutorial resolver. */
  bindingKey: string;
};

/** Workspace packs where this function appears in navigation (availability only). */
export type TutorialWorkspaceAvailability = {
  workspaceSlugs: readonly string[];
};

/** One row in the canonical product/function catalogue. */
export type TutorialCatalogueEntry = {
  canonical: TutorialCanonicalEntry;
  runtime: TutorialRuntimeBinding;
  availability: TutorialWorkspaceAvailability;
  priority: TutorialCoveragePriority;
  presentationTier: TutorialPresentationTier;
  status: TutorialCoverageStatus;
};

/** Raw nav discovery result before canonical labelling. */
export type DiscoveredNavLeaf = {
  viewId: string;
  tabKey?: string;
  workspaceSlugs: readonly string[];
};

export type TutorialRegistryIdentity = {
  tutorialId: string;
  viewId: string;
  tabKey?: string;
  bindingKey: string;
};

export type TutorialCoverageManifest = {
  entries: readonly TutorialCatalogueEntry[];
  stats: {
    /** All canonical product functions (content + shell). */
    totalCanonicalFunctions: number;
    /** Functions with real UI (excludes Finances shell placeholders). */
    contentFunctions: number;
    live: number;
    stub: number;
    missing: number;
    shell: number;
  };
};

export type TutorialCoverageReconciliation = {
  manifest: TutorialCoverageManifest;
  orphanRegistryEntries: readonly TutorialRegistryIdentity[];
  duplicateTutorialIds: readonly {
    tutorialId: string;
    bindingKeys: readonly string[];
  }[];
  duplicateRuntimeBindings: readonly {
    bindingKey: string;
    tutorialIds: readonly string[];
  }[];
  liveTutorials: readonly TutorialRegistryIdentity[];
};
