/**
 * Central registry for EaWorkspacePack instances.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import type { AssistantToolDefinition } from "@/lib/ai-operating-assistant/types";

import type {
  EaIntentResolverContext,
  EaPromptExtensions,
  EaPromptExtensionsInput,
  EaWorkspacePack,
} from "./types";

const packs: EaWorkspacePack[] = [];

export function registerEaWorkspacePack(pack: EaWorkspacePack): void {
  if (packs.some((existing) => existing.id === pack.id)) {
    return;
  }
  packs.push(pack);
}

export function listEaWorkspacePacks(): readonly EaWorkspacePack[] {
  return packs;
}

export function getEaWorkspacePackForSlug(
  slug: string | null | undefined,
): EaWorkspacePack | null {
  const normalized = slug?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  return packs.find((pack) => pack.matchesSlug(normalized)) ?? null;
}

export function getEaWorkspacePackToolDefinitions(
  slug: string | null | undefined,
): AssistantToolDefinition[] {
  const pack = getEaWorkspacePackForSlug(slug);
  return pack?.toolDefinitions ? [...pack.toolDefinitions] : [];
}

export async function resolveEaWorkspacePackOrchestration(
  ctx: EaIntentResolverContext,
): Promise<OrchestrationRoute | null> {
  const pack = getEaWorkspacePackForSlug(ctx.business.workspace.slug);
  if (!pack?.intentResolvers?.length) return null;

  for (const resolver of pack.intentResolvers) {
    const route = await resolver(ctx);
    if (route) return route;
  }
  return null;
}

export function getEaWorkspacePackNavSections(
  slug: string | null | undefined,
): readonly InternalNavSection[] | null {
  const pack = getEaWorkspacePackForSlug(slug);
  if (!pack?.navProvider) return null;
  return pack.navProvider(slug);
}

export function getEaWorkspacePackPromptExtensions(
  input: EaPromptExtensionsInput,
): EaPromptExtensions | null {
  const pack = getEaWorkspacePackForSlug(input.context.workspace.slug);
  if (!pack?.promptExtensions) return null;
  return pack.promptExtensions(input);
}

export function shouldEaWorkspacePackSynthesize(ctx: EaSynthesisContext): boolean | null {
  const pack = getEaWorkspacePackForSlug(ctx.workspaceSlug);
  if (!pack?.synthesisRules?.length) return null;
  for (const rule of pack.synthesisRules) {
    if (rule.matches(ctx)) return true;
  }
  return false;
}
