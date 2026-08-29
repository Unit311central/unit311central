/**
 * Top-level Unit311Central module catalogue for Workspaces provisioning.
 * Core product numbering 1–22; WOLF specialist extensions 23–27.
 * Workspaces (internal) is excluded from customer catalogue.
 */

import {
  buildCentralProductNavSections,
  flattenCentralProductLeaves,
} from "@/lib/platform-workspaces/central-product-nav";

export type WorkspaceSubModuleDefinition = {
  id: string;
  label: string;
  /** Platform view id when this function maps to a navigable view. */
  viewId?: string;
  /** Keys written to workspace_modules.module_key when provisioning. */
  moduleKeys: string[];
};

export type WorkspaceModuleCatalogueEntry = {
  number: number;
  id: string;
  label: string;
  subModules: WorkspaceSubModuleDefinition[];
};

function moduleKeysForView(viewId: string | undefined, moduleId: string): string[] {
  if (!viewId) return [];

  const view = viewId.toLowerCase();

  if (view === "home") return [];
  if (view === "executive-assistant") return ["executive-assistant"];

  if (view.includes("intelligence")) return ["strategy"];

  if (
    view === "clients" ||
    view === "clients-dashboard" ||
    view === "business-central-dashboard"
  ) {
    return ["clients"];
  }

  if (
    view === "crm" ||
    view === "crm-meetings" ||
    view === "sales-quotes" ||
    view === "client-onboarding" ||
    view === "potential-clients" ||
    view === "sales-management"
  ) {
    return ["crm"];
  }

  if (view === "management" || view === "content-studio" || view === "information-repository") {
    return ["strategy"];
  }

  if (view === "internal-work-packages") return ["file-explorer", "email-calendar-messaging"];

  if (view === "grants" || view.startsWith("projects")) return ["projects"];

  if (
    view === "financials" ||
    view === "general-ledger" ||
    view === "accounts-receivable" ||
    view === "accounts-payable" ||
    view === "expenses" ||
    view === "wise" ||
    view === "financial-reports" ||
    view.startsWith("finances-")
  ) {
    return ["financials"];
  }

  if (view.startsWith("fundraising") || view === "corporate-cap-table") return ["fundraising"];

  if (
    view.startsWith("board-") ||
    view === "board-pack" ||
    view === "corporate-risk-register"
  ) {
    return ["strategy"];
  }

  if (
    view.startsWith("corporate-") ||
    view === "office-locations" ||
    view === "corporate-dashboard"
  ) {
    return ["strategy"];
  }

  if (
    view === "operations-dashboard" ||
    view === "assets" ||
    view === "inventory-management" ||
    view === "procurement"
  ) {
    return ["assets-inventory"];
  }

  if (view === "logistics") return ["logistics"];

  if (view.startsWith("marketing-") || view === "oa-marketing-dashboard" || view === "portfolio-stories") {
    return ["social"];
  }

  if (view.startsWith("technology-") || view === "technology") return ["engineering-rnd"];

  if (view === "hr-recruitment") return ["careers"];

  if (view.startsWith("hr") || view === "hr") return ["hr"];

  if (
    view.startsWith("files-") ||
    view === "productivity-dashboard" ||
    view === "whiteboard"
  ) {
    return ["file-explorer"];
  }

  if (
    view === "info-email" ||
    view === "calendar" ||
    view === "messaging" ||
    view === "communications"
  ) {
    return ["email-calendar-messaging"];
  }

  if (view === "social") return ["social"];

  if (view.startsWith("support")) return ["support"];

  if (view.startsWith("engineering")) return ["engineering-rnd"];

  if (
    view.startsWith("training") ||
    view === "course-builder" ||
    view === "qms-training"
  ) {
    return ["training"];
  }

  if (view.startsWith("qms") || view === "quality-management") return ["quality-management"];

  if (view === "website-management") return ["website-management"];
  if (view === "integrations") return ["users"];
  if (view === "unit311-support") return ["users"];
  if (view === "testing") return ["testing"];
  if (view === "telemetry") return ["telemetry"];
  if (view === "users" || view === "users-external" || view === "external-client-access") {
    return ["users"];
  }

  if (view === "profile" ||
    view === "settings" ||
    view === "billing" ||
    view === "appearance"
  ) {
    return ["profiles"];
  }

  if (view.startsWith("wolf-")) {
    return [view];
  }

  if (view.startsWith("pailex-")) {
    if (view.startsWith("pailex-animals")) return ["wolf-animals"];
    if (view.startsWith("pailex-containment")) return ["wolf-containment"];
    if (view.startsWith("pailex-environment")) return ["wolf-environment"];
    if (view.startsWith("pailex-fleet")) return ["wolf-fleet"];
    if (view.startsWith("pailex-drone")) return ["wolf-drone-operations"];
    if (view.startsWith("pailex-support")) return ["support"];
    if (view.startsWith("pailex-training")) return ["training"];
    if (view.startsWith("pailex-projects") || view.startsWith("pailex-documents")) return ["projects"];
    if (view === "pailex-dashboard") return [];
    return ["home"];
  }

  // Module-level fallback for any future central views in this module family.
  const moduleFallbacks: Record<string, string[]> = {
    "business-central": ["clients", "crm"],
    "sales-management": ["crm"],
    financials: ["financials"],
    fundraising: ["fundraising"],
    board: ["strategy"],
    "corporate-information": ["strategy"],
    operations: ["assets-inventory"],
    "marketing-events": ["social"],
    "technology-management": ["engineering-rnd"],
    "human-resources": ["hr"],
    "business-productivity": ["file-explorer", "email-calendar-messaging"],
    "support-desk": ["support"],
    "project-management": ["projects"],
    engineering: ["engineering-rnd"],
    training: ["training"],
    qms: ["quality-management"],
    tools: ["users"],
    "external-client-access": ["users"],
    settings: ["profiles"],
    intelligence: ["strategy"],
    "wolf-animals": ["wolf-animals"],
    "wolf-containment": ["wolf-containment"],
    "wolf-environment": ["wolf-environment"],
    "wolf-drone-operations": ["wolf-drone-operations"],
    "wolf-fleet": ["wolf-fleet"],
  };

  return moduleFallbacks[moduleId] ?? [];
}

function augmentIntelligenceCatalogueSubModules(
  entries: WorkspaceModuleCatalogueEntry[],
): WorkspaceModuleCatalogueEntry[] {
  return entries.map((entry) => {
    if (entry.id !== "intelligence") return entry;
    const supplementary: WorkspaceSubModuleDefinition[] = [
      {
        id: "member-intelligence",
        label: "Member Intelligence",
        viewId: "member-intelligence",
        moduleKeys: ["strategy"],
      },
      {
        id: "regulatory-dashboard",
        label: "Dashboard",
        viewId: "regulatory-dashboard",
        moduleKeys: ["strategy"],
      },
      {
        id: "regulatory-updates",
        label: "Regulatory Updates",
        viewId: "regulatory-updates",
        moduleKeys: ["strategy"],
      },
      {
        id: "regulatory-impact",
        label: "Impact Assessments",
        viewId: "regulatory-impact",
        moduleKeys: ["strategy"],
      },
      {
        id: "regulatory-alerts",
        label: "Member Alerts",
        viewId: "regulatory-alerts",
        moduleKeys: ["strategy"],
      },
    ];
    return {
      ...entry,
      subModules: [...entry.subModules, ...supplementary],
    };
  });
}

function buildWorkspaceModuleCatalogue(): WorkspaceModuleCatalogueEntry[] {
  const base = buildCentralProductNavSections().map((spec) => ({
    number: spec.number,
    id: spec.id,
    label: spec.label,
    subModules: flattenCentralProductLeaves(spec.section.items).map((leaf) => ({
      id: leaf.id,
      label: leaf.label,
      viewId: leaf.viewId,
      moduleKeys: moduleKeysForView(leaf.viewId, spec.id),
    })),
  }));
  return augmentIntelligenceCatalogueSubModules(base);
}

export const WORKSPACE_MODULE_CATALOGUE: readonly WorkspaceModuleCatalogueEntry[] =
  buildWorkspaceModuleCatalogue();

export const WORKSPACE_MODULE_IDS = WORKSPACE_MODULE_CATALOGUE.map((entry) => entry.id);

/** Original 22-module central catalogue (excludes WOLF specialist extensions). */
export const WORKSPACE_CORE_MODULE_IDS = WORKSPACE_MODULE_CATALOGUE.filter(
  (entry) => !entry.id.startsWith("wolf-"),
).map((entry) => entry.id);

export const WORKSPACE_CORE_MODULE_COUNT = WORKSPACE_CORE_MODULE_IDS.length;

export const WORKSPACE_PROVISIONING_FUNCTION_COUNT = WORKSPACE_MODULE_CATALOGUE.reduce(
  (total, entry) => total + entry.subModules.length,
  0,
);

export function getWorkspaceModuleEntry(moduleId: string): WorkspaceModuleCatalogueEntry | null {
  return WORKSPACE_MODULE_CATALOGUE.find((entry) => entry.id === moduleId) ?? null;
}

export function subModuleKey(moduleId: string, subModuleId: string): string {
  return `${moduleId}:${subModuleId}`;
}

export function parseSubModuleKey(key: string): { moduleId: string; subModuleId: string } | null {
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  return { moduleId: key.slice(0, idx), subModuleId: key.slice(idx + 1) };
}

export function defaultEnabledModules(): string[] {
  return WORKSPACE_MODULE_CATALOGUE.filter((entry) =>
    ["home", "executive-assistant", "business-central", "financials", "settings"].includes(
      entry.id,
    ),
  ).map((entry) => entry.id);
}

export function defaultEnabledSubModules(moduleIds: readonly string[]): string[] {
  const keys: string[] = [];
  for (const moduleId of moduleIds) {
    const entry = getWorkspaceModuleEntry(moduleId);
    if (!entry) continue;
    for (const sub of entry.subModules) {
      keys.push(subModuleKey(moduleId, sub.id));
    }
  }
  return keys;
}

/** All catalogue modules and their sub-modules (for Workspaces wizard “select all”). */
export function allCatalogueModuleSelections(): {
  enabledModules: string[];
  enabledSubModules: string[];
} {
  const enabledModules = [...WORKSPACE_MODULE_IDS];
  return {
    enabledModules,
    enabledSubModules: defaultEnabledSubModules(enabledModules),
  };
}

/** Resolve workspace_modules.module_key values from wizard selections. */
export function resolveProvisioningModuleKeys(
  enabledModules: readonly string[],
  enabledSubModules: readonly string[],
): string[] {
  const keys = new Set<string>();
  const enabledModuleSet = new Set(enabledModules);

  for (const subKey of enabledSubModules) {
    const parsed = parseSubModuleKey(subKey);
    if (!parsed || !enabledModuleSet.has(parsed.moduleId)) continue;
    const entry = getWorkspaceModuleEntry(parsed.moduleId);
    const sub = entry?.subModules.find((item) => item.id === parsed.subModuleId);
    if (!sub) continue;
    for (const moduleKey of sub.moduleKeys) keys.add(moduleKey);
  }

  return [...keys];
}

export function countEnabledModules(
  enabledModules: readonly string[],
  enabledSubModules: readonly string[],
): number {
  return enabledModules.length + enabledSubModules.length;
}

export function syncModuleSelection(
  moduleId: string,
  enabledModules: readonly string[],
  enabledSubModules: readonly string[],
  subModuleId: string,
  checked: boolean,
): { enabledModules: string[]; enabledSubModules: string[] } {
  const entry = getWorkspaceModuleEntry(moduleId);
  if (!entry) {
    return { enabledModules: [...enabledModules], enabledSubModules: [...enabledSubModules] };
  }

  const key = subModuleKey(moduleId, subModuleId);
  let nextSubModules = checked
    ? enabledSubModules.includes(key)
      ? [...enabledSubModules]
      : [...enabledSubModules, key]
    : enabledSubModules.filter((item) => item !== key);

  const moduleSubKeys = entry.subModules.map((sub) => subModuleKey(moduleId, sub.id));
  const anySelected = moduleSubKeys.some((subKey) => nextSubModules.includes(subKey));

  let nextModules = [...enabledModules];
  if (anySelected && !nextModules.includes(moduleId)) {
    nextModules.push(moduleId);
  }
  if (!anySelected) {
    nextModules = nextModules.filter((id) => id !== moduleId);
  }

  return { enabledModules: nextModules, enabledSubModules: nextSubModules };
}
