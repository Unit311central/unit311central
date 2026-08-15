/**
 * Central registry for EaWorkspacePack instances.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import { resolveIntelligenceEaOrchestration } from "@/lib/intelligence/ea-tools";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import type { BusinessSnapshotDomain } from "@/lib/ai-operating-assistant/business-snapshot-service";
import type { DailyExecutiveBrief } from "@/lib/ai-operating-assistant/executive-types";
import type { AssistantPdfBrand } from "@/lib/ai-operating-assistant/pdf-brand";
import type { AssistantBusinessContext, AssistantToolDefinition } from "@/lib/ai-operating-assistant/types";
import type { HrCandidate } from "@/lib/hr-recruitment-data";
import type { HrLeaveRequest } from "@/lib/hr-leave-data";
import type { HrPerformanceReview } from "@/lib/hr-performance-data";
import type { HrVacancy } from "@/lib/hr-recruitment-data";
import type { InventoryMockState } from "@/lib/inventory-mock-store";

import {
  getEaClientWorkspacePackForSlug,
  listEaClientWorkspacePacks,
  registerEaClientWorkspacePack,
} from "./registry-client";
import {
  defaultLoadCandidates,
  defaultLoadInventory,
  defaultLoadLeaveRequests,
  defaultLoadPerformanceReviews,
  defaultLoadVacancies,
} from "./operational-data-default";
import { defaultResolveSnapshotDomain } from "./proactive-snapshot-domain";
import { guidanceForToolName } from "./synthesis-guidance";
import type {
  EaBoardPackConfig,
  EaIntentResolverContext,
  EaPromptExtensions,
  EaPromptExtensionsInput,
  EaWorkspacePack,
} from "./types";

export function registerEaWorkspacePack(pack: EaWorkspacePack): void {
  registerEaClientWorkspacePack(pack);
}

export function listEaWorkspacePacks(): readonly EaWorkspacePack[] {
  return listEaClientWorkspacePacks();
}

export function getEaWorkspacePackForSlug(
  slug: string | null | undefined,
): EaWorkspacePack | null {
  return getEaClientWorkspacePackForSlug(slug);
}

export { resolveEaSuggestedPromptsFromPack } from "./registry-client";

export function getEaWorkspacePackToolDefinitions(
  slug: string | null | undefined,
): AssistantToolDefinition[] {
  const pack = getEaWorkspacePackForSlug(slug);
  if (!pack) return [];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SERVER_PACK_TOOL_DEFINITIONS } = require("./server-pack-tools") as typeof import("./server-pack-tools");
  const tools = SERVER_PACK_TOOL_DEFINITIONS[pack.id];
  return tools ? [...tools] : [];
}

export async function resolveEaWorkspacePackOrchestration(
  ctx: EaIntentResolverContext,
): Promise<OrchestrationRoute | null> {
  const intelligenceRoute = await resolveIntelligenceEaOrchestration(ctx);
  if (intelligenceRoute) return intelligenceRoute;

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

export function shouldEaWorkspacePackSynthesize(ctx: EaSynthesisContext): boolean {
  const pack = getEaWorkspacePackForSlug(ctx.workspaceSlug);
  if (!pack?.synthesisRules?.length) return false;
  return pack.synthesisRules.some((rule) => rule.matches(ctx));
}

export function getEaWorkspacePackSynthesisGuidance(ctx: EaSynthesisContext): string {
  const pack = getEaWorkspacePackForSlug(ctx.workspaceSlug);
  if (pack?.synthesisRules?.length) {
    for (const rule of pack.synthesisRules) {
      if (rule.matches(ctx)) {
        if (!rule.guidance) return guidanceForToolName(ctx.toolName, ctx.toolArgs);
        return typeof rule.guidance === "function" ? rule.guidance(ctx) : rule.guidance;
      }
    }
  }
  return guidanceForToolName(ctx.toolName, ctx.toolArgs);
}

export function getEaWorkspacePackBoardPackConfig(
  slug: string | null | undefined,
): EaBoardPackConfig | null {
  const pack = getEaWorkspacePackForSlug(slug);
  if (!pack) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getServerBoardPackConfigForPackId } = require("./server-pack-config") as typeof import("./server-pack-config");
  return getServerBoardPackConfigForPackId(pack.id);
}

export function loadWorkspaceOperationalData(
  slug: string | null | undefined,
  field: keyof NonNullable<EaWorkspacePack["operationalDataProvider"]>,
): HrLeaveRequest[] | HrPerformanceReview[] | HrVacancy[] | HrCandidate[] | InventoryMockState {
  const pack = getEaWorkspacePackForSlug(slug);
  const provider = pack?.operationalDataProvider;
  switch (field) {
    case "loadLeaveRequests":
      return provider?.loadLeaveRequests?.(slug) ?? defaultLoadLeaveRequests(slug);
    case "loadPerformanceReviews":
      return provider?.loadPerformanceReviews?.(slug) ?? defaultLoadPerformanceReviews(slug);
    case "loadVacancies":
      return provider?.loadVacancies?.(slug) ?? defaultLoadVacancies(slug);
    case "loadCandidates":
      return provider?.loadCandidates?.(slug) ?? defaultLoadCandidates(slug);
    case "loadInventory":
      return provider?.loadInventory?.(slug) ?? defaultLoadInventory(slug);
    default:
      return defaultLoadLeaveRequests(slug);
  }
}

export function resolveEaWorkspacePackSnapshotDomain(
  raw: string | null,
  workspaceSlug?: string | null,
): BusinessSnapshotDomain {
  const pack = getEaWorkspacePackForSlug(workspaceSlug);
  const mapper = pack?.proactiveInsightMapping?.resolveSnapshotDomain;
  if (mapper) {
    return mapper(raw, workspaceSlug, defaultResolveSnapshotDomain);
  }
  return defaultResolveSnapshotDomain(raw);
}

export async function enrichEaWorkspaceBusinessSnapshot(
  context: AssistantBusinessContext,
  domain: BusinessSnapshotDomain,
  snapshot: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const pack = getEaWorkspacePackForSlug(context.workspace.slug);
  if (!pack) return snapshot;
  const { enrichServerBusinessSnapshotForPackId } = await import("./server-pack-config");
  return enrichServerBusinessSnapshotForPackId(pack.id, context, domain, snapshot);
}

export async function buildEaWorkspaceDailyBrief(
  context: AssistantBusinessContext,
): Promise<DailyExecutiveBrief | null> {
  const pack = getEaWorkspacePackForSlug(context.workspace.slug);
  if (!pack) return null;
  const { buildServerDailyBriefForPackId } = await import("./server-pack-config");
  return buildServerDailyBriefForPackId(pack.id, context);
}

export async function resolveEaWorkspacePdfBrand(
  workspaceSlug?: string | null,
  workspaceName?: string | null,
): Promise<AssistantPdfBrand | null> {
  const pack = getEaWorkspacePackForSlug(workspaceSlug);
  if (!pack) return null;
  const { resolveServerPdfBrandForPackId } =
    await import("./server-pack-config");
  return resolveServerPdfBrandForPackId(pack.id, workspaceSlug, workspaceName);
}

export function getEaWorkspaceUnsupportedWriteMessage(
  slug: string | null | undefined,
  registered: string,
): string | null {
  const pack = getEaWorkspacePackForSlug(slug);
  return pack?.unsupportedWriteMessage?.(registered) ?? null;
}
