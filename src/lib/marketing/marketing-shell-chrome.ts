import type { MarketingWorkspaceKey } from "@/lib/marketing/workspace-context";

export type MarketingShellChrome = {
  brandLabel?: string;
  moduleLabel?: string;
  orgName: string;
};

/** Workspace-specific header chrome for shared Marketing & Events workspaces. */
export function resolveMarketingShellChrome(
  workspace: MarketingWorkspaceKey,
): MarketingShellChrome {
  switch (workspace) {
    case "demo":
      return { orgName: "Northstar Industrial Technologies" };
    case "abhi":
      return { brandLabel: "ABHI", moduleLabel: "Marketing & Events", orgName: "ABHI" };
    case "onwardair":
      return { brandLabel: "OnwardAir", moduleLabel: "Marketing & Events", orgName: "OnwardAir" };
    case "talanton":
      return {
        brandLabel: "Talanton Impact",
        moduleLabel: "Marketing & Stories",
        orgName: "Talanton Impact",
      };
    case "internal":
      return {
        brandLabel: "Unit311 Central",
        moduleLabel: "Marketing & Events",
        orgName: "Unit311 Central",
      };
    case "saec":
      return {
        brandLabel: "OmniTransit",
        moduleLabel: "Marketing & Events",
        orgName: "OmniTransit",
      };
    case "greendesert":
      return {
        brandLabel: "Green Desert",
        moduleLabel: "Marketing & Events",
        orgName: "Green Desert",
      };
    default:
      return { orgName: "Workspace" };
  }
}
