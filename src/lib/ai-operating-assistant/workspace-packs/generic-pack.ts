/**
 * Generic workspace EA pack — automatic Central EA for new/unknown workspaces.
 */

import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import type { EaWorkspacePack } from "./types";
import { EA_DEFAULT_SYNTHESIS_GUIDANCE } from "./synthesis-guidance";

function matchesAnyWorkspace(slug: string | null | undefined): boolean {
  return Boolean(String(slug ?? "").trim());
}

export const genericWorkspacePack: EaWorkspacePack = {
  id: "generic",
  label: "Standard Workspace",
  matchesSlug: matchesAnyWorkspace,
  navProvider: (slug) => {
    const normalized = String(slug ?? "").trim().toLowerCase();
    const enablement = resolveWorkspaceNavEnablement({
      workspaceSlug: normalized,
      workspaceType: "Customer",
    });
    return resolveWorkspaceNavBaseSections({
      workspaceSlug: normalized,
      workspaceType: "Customer",
      enablement,
    });
  },
  promptExtensions: () => ({
    systemHint: EA_DEFAULT_SYNTHESIS_GUIDANCE,
  }),
  synthesisRules: [
    {
      id: "generic-query-business",
      matches: (ctx) => ctx.toolName === "queryBusiness",
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
  ],
  defaultSuggestedPrompts: [
    "What is our bank balance?",
    "How many employees do we have?",
    "What are our overdue invoices?",
    "Create an invoice for a client",
  ],
};
