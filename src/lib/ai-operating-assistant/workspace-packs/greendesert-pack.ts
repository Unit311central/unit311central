/**
 * Green Desert workspace EA pack — board deck generation and central EA defaults.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import { GREENDESERT_SLUG, isBrowserGreenDesertSurface, isGreenDesertSlug } from "@/lib/greendesert-surface";

import { packToolRoute } from "./orchestration-helpers";
import { EA_DEFAULT_SYNTHESIS_GUIDANCE } from "./synthesis-guidance";
import type { EaWorkspacePack } from "./types";

const GREENDESERT_TOOLS_HINT = `
Green Desert — modular reactor deployment workspace. Reporting currency is USD.
Use Saudi / Middle East deployment language (Jeddah pilot, Riyadh HQ, Vision 2030 agritech).
Document tools: boardpack.generate — Green Desert board deck PDF (reactor programme, Jeddah pilot, Series A, cash runway).
For module navigation use searchApplications / listPlatformModules.`;

export const greendesertWorkspacePack: EaWorkspacePack = {
  id: "greendesert",
  label: "Green Desert",
  matchesSlug: isGreenDesertSlug,
  matchesBrowserSurface: isBrowserGreenDesertSurface,
  clientSupportsBoardPack: true,
  navProvider: (slug) => {
    const normalized = String(slug ?? GREENDESERT_SLUG).trim().toLowerCase();
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
    systemHint: GREENDESERT_TOOLS_HINT,
    reportingCurrency: "USD",
  }),
  synthesisRules: [
    {
      id: "greendesert-query-business",
      matches: (ctx) => ctx.toolName === "queryBusiness",
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
    {
      id: "greendesert-boardpack",
      matches: (ctx) => ctx.toolName === "boardpack.generate",
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
  ],
  defaultSuggestedPrompts: [
    "Build me a board deck PDF",
    "What is our cash runway?",
    "Summarise the Jeddah pilot status",
    "Where is the file explorer?",
  ],
  intentResolvers: [
    ({ message }) => {
      const boardPack = resolveAbhiBoardPackIntent(message);
      if (boardPack) {
        return {
          ...packToolRoute({
            ...boardPack,
            reason: "Green Desert board deck generation",
          }),
          skipSynthesis: true,
        };
      }
      return null;
    },
  ],
};
