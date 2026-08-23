import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { brandFromWorkspaceClaim } from "@/lib/workspace-brand";

export type BusinessCentralDashboardVariant = "northstar" | "onwardair" | "workspace";

export function resolveBusinessCentralDashboardVariant(input: {
  demoSurface: boolean;
  onwardAirSurface: boolean;
  workspaceSlug?: string | null;
}): BusinessCentralDashboardVariant {
  if (input.demoSurface) return "northstar";
  if (input.onwardAirSurface || isOnwardAirSlug(input.workspaceSlug)) return "onwardair";
  return "workspace";
}

/** Eyebrow line above the Business Central dashboard title. */
export function buildBusinessCentralDashboardEyebrow(input: {
  variant: BusinessCentralDashboardVariant;
  workspaceSlug?: string | null;
  workspaceName?: string | null;
}): string {
  if (input.variant === "northstar") return "Northstar · Business Central";
  if (input.variant === "onwardair") return "OnwardAir · Business Central";
  const brand = brandFromWorkspaceClaim({
    slug: input.workspaceSlug,
    name: input.workspaceName,
  });
  return `${brand.displayName} · Business Central`;
}
