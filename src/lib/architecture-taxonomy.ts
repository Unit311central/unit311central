/**
 * Living Architecture taxonomy adapter.
 *
 * Derives the Core Product / Custom Product / Workspace Architecture hierarchies
 * from EXISTING sources so the three tree views stay data-driven as modules are
 * audited. It creates no new database table and mutates nothing.
 *
 * Critical rule: navigation is NOT automatically taxonomy. Only modules whose
 * taxonomy has been formally audited (AUDITED_CORE_MODULE_IDS) expose
 * Core Features / Core Sub-features. Every other Core Module renders at module
 * level only.
 *
 * Sources:
 * - Module list: buildCentralProductNavSections() + canonical-modules.ts
 * - Business Central features/sub-features: buildCentralBusinessCentralNavSection()
 *   (matches business-central-taxonomy.check.ts)
 * - Sales Management features/sub-features: buildSalesManagementNavSection()
 *   (matches sales-management-taxonomy.check.ts)
 * - Intelligence: explicit audited annotation (Dashboard + three domains)
 * - Home: home-taxonomy.ts (module-level only — 0 features)
 * - Fundraising features/sub-features: fundraising-taxonomy.ts
 *   (matches fundraising-taxonomy.check.ts)
 * - Operations features: operations-taxonomy.ts (matches operations-taxonomy.check.ts)
 * - Marketing & Events features: marketing-events-taxonomy.ts
 *   (matches marketing-events-taxonomy.check.ts)
 * - Custom (ABHI Regulatory Intelligence): src/lib/abhi/nav.ts
 * - Custom (ABHI Marketing & Events): marketing-events-taxonomy.ts + abhi/nav.ts
 * - Custom (OmniTransit Installations): operations-taxonomy.ts + saec/installations-nav.ts
 * - Workspace enablement: demo/saec provisioning constants + core catalogue (read-only)
 */

import {
  ABHI_INTELLIGENCE_NAV_SECTION,
  ABHI_MARKETING_NAV_SECTION,
  ABHI_REGULATORY_NAV_SECTION,
} from "@/lib/abhi/nav";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import { BOARD_CORE_FEATURES } from "@/lib/board/board-taxonomy";
import { CORPORATE_INFORMATION_CORE_FEATURES } from "@/lib/corporate-information/corporate-information-taxonomy";
import { HOME_MODULE_ID } from "@/lib/home/home-taxonomy";
import type {
  InternalNavChildItem,
  InternalNavItem,
} from "@/lib/internal-operations-data";
import { DEMO_ENABLED_MODULES } from "@/lib/platform-workspaces/demo-provisioning";
import { WORKSPACE_CORE_MODULE_IDS } from "@/lib/platform-workspaces/module-catalogue";
import { SAEC_ENABLED_MODULES } from "@/lib/platform-workspaces/saec-provisioning";
import {
  buildCentralBusinessCentralNavSection,
  buildCentralProductNavSections,
} from "@/lib/platform-workspaces/central-product-nav";
import { FUNDRAISING_CORE_FEATURES } from "@/lib/fundraising/fundraising-taxonomy";
import {
  ABHI_MARKETING_CUSTOM_FEATURES,
  isAbhiMarketingCustomFeatureView,
  MARKETING_EVENTS_CORE_FEATURES,
  MARKETING_EVENTS_MODULE_ID,
} from "@/lib/marketing-events/marketing-events-taxonomy";
import {
  OPERATIONS_CORE_FEATURES,
  OPERATIONS_MODULE_ID,
  SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL,
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES,
} from "@/lib/operations/operations-taxonomy";
import { buildSalesManagementNavSection } from "@/lib/sales-management-nav";
import type { ArchitectureTaxonomyNode } from "@/lib/architecture-taxonomy-types";

/**
 * Core Modules whose Core Feature / Core Sub-feature taxonomy is formally audited.
 * Only these expose deeper structure; every other Core Module renders at module level.
 *
 * LIVING-ARCHITECTURE RULE (part of the taxonomy workflow):
 * When a module's taxonomy audit is formally completed, it MUST be added here AND given
 * a source in `auditedFeaturesForModule()` below, as part of that same taxonomy work.
 * A completed taxonomy must never remain UNAUDITED. Conversely, do not add a module here
 * until its taxonomy has been formally audited (nav is not automatically taxonomy).
 */
export const AUDITED_CORE_MODULE_IDS: ReadonlySet<string> = new Set([
  "home",
  "business-central",
  "sales-management",
  "intelligence",
  "corporate-information",
  "fundraising",
  "operations",
  "board",
  "marketing-events",
]);

/** Explicit audited Intelligence taxonomy (nav omits the Dashboard, so it is not derived from nav). */
const INTELLIGENCE_AUDITED_FEATURES: readonly string[] = [
  "Dashboard",
  "Company Intelligence",
  "Client Intelligence",
  "Market Intelligence",
];

const UNAUDITED_NOTE = "Taxonomy not yet audited — module level only";

function subFeatureNode(
  parentId: string,
  child: InternalNavChildItem,
  kind: "core" | "custom",
): ArchitectureTaxonomyNode {
  return {
    id: `${parentId}::${slug(child.label)}`,
    label: child.label,
    level: "sub-feature",
    kind,
  };
}

/** Map an audited module's nav items into Core Features (+ Core Sub-features). */
function navItemsToFeatures(
  moduleId: string,
  items: readonly InternalNavItem[],
  kind: "core" | "custom" = "core",
): ArchitectureTaxonomyNode[] {
  return items.map((item) => {
    const featureId = `${moduleId}::${slug(item.label)}`;
    const children = item.children?.length
      ? item.children.map((child) => subFeatureNode(featureId, child, kind))
      : undefined;
    return {
      id: featureId,
      label: item.label,
      level: "feature",
      kind,
      children,
    };
  });
}

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Audited feature list for a Core Module, or null when the module is unaudited. */
function auditedFeaturesForModule(moduleId: string): ArchitectureTaxonomyNode[] | null {
  if (!AUDITED_CORE_MODULE_IDS.has(moduleId)) return null;

  if (moduleId === "business-central") {
    return navItemsToFeatures(moduleId, buildCentralBusinessCentralNavSection().items);
  }
  if (moduleId === "sales-management") {
    return navItemsToFeatures(moduleId, buildSalesManagementNavSection().items);
  }
  if (moduleId === "intelligence") {
    return INTELLIGENCE_AUDITED_FEATURES.map((label) => ({
      id: `intelligence::${slug(label)}`,
      label,
      level: "feature" as const,
      kind: "core" as const,
    }));
  }
  if (moduleId === "corporate-information") {
    // Audited taxonomy source: corporate-information-taxonomy.ts (6 Core Features, 5 Sub-features).
    return CORPORATE_INFORMATION_CORE_FEATURES.map((feature) => {
      const featureId = `corporate-information::${slug(feature.label)}`;
      return {
        id: featureId,
        label: feature.label,
        level: "feature" as const,
        kind: "core" as const,
        children: feature.subFeature
          ? [
              {
                id: `${featureId}::${slug(feature.subFeature.label)}`,
                label: feature.subFeature.label,
                level: "sub-feature" as const,
                kind: "core" as const,
              },
            ]
          : undefined,
      };
    });
  }
  if (moduleId === HOME_MODULE_ID) {
    // Audited taxonomy source: home-taxonomy.ts — module-level only (0 features).
    return [];
  }
  if (moduleId === "board") {
    // Audited taxonomy source: board-taxonomy.ts (6 Core Features, 0 Sub-features).
    return BOARD_CORE_FEATURES.map((feature) => ({
      id: `board::${slug(feature.label)}`,
      label: feature.label,
      level: "feature" as const,
      kind: "core" as const,
    }));
  }
  if (moduleId === "fundraising") {
    // Audited taxonomy source: fundraising-taxonomy.ts (8 Core Features, 9 Sub-features).
    return FUNDRAISING_CORE_FEATURES.map((feature) => {
      const featureId = `fundraising::${slug(feature.label)}`;
      return {
        id: featureId,
        label: feature.label,
        level: "feature" as const,
        kind: "core" as const,
        children: feature.subFeatures?.map((sub) => ({
          id: `${featureId}::${slug(sub.label)}`,
          label: sub.label,
          level: "sub-feature" as const,
          kind: "core" as const,
        })),
      };
    });
  }
  if (moduleId === OPERATIONS_MODULE_ID) {
    // Audited taxonomy source: operations-taxonomy.ts (5 Core Features, 0 Sub-features).
    return OPERATIONS_CORE_FEATURES.map((feature) => ({
      id: `${OPERATIONS_MODULE_ID}::${slug(feature.label)}`,
      label: feature.label,
      level: "feature" as const,
      kind: "core" as const,
    }));
  }
  if (moduleId === MARKETING_EVENTS_MODULE_ID) {
    // Audited taxonomy source: marketing-events-taxonomy.ts (7 Core Features, 0 Sub-features).
    return MARKETING_EVENTS_CORE_FEATURES.map((feature) => ({
      id: `${MARKETING_EVENTS_MODULE_ID}::${slug(feature.label)}`,
      label: feature.label,
      level: "feature" as const,
      kind: "core" as const,
    }));
  }
  return null;
}

function coreModuleNode(
  moduleId: string,
  label: string,
  overrideFeatures?: ArchitectureTaxonomyNode[] | null,
): ArchitectureTaxonomyNode {
  const audited = AUDITED_CORE_MODULE_IDS.has(moduleId);
  const features = overrideFeatures ?? auditedFeaturesForModule(moduleId);
  return {
    id: `module::${moduleId}`,
    label,
    level: "module",
    kind: "core",
    audited,
    note: audited ? undefined : UNAUDITED_NOTE,
    children: features ?? undefined,
  };
}

/** VIEW 1 — Core Product. The standard Core Modules only (WOLF specialist extensions excluded). */
export function buildCoreProductTaxonomy(): ArchitectureTaxonomyNode {
  const modules = buildCentralProductNavSections()
    .filter((spec) => !spec.id.startsWith("wolf-"))
    .map((spec) => coreModuleNode(spec.id, getCanonicalModule(spec.id)?.label ?? spec.label));

  return {
    id: "core-product",
    label: "UNIT311 CENTRAL",
    level: "root",
    kind: "structural",
    children: [
      {
        id: "core-product::modules",
        label: "CORE MODULES",
        level: "group",
        kind: "core",
        children: modules,
      },
    ],
  };
}

/** OmniTransit / SAEC Installations custom feature (+ three custom sub-features). */
function saecInstallationsCustomFeature(idPrefix: string): ArchitectureTaxonomyNode {
  const featureId = `${idPrefix}::installations`;
  return {
    id: featureId,
    label: SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL,
    level: "feature",
    kind: "custom",
    children: SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES.map((sub) => ({
      id: `${featureId}::${slug(sub.label)}`,
      label: sub.label,
      level: "sub-feature" as const,
      kind: "custom" as const,
    })),
  };
}

/** OmniTransit Operations: five core features + Installations custom feature (nav order). */
function omnitransitOperationsFeatures(): ArchitectureTaxonomyNode[] {
  const core = (auditedFeaturesForModule(OPERATIONS_MODULE_ID) ?? []).map((node) => ({ ...node }));
  const dashboardIndex = core.findIndex((node) => node.label === "Dashboard");
  const insertAt = dashboardIndex >= 0 ? dashboardIndex + 1 : 0;
  return [
    ...core.slice(0, insertAt),
    saecInstallationsCustomFeature("module::operations"),
    ...core.slice(insertAt),
  ];
}

/** ABHI Marketing & Events custom feature (flat leaf — no sub-features). */
function abhiMarketingCustomFeatureNode(
  idPrefix: string,
  label: string,
): ArchitectureTaxonomyNode {
  return {
    id: `${idPrefix}::${slug(label)}`,
    label,
    level: "feature",
    kind: "custom",
  };
}

/** ABHI Marketing & Events override: five standard Core Features + four Custom Features (nav order). */
function abhiMarketingFeatures(): ArchitectureTaxonomyNode[] {
  return ABHI_MARKETING_NAV_SECTION.items.map((item) => {
    const viewId = item.view ?? "";
    if (isAbhiMarketingCustomFeatureView(viewId)) {
      return abhiMarketingCustomFeatureNode("workspace::abhi::marketing-events", item.label);
    }
    const coreFeature = MARKETING_EVENTS_CORE_FEATURES.find((feature) => feature.viewId === viewId);
    const label = coreFeature?.label ?? item.label;
    return {
      id: `workspace::abhi::marketing-events::${slug(label)}`,
      label,
      level: "feature" as const,
      kind: "core" as const,
    };
  });
}

/** ABHI Regulatory Intelligence custom feature (+ four custom sub-features) — from abhi/nav.ts. */
function abhiRegulatoryIntelligenceFeature(idPrefix: string): ArchitectureTaxonomyNode {
  const featureId = `${idPrefix}::regulatory-intelligence`;
  return {
    id: featureId,
    label: "Regulatory Intelligence",
    level: "feature",
    kind: "custom",
    children: ABHI_REGULATORY_NAV_SECTION.items.map((item) => ({
      id: `${featureId}::${slug(item.label)}`,
      label: item.label,
      level: "sub-feature" as const,
      kind: "custom" as const,
    })),
  };
}

/** VIEW 2 — Custom Product (only genuinely identified custom items). */
export function buildCustomProductTaxonomy(): ArchitectureTaxonomyNode {
  return {
    id: "custom-product",
    label: "UNIT311 CENTRAL",
    level: "root",
    kind: "structural",
    children: [
      {
        id: "custom-product::modules",
        label: "CUSTOM MODULES",
        level: "group",
        kind: "custom",
        note: "None identified yet",
        children: [],
      },
      {
        id: "custom-product::features",
        label: "CUSTOM FEATURES",
        level: "group",
        kind: "custom",
        children: [
          {
            id: "custom-product::abhi",
            label: "ABHI",
            level: "workspace",
            kind: "custom",
            children: [
              abhiRegulatoryIntelligenceFeature("custom-product::abhi"),
              ...ABHI_MARKETING_CUSTOM_FEATURES.map((feature) =>
                abhiMarketingCustomFeatureNode("custom-product::abhi", feature.label),
              ),
            ],
          },
          {
            id: "custom-product::omnitransit",
            label: "OmniTransit",
            level: "workspace",
            kind: "custom",
            children: [saecInstallationsCustomFeature("custom-product::omnitransit")],
          },
        ],
      },
    ],
  };
}

type WorkspaceSpec = {
  id: string;
  label: string;
  enablement: "full-core" | "saec-core" | "db-driven";
  isAbhi?: boolean;
};

/** Customer workspaces in scope. Enablement is read from provisioning constants (read-only). */
const WORKSPACE_SPECS: readonly WorkspaceSpec[] = [
  { id: "northstar", label: "Northstar", enablement: "full-core" },
  { id: "abhi", label: "ABHI", enablement: "full-core", isAbhi: true },
  { id: "omnitransit", label: "OmniTransit", enablement: "saec-core" },
  { id: "amanah", label: "Amanah", enablement: "db-driven" },
  { id: "interfaceworx", label: "InterfaceWorx", enablement: "db-driven" },
  { id: "greendesert", label: "GreenDesert", enablement: "db-driven" },
];

const ABHI_BC_LABEL_RENAMES: Record<string, string> = {
  "Client Management": "Member Management",
  "Client Dashboard": "Member Dashboard",
  "Client Directory": "Member Directory",
};

function applyAbhiTerminology(node: ArchitectureTaxonomyNode): ArchitectureTaxonomyNode {
  const relabelled = ABHI_BC_LABEL_RENAMES[node.label] ?? node.label;
  return {
    ...node,
    label: relabelled,
    children: node.children?.map(applyAbhiTerminology),
  };
}

/** ABHI Intelligence override: Member Intelligence (core) + Regulatory Intelligence (custom). */
function abhiIntelligenceFeatures(): ArchitectureTaxonomyNode[] {
  return ABHI_INTELLIGENCE_NAV_SECTION.items.map((item) => {
    if (item.label === "Regulatory Intelligence") {
      return abhiRegulatoryIntelligenceFeature("workspace::abhi::intelligence");
    }
    return {
      id: `workspace::abhi::intelligence::${slug(item.label)}`,
      label: item.label,
      level: "feature" as const,
      kind: "core" as const,
    };
  });
}

function workspaceCoreModules(spec: WorkspaceSpec): ArchitectureTaxonomyNode[] {
  const moduleIds =
    spec.enablement === "saec-core"
      ? [...SAEC_ENABLED_MODULES]
      : spec.enablement === "full-core"
        ? [...DEMO_ENABLED_MODULES]
        : [...WORKSPACE_CORE_MODULE_IDS];

  return moduleIds.map((moduleId) => {
    const label = getCanonicalModule(moduleId)?.label ?? moduleId;
    if (spec.isAbhi && moduleId === "business-central") {
      const node = coreModuleNode(moduleId, label);
      const relabelled = applyAbhiTerminology(node);
      return { ...relabelled, note: "ABHI: Member terminology" };
    }
    if (spec.isAbhi && moduleId === "intelligence") {
      return {
        ...coreModuleNode(moduleId, label, abhiIntelligenceFeatures()),
        note: "ABHI: Member Intelligence + Regulatory Intelligence",
      };
    }
    if (spec.isAbhi && moduleId === MARKETING_EVENTS_MODULE_ID) {
      return {
        ...coreModuleNode(moduleId, label, abhiMarketingFeatures()),
        note: "ABHI: five standard Core Features + four Custom Features",
      };
    }
    if (spec.id === "omnitransit" && moduleId === OPERATIONS_MODULE_ID) {
      return {
        ...coreModuleNode(moduleId, label, omnitransitOperationsFeatures()),
        note: "OmniTransit: Installations custom feature under Operations",
      };
    }
    return coreModuleNode(moduleId, label);
  });
}

function workspaceNode(spec: WorkspaceSpec): ArchitectureTaxonomyNode {
  const coreGroupNote =
    spec.enablement === "db-driven"
      ? "Enablement is workspace-DB-driven — standard core taxonomy shown"
      : spec.enablement === "saec-core"
        ? "Full core catalogue (Business Central Grant Management excluded)"
        : "Full core catalogue";

  const customChildren: ArchitectureTaxonomyNode[] = spec.isAbhi
    ? [
        abhiRegulatoryIntelligenceFeature(`workspace::${spec.id}::custom`),
        ...ABHI_MARKETING_CUSTOM_FEATURES.map((feature) =>
          abhiMarketingCustomFeatureNode(`workspace::${spec.id}::custom`, feature.label),
        ),
      ]
    : spec.id === "omnitransit"
      ? [saecInstallationsCustomFeature(`workspace::${spec.id}::custom`)]
      : [];

  return {
    id: `workspace::${spec.id}`,
    label: spec.label,
    level: "workspace",
    kind: "core",
    children: [
      {
        id: `workspace::${spec.id}::core`,
        label: "CORE MODULES",
        level: "group",
        kind: "core",
        note: coreGroupNote,
        children: workspaceCoreModules(spec),
      },
      {
        id: `workspace::${spec.id}::custom`,
        label: "CUSTOM",
        level: "group",
        kind: "custom",
        note: customChildren.length ? undefined : "None identified",
        children: customChildren,
      },
    ],
  };
}

/** VIEW 3 — Workspace Architecture. Optional single-workspace filter. */
export function buildWorkspaceArchitectureTaxonomy(
  workspaceFilter?: string | null,
): ArchitectureTaxonomyNode {
  const filter = String(workspaceFilter ?? "all").trim().toLowerCase();
  const specs =
    filter === "all" || !filter
      ? WORKSPACE_SPECS
      : WORKSPACE_SPECS.filter((spec) => spec.id === filter);

  return {
    id: "workspace-architecture",
    label: "WORKSPACE ARCHITECTURE",
    level: "root",
    kind: "structural",
    children: specs.map(workspaceNode),
  };
}

/** Resolve a tree taxonomy by section slug (server entrypoint for the API). */
export function buildArchitectureTaxonomy(
  sectionSlug: string,
  options?: { workspace?: string | null },
): ArchitectureTaxonomyNode | null {
  switch (sectionSlug) {
    case "core-product":
      return buildCoreProductTaxonomy();
    case "custom-product":
      return buildCustomProductTaxonomy();
    case "workspace-architecture":
      return buildWorkspaceArchitectureTaxonomy(options?.workspace);
    default:
      return null;
  }
}
