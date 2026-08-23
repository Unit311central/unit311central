import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import type { InternalOperationsView } from "@/lib/internal-operations-data";

export type FundraisingSurfaceKind = "demo" | "onwardair" | "customer";

export const FUNDRAISING_MODULE_VIEWS: ReadonlySet<InternalOperationsView> = new Set([
  "fundraising-dashboard",
  "fundraising-investors",
  "fundraising-cap-table",
  "fundraising-pipeline",
  "fundraising-meetings",
  "fundraising-pitch-decks",
  "fundraising-data-rooms",
]);

export function resolveFundraisingSurfaceKind(): FundraisingSurfaceKind {
  if (isBrowserDemoSurface()) return "demo";
  if (isBrowserOnwardAirSurface()) return "onwardair";
  return "customer";
}

export function isFundraisingModuleView(view: string | null | undefined): view is InternalOperationsView {
  return FUNDRAISING_MODULE_VIEWS.has(view as InternalOperationsView);
}

export function isFundraisingModuleEnabled(enabledModules: readonly string[] | null | undefined): boolean {
  if (!enabledModules?.length) return true;
  return enabledModules.includes("fundraising");
}
