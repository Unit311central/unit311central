/**
 * Authoritative Unit311 workspace universe for Living Architecture and host routing docs.
 *
 * This is the known product/deployment catalogue — NOT the current user's access,
 * active workspace, enabled modules, or whether a tenant is deployed today.
 *
 * Runtime tenancy rows live in `public.workspaces` (see migrations + workspace-host.ts).
 * Host aliases are resolved via workspace-host-alias-service + *-surface.ts modules.
 *
 * MAM: not confirmed as a runtime workspace in this repository (only a sample PDF script:
 * scripts/generate-mam-sales-quote-pdf-sample.ts). Do not add until tenancy evidence exists.
 *
 * WOLF Central (`wolf-central`) is intentionally omitted from Living Architecture until
 * workspace capability mapping is approved (specialist deployment).
 */

import { ABHI_SLUG } from "@/lib/abhi-surface";
import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
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
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

/** How Living Architecture derives module trees under each workspace (read-only). */
export type LivingArchitectureEnablement = "full-core" | "saec-core" | "db-driven";

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
  /** ABHI-specific Core/Custom overrides in architecture-taxonomy.ts */
  isAbhi?: boolean;
  /** OmniTransit / SAEC Installations overrides */
  isOmniTransit?: boolean;
};

/**
 * Ordered Unit311 workspace universe (Internal + customer tenants with code/surface evidence).
 * Extend this list when a new workspace pack or surface is added — not WORKSPACE_SPECS.
 */
export const UNIT311_WORKSPACE_UNIVERSE: readonly Unit311WorkspaceUniverseEntry[] = [
  {
    slug: INTERNAL_WORKSPACE_SLUG,
    architectureId: INTERNAL_WORKSPACE_SLUG,
    label: "Unit311 Central",
    evidence: "workspace-host.ts INTERNAL_WORKSPACE_SLUG; migrations 076/078 unit311 row",
    livingArchitectureEnablement: "db-driven",
  },
  {
    slug: DEMO_WORKSPACE_SLUG,
    architectureId: "northstar",
    label: "Northstar",
    slugAliases: ["demo"],
    evidence: "app-domains DEMO_WORKSPACE_SLUG; demo host; Northstar demo tenancy",
    livingArchitectureEnablement: "full-core",
  },
  {
    slug: ABHI_SLUG,
    architectureId: ABHI_SLUG,
    label: "ABHI",
    evidence: "abhi-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "full-core",
    isAbhi: true,
  },
  {
    slug: SAEC_SLUG,
    architectureId: OMNITRANSIT_HOST_ALIAS_SLUG,
    label: "OmniTransit",
    slugAliases: [OMNITRANSIT_HOST_ALIAS_SLUG, SAEC_SLUG],
    evidence: "saec-surface.ts SAEC_SLUG + omnitransit host alias",
    livingArchitectureEnablement: "saec-core",
    isOmniTransit: true,
  },
  {
    slug: TALANTON_IMPACT_SLUG,
    architectureId: TALANTON_IMPACT_SLUG,
    label: "Talanton",
    slugAliases: [TALANTON_HOST_ALIAS_SLUG],
    evidence: "talanton-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "db-driven",
  },
  {
    slug: ONWARDAIR_SLUG,
    architectureId: ONWARDAIR_SLUG,
    label: "OnwardAir",
    slugAliases: [...ONWARDAIR_SLUG_ALIASES],
    evidence: "onwardair-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "db-driven",
  },
  {
    slug: AMANAH_SLUG,
    architectureId: "amanah",
    label: "Amanah",
    slugAliases: [AMANAH_SLUG, "amanahsurgical"],
    evidence: "amanah-surface.ts AMANAH_SLUG (amanahsurgical)",
    livingArchitectureEnablement: "db-driven",
  },
  {
    slug: INTERFACE_WORX_SLUG,
    architectureId: INTERFACE_WORX_SLUG,
    label: "InterfaceWorx",
    evidence: "interface-worx-surface.ts; intelligence workspace pack",
    livingArchitectureEnablement: "db-driven",
  },
  {
    slug: GREENDESERT_SLUG,
    architectureId: GREENDESERT_SLUG,
    label: "GreenDesert",
    evidence: "greendesert-surface.ts; intelligence/portals workspace packs",
    livingArchitectureEnablement: "db-driven",
  },
  {
    slug: "corpcentre",
    architectureId: "corpcentre",
    label: "CorpCentre",
    slugAliases: ["corporatecentre"],
    evidence: "corpcentre-surface.ts; platform-analytics TRACKED_WORKSPACES",
    livingArchitectureEnablement: "db-driven",
  },
  {
    slug: PAILEX_SLUG,
    architectureId: PAILEX_SLUG,
    label: "PAILEX",
    evidence: "pailex/pailex-surface.ts; workspace-host-alias-service",
    livingArchitectureEnablement: "db-driven",
  },
] as const;

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
