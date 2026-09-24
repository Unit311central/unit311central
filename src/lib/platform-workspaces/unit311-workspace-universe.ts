/**
 * Authoritative Unit311 workspace universe for Living Architecture and host routing docs.
 *
 * This is the known product/deployment catalogue — NOT the current user's access,
 * active workspace, enabled modules, or whether a tenant is deployed today.
 *
 * Runtime tenancy rows live in `public.workspaces` (see migrations + workspace-host.ts).
 * Host aliases are resolved via workspace-host-alias-service + *-surface.ts modules.
 */

import { ABHI_SLUG } from "@/lib/abhi-surface";
import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import { MAM_SLUG } from "@/lib/mam/mam-surface";
import { ONWARDAIR_SLUG, ONWARDAIR_SLUG_ALIASES } from "@/lib/onwardair-surface";
import { PAILEX_SLUG } from "@/lib/pailex/pailex-surface";
import {
  OMNITRANSIT_HOST_ALIAS_SLUG,
  SAEC_SLUG,
} from "@/lib/saec-surface";
import {
  TALANTON_HOST_ALIAS_SLUG,
  TALANTON_IMPACT_SLUG,
} from "@/lib/talanton-surface";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

/** How Living Architecture derives module trees under each workspace (read-only). */
export type LivingArchitectureEnablement = "full-core" | "saec-core" | "db-driven";

/** Workspace Architecture lifecycle band (presentation only — not tenancy status). */
export type WorkspaceArchitectureLifecycle = "active" | "potential" | "archived";

export type Unit311WorkspaceUniverseEntry = {
  /** Canonical `public.workspaces.slug` / tenancy slug. */
  slug: string;
  /** Stable Living Architecture filter id (`workspace::{architectureId}`). */
  architectureId: string;
  /** Display label in Workspace Architecture UI. */
  label: string;
  slugAliases?: readonly string[];
  /** Short pointer to where this workspace is established in code/migrations. */
  evidence: string;
  livingArchitectureEnablement: LivingArchitectureEnablement;
  lifecycle: WorkspaceArchitectureLifecycle;
  /** Display order within the lifecycle band (1-based). */
  lifecycleOrder: number;
  /** ABHI-specific Core/Custom overrides in architecture-taxonomy.ts */
  isAbhi?: boolean;
  /** OmniTransit / SAEC Installations overrides */
  isOmniTransit?: boolean;
};

export const WORKSPACE_ARCHITECTURE_LIFECYCLE_SEQUENCE = [
  "active",
  "potential",
  "archived",
] as const satisfies readonly WorkspaceArchitectureLifecycle[];

export const WORKSPACE_ARCHITECTURE_LIFECYCLE_LABEL: Record<
  WorkspaceArchitectureLifecycle,
  string
> = {
  active: "ACTIVE",
  potential: "POTENTIAL",
  archived: "ARCHIVED",
};

/**
 * Canonical 13-workspace Living Architecture registry (lifecycle + runtime slug references).
 * Order: Active (4) → Potential (7) → Archived (2).
 */
export const UNIT311_WORKSPACE_UNIVERSE: readonly Unit311WorkspaceUniverseEntry[] = [
  {
    slug: INTERNAL_WORKSPACE_SLUG,
    architectureId: INTERNAL_WORKSPACE_SLUG,
    label: "Unit311 Central / Internal",
    evidence: "workspace-host.ts INTERNAL_WORKSPACE_SLUG; migrations 076/078 unit311 row",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "active",
    lifecycleOrder: 1,
  },
  {
    slug: DEMO_WORKSPACE_SLUG,
    architectureId: "northstar",
    label: "Demo / Northstar",
    slugAliases: ["demo"],
    evidence: "app-domains DEMO_WORKSPACE_SLUG; demo host; Northstar demo tenancy",
    livingArchitectureEnablement: "full-core",
    lifecycle: "active",
    lifecycleOrder: 2,
  },
  {
    slug: WOLF_CENTRAL_SLUG,
    architectureId: WOLF_CENTRAL_SLUG,
    label: "WOLF Central",
    slugAliases: ["wolf"],
    evidence: "wolf/wolf-surface.ts WOLF_CENTRAL_SLUG; migrations 195+ wolf-central",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "active",
    lifecycleOrder: 3,
  },
  {
    slug: INTERFACE_WORX_SLUG,
    architectureId: INTERFACE_WORX_SLUG,
    label: "Interface Worx",
    evidence: "interface-worx-surface.ts; intelligence workspace pack",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "active",
    lifecycleOrder: 4,
  },
  {
    slug: TALANTON_IMPACT_SLUG,
    architectureId: TALANTON_IMPACT_SLUG,
    label: "Talanton",
    slugAliases: [TALANTON_HOST_ALIAS_SLUG],
    evidence: "talanton-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "potential",
    lifecycleOrder: 1,
  },
  {
    slug: PAILEX_SLUG,
    architectureId: PAILEX_SLUG,
    label: "PAILEX",
    evidence: "pailex/pailex-surface.ts; workspace-host-alias-service",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "potential",
    lifecycleOrder: 2,
  },
  {
    slug: MAM_SLUG,
    architectureId: MAM_SLUG,
    label: "MAM",
    evidence: "mam/mam-surface.ts; migration 215_mam_workspace_tenancy.sql",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "potential",
    lifecycleOrder: 3,
  },
  {
    slug: ABHI_SLUG,
    architectureId: ABHI_SLUG,
    label: "ABHI",
    evidence: "abhi-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "full-core",
    isAbhi: true,
    lifecycle: "potential",
    lifecycleOrder: 4,
  },
  {
    slug: SAEC_SLUG,
    architectureId: OMNITRANSIT_HOST_ALIAS_SLUG,
    label: "OmniTransit",
    slugAliases: [OMNITRANSIT_HOST_ALIAS_SLUG, SAEC_SLUG],
    evidence: "saec-surface.ts SAEC_SLUG + omnitransit host alias",
    livingArchitectureEnablement: "saec-core",
    isOmniTransit: true,
    lifecycle: "potential",
    lifecycleOrder: 5,
  },
  {
    slug: AMANAH_SLUG,
    architectureId: "amanah",
    label: "Amanah Surgical",
    slugAliases: [AMANAH_SLUG, "amanahsurgical"],
    evidence: "amanah-surface.ts AMANAH_SLUG (amanahsurgical)",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "potential",
    lifecycleOrder: 6,
  },
  {
    slug: GREENDESERT_SLUG,
    architectureId: GREENDESERT_SLUG,
    label: "Green Desert",
    evidence: "greendesert-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "potential",
    lifecycleOrder: 7,
  },
  {
    slug: "corpcentre",
    architectureId: "corpcentre",
    label: "CorpCentre",
    slugAliases: ["corporatecentre"],
    evidence: "corpcentre-surface.ts; platform-analytics TRACKED_WORKSPACES",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "archived",
    lifecycleOrder: 1,
  },
  {
    slug: ONWARDAIR_SLUG,
    architectureId: ONWARDAIR_SLUG,
    label: "OnwardAir",
    slugAliases: [...ONWARDAIR_SLUG_ALIASES],
    evidence: "onwardair-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "db-driven",
    lifecycle: "archived",
    lifecycleOrder: 2,
  },
] as const;

export const WORKSPACE_ARCHITECTURE_REGISTRY_COUNT = UNIT311_WORKSPACE_UNIVERSE.length;

export type WorkspaceArchitectureFilterOption = {
  id: string;
  label: string;
};

/** Workspace selector options for Living Architecture (includes All Workspaces). */
export function buildWorkspaceArchitectureFilterOptions(): readonly WorkspaceArchitectureFilterOption[] {
  return [
    { id: "all", label: "All Workspaces" },
    ...UNIT311_WORKSPACE_UNIVERSE.map((entry) => ({
      id: entry.architectureId,
      label: entry.label,
    })),
  ];
}

export function workspaceArchitectureRegistryEntries(
  architectureFilter?: string | null,
): readonly Unit311WorkspaceUniverseEntry[] {
  const filter = String(architectureFilter ?? "all").trim().toLowerCase();
  if (filter === "all" || !filter) {
    return UNIT311_WORKSPACE_UNIVERSE;
  }
  return UNIT311_WORKSPACE_UNIVERSE.filter(
    (entry) =>
      entry.architectureId.toLowerCase() === filter ||
      entry.slug.toLowerCase() === filter ||
      entry.slugAliases?.some((alias) => alias.toLowerCase() === filter),
  );
}

export function countWorkspaceArchitectureByLifecycle(
  entries: readonly Unit311WorkspaceUniverseEntry[] = UNIT311_WORKSPACE_UNIVERSE,
): Record<WorkspaceArchitectureLifecycle, number> {
  const counts: Record<WorkspaceArchitectureLifecycle, number> = {
    active: 0,
    potential: 0,
    archived: 0,
  };
  for (const entry of entries) {
    counts[entry.lifecycle] += 1;
  }
  return counts;
}

export function getWorkspaceUniverseEntryByArchitectureId(
  architectureId: string,
): Unit311WorkspaceUniverseEntry | undefined {
  const normalized = architectureId.trim().toLowerCase();
  return UNIT311_WORKSPACE_UNIVERSE.find(
    (entry) =>
      entry.architectureId.toLowerCase() === normalized ||
      entry.slug.toLowerCase() === normalized,
  );
}

export function getWorkspaceUniverseEntryBySlug(
  slug: string,
): Unit311WorkspaceUniverseEntry | undefined {
  const normalized = slug.trim().toLowerCase();
  return UNIT311_WORKSPACE_UNIVERSE.find(
    (entry) =>
      entry.slug.toLowerCase() === normalized ||
      entry.slugAliases?.some((alias) => alias.toLowerCase() === normalized),
  );
}

export function listWorkspaceUniverseSlugs(): string[] {
  return UNIT311_WORKSPACE_UNIVERSE.map((entry) => entry.slug);
}
