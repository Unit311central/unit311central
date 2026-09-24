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
 * - Executive Assistant: executive-assistant-taxonomy.ts
 * - Finances: financials-taxonomy.ts
 * - Project Management: project-management-taxonomy.ts
 * - Technology Management: technology-management-taxonomy.ts
 * - Human Resources: human-resources-taxonomy.ts
 * - Business Productivity: business-productivity-taxonomy.ts
 * - Support Desk: support-desk-taxonomy.ts
 * - Engineering: engineering-taxonomy.ts
 * - Training: training-taxonomy.ts
 * - QMS: qms-taxonomy.ts
 * - Tools: tools-taxonomy.ts
 * - External Client Access: external-client-access-taxonomy.ts
 * - Settings: settings-taxonomy.ts
 * - Custom (ABHI Regulatory Intelligence): src/lib/abhi/nav.ts
 * - Custom (ABHI Marketing & Events): marketing-events-taxonomy.ts + abhi/nav.ts
 * - Custom (OmniTransit Installations): operations-taxonomy.ts + saec/installations-nav.ts
 * - Workspace list: unit311-workspace-universe.ts (full Unit311 tenancy catalogue)
 * - Unit311 Central workspace modules: workspace_sidebar_modules / whoami snapshot
 *   (workspace-architecture-enablement.ts + loadUnit311WorkspaceArchitectureSidebarConfig)
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
import { UNIT311_WORKSPACE_UNIVERSE } from "@/lib/platform-workspaces/unit311-workspace-universe";
import type { LivingArchitectureEnablement } from "@/lib/platform-workspaces/unit311-workspace-universe";
import {
  buildUnit311CentralPlatformNavigationNodes,
  isUnit311CentralArchitectureId,
  unit311CentralEnabledCoreModuleIds,
} from "@/lib/platform-workspaces/workspace-architecture-enablement";
import type { WorkspaceSidebarConfigSnapshot } from "@/lib/platform-workspaces/workspace-sidebar-config";
import {
  buildCentralBusinessCentralNavSection,
  buildCentralProductNavSections,
} from "@/lib/platform-workspaces/central-product-nav";
import { BUSINESS_PRODUCTIVITY_CORE_FEATURES } from "@/lib/business-productivity/business-productivity-taxonomy";
import {
  ENGINEERING_CORE_FEATURES,
  ENGINEERING_MODULE_ID,
} from "@/lib/engineering/engineering-taxonomy";
import {
  EXECUTIVE_ASSISTANT_CORE_FEATURES,
  EXECUTIVE_ASSISTANT_MODULE_ID,
} from "@/lib/executive-assistant/executive-assistant-taxonomy";
import {
  EXTERNAL_CLIENT_ACCESS_CORE_FEATURES,
  EXTERNAL_CLIENT_ACCESS_MODULE_ID,
} from "@/lib/external-client-access/external-client-access-taxonomy";
import { FINANCIALS_CORE_FEATURES, FINANCIALS_MODULE_ID } from "@/lib/financials/financials-taxonomy";
import { FUNDRAISING_CORE_FEATURES } from "@/lib/fundraising/fundraising-taxonomy";
import {
  HUMAN_RESOURCES_CORE_FEATURES,
  HUMAN_RESOURCES_MODULE_ID,
} from "@/lib/human-resources/human-resources-taxonomy";
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
import {
  PROJECT_MANAGEMENT_CORE_FEATURES,
  PROJECT_MANAGEMENT_MODULE_ID,
} from "@/lib/project-management/project-management-taxonomy";
import { QMS_CORE_FEATURES, QMS_MODULE_ID } from "@/lib/qms/qms-taxonomy";
import { buildSalesManagementNavSection } from "@/lib/sales-management-nav";
import { SETTINGS_CORE_FEATURES, SETTINGS_MODULE_ID } from "@/lib/settings/settings-taxonomy";
import {
  SUPPORT_DESK_CORE_FEATURES,
  SUPPORT_DESK_MODULE_ID,
} from "@/lib/support-desk/support-desk-taxonomy";
import {
  TECHNOLOGY_MANAGEMENT_CORE_FEATURES,
  TECHNOLOGY_MANAGEMENT_MODULE_ID,
} from "@/lib/technology-management/technology-management-taxonomy";
import { TOOLS_CORE_FEATURES, TOOLS_MODULE_ID } from "@/lib/tools/tools-taxonomy";
import { TRAINING_CORE_FEATURES, TRAINING_MODULE_ID } from "@/lib/training/training-taxonomy";
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
  EXECUTIVE_ASSISTANT_MODULE_ID,
  "intelligence",
  "business-central",
  "sales-management",
  FINANCIALS_MODULE_ID,
  "fundraising",
  "board",
  "corporate-information",
  OPERATIONS_MODULE_ID,
  MARKETING_EVENTS_MODULE_ID,
  TECHNOLOGY_MANAGEMENT_MODULE_ID,
  HUMAN_RESOURCES_MODULE_ID,
  "business-productivity",
  SUPPORT_DESK_MODULE_ID,
  PROJECT_MANAGEMENT_MODULE_ID,
  ENGINEERING_MODULE_ID,
  TRAINING_MODULE_ID,
  QMS_MODULE_ID,
  TOOLS_MODULE_ID,
  EXTERNAL_CLIENT_ACCESS_MODULE_ID,
  SETTINGS_MODULE_ID,
]);

/** Standard Core Product modules (22) — WOLF specialist extensions excluded. */
export const CORE_PRODUCT_MODULE_IDS: readonly string[] = [...AUDITED_CORE_MODULE_IDS];

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

type FormalCoreFeatureSpec = {
  label: string;
  subFeatures?: readonly { label: string }[];
};

function formalCoreFeatureNodes(
  moduleId: string,
  features: readonly FormalCoreFeatureSpec[],
): ArchitectureTaxonomyNode[] {
  return features.map((feature) => {
    const featureId = `${moduleId}::${slug(feature.label)}`;
    return {
      id: featureId,
      label: feature.label,
      level: "feature" as const,
      kind: "core" as const,
      children: feature.subFeatures?.length
        ? feature.subFeatures.map((sub) => ({
            id: `${featureId}::${slug(sub.label)}`,
            label: sub.label,
            level: "sub-feature" as const,
            kind: "core" as const,
          }))
        : undefined,
    };
  });
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
  if (moduleId === EXECUTIVE_ASSISTANT_MODULE_ID) {
    return formalCoreFeatureNodes(EXECUTIVE_ASSISTANT_MODULE_ID, EXECUTIVE_ASSISTANT_CORE_FEATURES);
  }
  if (moduleId === FINANCIALS_MODULE_ID) {
    return formalCoreFeatureNodes(FINANCIALS_MODULE_ID, FINANCIALS_CORE_FEATURES);
  }
  if (moduleId === PROJECT_MANAGEMENT_MODULE_ID) {
    return formalCoreFeatureNodes(PROJECT_MANAGEMENT_MODULE_ID, PROJECT_MANAGEMENT_CORE_FEATURES);
  }
  if (moduleId === TECHNOLOGY_MANAGEMENT_MODULE_ID) {
    return formalCoreFeatureNodes(
      TECHNOLOGY_MANAGEMENT_MODULE_ID,
      TECHNOLOGY_MANAGEMENT_CORE_FEATURES,
    );
  }
  if (moduleId === HUMAN_RESOURCES_MODULE_ID) {
    return formalCoreFeatureNodes(HUMAN_RESOURCES_MODULE_ID, HUMAN_RESOURCES_CORE_FEATURES);
  }
  if (moduleId === "business-productivity") {
    return formalCoreFeatureNodes("business-productivity", BUSINESS_PRODUCTIVITY_CORE_FEATURES);
  }
  if (moduleId === SUPPORT_DESK_MODULE_ID) {
    return formalCoreFeatureNodes(SUPPORT_DESK_MODULE_ID, SUPPORT_DESK_CORE_FEATURES);
  }
  if (moduleId === ENGINEERING_MODULE_ID) {
    return formalCoreFeatureNodes(ENGINEERING_MODULE_ID, ENGINEERING_CORE_FEATURES);
  }
  if (moduleId === TRAINING_MODULE_ID) {
    return formalCoreFeatureNodes(TRAINING_MODULE_ID, TRAINING_CORE_FEATURES);
  }
  if (moduleId === QMS_MODULE_ID) {
    return formalCoreFeatureNodes(QMS_MODULE_ID, QMS_CORE_FEATURES);
  }
  if (moduleId === TOOLS_MODULE_ID) {
    return formalCoreFeatureNodes(TOOLS_MODULE_ID, TOOLS_CORE_FEATURES);
  }
  if (moduleId === EXTERNAL_CLIENT_ACCESS_MODULE_ID) {
    return formalCoreFeatureNodes(
      EXTERNAL_CLIENT_ACCESS_MODULE_ID,
      EXTERNAL_CLIENT_ACCESS_CORE_FEATURES,
    );
  }
  if (moduleId === SETTINGS_MODULE_ID) {
    return formalCoreFeatureNodes(SETTINGS_MODULE_ID, SETTINGS_CORE_FEATURES);
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
  enablement: LivingArchitectureEnablement;
  isAbhi?: boolean;
  isOmniTransit?: boolean;
};

/** Living Architecture workspace nodes — derived from UNIT311_WORKSPACE_UNIVERSE (not user access). */
const WORKSPACE_SPECS: readonly WorkspaceSpec[] = UNIT311_WORKSPACE_UNIVERSE.map((entry) => ({
  id: entry.architectureId,
  label: entry.label,
  enablement: entry.livingArchitectureEnablement,
  isAbhi: entry.isAbhi,
  isOmniTransit: entry.isOmniTransit,
}));

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

function workspaceCoreModules(
  spec: WorkspaceSpec,
  options?: WorkspaceArchitectureBuildOptions,
): ArchitectureTaxonomyNode[] {
  let moduleIds: readonly string[];
  if (isUnit311CentralArchitectureId(spec.id) && spec.enablement === "db-driven") {
    moduleIds = unit311CentralEnabledCoreModuleIds(options?.unit311SidebarConfig);
  } else if (spec.enablement === "saec-core") {
    moduleIds = [...SAEC_ENABLED_MODULES];
  } else if (spec.enablement === "full-core") {
    moduleIds = [...DEMO_ENABLED_MODULES];
  } else {
    moduleIds = [...WORKSPACE_CORE_MODULE_IDS];
  }

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
    if (spec.isOmniTransit && moduleId === OPERATIONS_MODULE_ID) {
      return {
        ...coreModuleNode(moduleId, label, omnitransitOperationsFeatures()),
        note: "OmniTransit: Installations custom feature under Operations",
      };
    }
    return coreModuleNode(moduleId, label);
  });
}

function workspaceNode(
  spec: WorkspaceSpec,
  options?: WorkspaceArchitectureBuildOptions,
): ArchitectureTaxonomyNode {
  const unit311Central = isUnit311CentralArchitectureId(spec.id);
  const coreGroupNote = unit311Central
    ? options?.unit311SidebarConfig
      ? "Enabled modules from workspace sidebar configuration (whoami / workspace_sidebar_modules)"
      : "Sidebar configuration not supplied — enablement-driven core module list is empty"
    : spec.enablement === "db-driven"
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
    : spec.isOmniTransit
      ? [saecInstallationsCustomFeature(`workspace::${spec.id}::custom`)]
      : [];

  const workspaceChildren: ArchitectureTaxonomyNode[] = [
    {
      id: `workspace::${spec.id}::core`,
      label: "CORE MODULES",
      level: "group",
      kind: "core",
      note: coreGroupNote,
      children: workspaceCoreModules(spec, options),
    },
    {
      id: `workspace::${spec.id}::custom`,
      label: "CUSTOM",
      level: "group",
      kind: "custom",
      note: customChildren.length ? undefined : "None identified",
      children: customChildren,
    },
  ];

  if (unit311Central) {
    workspaceChildren.push({
      id: `workspace::${spec.id}::platform-navigation`,
      label: "PLATFORM NAVIGATION",
      level: "group",
      kind: "structural",
      note:
        "Internal Central host surfaces on internal.unit311central.com — not Core Product catalogue modules",
      children: buildUnit311CentralPlatformNavigationNodes(spec.id),
    });
  }

  return {
    id: `workspace::${spec.id}`,
    label: spec.label,
    level: "workspace",
    kind: "core",
    children: workspaceChildren,
  };
}

/** Options when building Workspace Architecture (Unit311 Central uses live sidebar config). */
export type WorkspaceArchitectureBuildOptions = {
  unit311SidebarConfig?: WorkspaceSidebarConfigSnapshot | null;
};

/** VIEW 3 — Workspace Architecture. Optional single-workspace filter. */
export function buildWorkspaceArchitectureTaxonomy(
  workspaceFilter?: string | null,
  options?: WorkspaceArchitectureBuildOptions,
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
    children: specs.map((spec) => workspaceNode(spec, options)),
  };
}

/** Resolve a tree taxonomy by section slug (server entrypoint for the API). */
export type ArchitectureTaxonomyBuildOptions = {
  workspace?: string | null;
  unit311SidebarConfig?: WorkspaceSidebarConfigSnapshot | null;
};

export function buildArchitectureTaxonomy(
  sectionSlug: string,
  options?: ArchitectureTaxonomyBuildOptions,
): ArchitectureTaxonomyNode | null {
  switch (sectionSlug) {
    case "core-product":
      return buildCoreProductTaxonomy();
    case "custom-product":
      return buildCustomProductTaxonomy();
    case "workspace-architecture":
      return buildWorkspaceArchitectureTaxonomy(options?.workspace, {
        unit311SidebarConfig: options?.unit311SidebarConfig,
      });
    default:
      return null;
  }
}
