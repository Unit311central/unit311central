import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserNorthstarDemoTenancy } from "@/lib/demo-enterprise/workspace-tenancy-surface";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import { isOnwardAirSlug, isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import { brandFromWorkspaceClaim } from "@/lib/workspace-brand";

export type FundraisingSurfaceKind = "demo" | "onwardair" | "workspace";

export const FUNDRAISING_MODULE_VIEWS: ReadonlySet<InternalOperationsView> = new Set([
  "fundraising-dashboard",
  "fundraising-investors",
  "fundraising-cap-table",
  "fundraising-pipeline",
  "fundraising-meetings",
  "fundraising-pitch-decks",
  "fundraising-data-rooms",
  "grants",
]);

export function resolveFundraisingSurfaceKind(
  workspaceSlug?: string | null,
): FundraisingSurfaceKind {
  if (isDemoWorkspaceSlug(workspaceSlug)) return "demo";
  if (workspaceSlug && isOnwardAirSlug(workspaceSlug)) return "onwardair";
  if (workspaceSlug) return "workspace";
  if (isBrowserNorthstarDemoTenancy() || isBrowserDemoSurface()) return "demo";
  if (isBrowserOnwardAirSurface()) return "onwardair";
  return "workspace";
}

/** Eyebrow line above workspace Fundraising pages (customer tenants). */
export function buildFundraisingWorkspaceEyebrow(input: {
  workspaceSlug?: string | null;
  workspaceName?: string | null;
}): string {
  const brand = brandFromWorkspaceClaim({
    slug: input.workspaceSlug,
    name: input.workspaceName,
  });
  return `${brand.displayName} · Fundraising`;
}

export function isFundraisingModuleView(view: string | null | undefined): view is InternalOperationsView {
  return FUNDRAISING_MODULE_VIEWS.has(view as InternalOperationsView);
}

export function isFundraisingModuleEnabled(
  enabledModules: readonly string[] | null | undefined,
  options?: {
    workspaceSlug?: string | null;
    workspaceType?: string | null;
    enabledSubModules?: readonly string[] | null;
  },
): boolean {
  const resolved = resolveWorkspaceNavEnablement({
    workspaceSlug: options?.workspaceSlug,
    workspaceType: options?.workspaceType,
    enabledModules,
    enabledSubModules: options?.enabledSubModules,
    allowDefaultFallback: true,
  });
  if (resolved.enabledModules.includes("fundraising")) return true;
  if (!enabledModules?.length) return true;
  return enabledModules.includes("fundraising");
}
