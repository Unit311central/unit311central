/**
 * Shared, client-safe types for the living Architecture hierarchy views
 * (Core Product, Custom Product, Workspace Architecture).
 *
 * The typed hierarchy is derived server-side (see architecture-taxonomy.ts) from
 * existing sources and delivered as plain JSON to the tree renderer. No new
 * database table is introduced.
 */

import { buildWorkspaceArchitectureFilterOptions } from "@/lib/platform-workspaces/unit311-workspace-universe";

/** Structural depth of a taxonomy node. */
export type ArchitectureTaxonomyLevel =
  | "root"
  | "group"
  | "workspace"
  | "module"
  | "feature"
  | "sub-feature";

/** Product classification. `structural` is used for container/scaffold nodes. */
export type ArchitectureTaxonomyKind = "core" | "custom" | "structural";

export type ArchitectureTaxonomyNode = {
  id: string;
  label: string;
  level: ArchitectureTaxonomyLevel;
  kind: ArchitectureTaxonomyKind;
  /** Short annotation (e.g. "Taxonomy not yet audited", terminology notes). */
  note?: string;
  /** For modules: whether the feature/sub-feature taxonomy is formally audited. */
  audited?: boolean;
  children?: ArchitectureTaxonomyNode[];
};

/** Renderer selection for an Architecture Diagrams catalogue entry. */
export type ArchitectureRenderer = "canvas" | "tree";

/** Workspaces shown in the Workspace Architecture view — full Unit311 universe. */
export const WORKSPACE_ARCHITECTURE_OPTIONS = buildWorkspaceArchitectureFilterOptions();

export type WorkspaceArchitectureOptionId = string;

/** Section slugs for the three tree views. */
export const ARCHITECTURE_TREE_SLUGS = {
  coreProduct: "core-product",
  customProduct: "custom-product",
  workspaceArchitecture: "workspace-architecture",
} as const;

export type ArchitectureTreeSlug =
  (typeof ARCHITECTURE_TREE_SLUGS)[keyof typeof ARCHITECTURE_TREE_SLUGS];

export function isArchitectureTreeSlug(value: string | null | undefined): value is ArchitectureTreeSlug {
  return (
    value === ARCHITECTURE_TREE_SLUGS.coreProduct ||
    value === ARCHITECTURE_TREE_SLUGS.customProduct ||
    value === ARCHITECTURE_TREE_SLUGS.workspaceArchitecture
  );
}
