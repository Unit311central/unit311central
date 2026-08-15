/**
 * Extended EaWorkspacePack contracts — canonical Unit311 EA centralisation.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import type { BusinessSnapshotDomain } from "@/lib/ai-operating-assistant/business-snapshot-service";
import type { DailyExecutiveBrief } from "@/lib/ai-operating-assistant/executive-types";
import type {
  AssistantBusinessContext,
  AssistantChatMessage,
  AssistantToolDefinition,
} from "@/lib/ai-operating-assistant/types";
import type { HrCandidate } from "@/lib/hr-recruitment-data";
import type { HrLeaveRequest } from "@/lib/hr-leave-data";
import type { HrPerformanceReview } from "@/lib/hr-performance-data";
import type { HrVacancy } from "@/lib/hr-recruitment-data";
import type { InventoryMockState } from "@/lib/inventory-mock-store";
import type { AssistantPdfBrand } from "@/lib/ai-operating-assistant/pdf-brand";
import type { ExecutiveAssistantPageContext } from "@/lib/executive-assistant-ui";

import type { EaPackToolHandler } from "./handlers-registry";

export type EaIntentResolverContext = {
  message: string;
  business: AssistantBusinessContext;
  history: AssistantChatMessage[];
};

export type EaIntentResolver = (
  ctx: EaIntentResolverContext,
) => OrchestrationRoute | null | Promise<OrchestrationRoute | null>;

export type EaPromptExtensionsInput = {
  context: AssistantBusinessContext;
};

export type EaPromptExtensions = {
  /** When set, replaces generic core instructions for this workspace pack. */
  coreInstructions?: string;
  systemHint?: string;
  reportingCurrency?: string;
};

export type EaSynthesisRule = {
  id: string;
  matches: (ctx: EaSynthesisContext) => boolean;
  guidance?: string | ((ctx: EaSynthesisContext) => string);
};

export type EaArtifactBranding = {
  workspacePrefix: (input: {
    slug: string | null | undefined;
    organisationName: string | null | undefined;
  }) => string;
};

export type EaOperationalDataProvider = {
  loadLeaveRequests?: (slug?: string | null) => HrLeaveRequest[];
  loadPerformanceReviews?: (slug?: string | null) => HrPerformanceReview[];
  loadVacancies?: (slug?: string | null) => HrVacancy[];
  loadCandidates?: (slug?: string | null) => HrCandidate[];
  loadInventory?: (slug?: string | null) => InventoryMockState;
};

export type EaBoardPackGeneratedArtifacts = {
  pdfBytes: Uint8Array;
  pptxBytes: Uint8Array;
  pdfFilename: string;
  pptxFilename: string;
  packName: string;
  meetingDate: string;
  status: string;
  folderPath?: string;
  pageSummaries?: string[];
  sourceTags: string[];
  successMessage: string;
};

export type EaBoardPackStage = string | { id: string; label: string };

export type EaBoardPackConfig = {
  supportsBoardPack: boolean;
  stages: readonly EaBoardPackStage[];
  buildPackData: (meetingDate?: string) => unknown;
  loadLogoDataUrl: () => Promise<string | null>;
  generateArtifacts: (
    data: unknown,
    logoDataUrl: string | null,
    meetingDate?: string,
  ) => Promise<EaBoardPackGeneratedArtifacts>;
};

export type EaPdfBrandingDelegate = {
  resolveBrand: (
    workspaceSlug?: string | null,
    workspaceName?: string | null,
  ) => Promise<AssistantPdfBrand>;
};

export type EaProactiveInsightMapping = {
  resolveSnapshotDomain?: (
    raw: string | null,
    workspaceSlug: string | null | undefined,
    defaultResolve: (raw: string | null) => BusinessSnapshotDomain,
  ) => BusinessSnapshotDomain;
};

export type EaBusinessSnapshotEnricher = (
  context: AssistantBusinessContext,
  domain: BusinessSnapshotDomain,
  snapshot: Record<string, unknown>,
) => Record<string, unknown> | Promise<Record<string, unknown>>;

export type EaDailyBriefBuilder = (
  context: AssistantBusinessContext,
) => Promise<DailyExecutiveBrief>;

export type EaSuggestedPromptsByView = Partial<
  Record<string, ExecutiveAssistantPageContext | string[]>
>;

export type EaOrgStatePack = {
  requestField: string;
  label: string;
  matchesBrowserSurface?: () => boolean;
  collectClientState?: () => Record<string, unknown> | null;
};

export type EaWorkspacePack = {
  id: string;
  label: string;
  matchesSlug: (slug: string | null | undefined) => boolean;
  matchesBrowserSurface?: () => boolean;
  toolDefinitions?: AssistantToolDefinition[];
  toolHandlers?: Record<string, EaPackToolHandler>;
  intentResolvers?: EaIntentResolver[];
  navProvider?: (slug: string | null | undefined) => readonly InternalNavSection[];
  promptExtensions?: (input: EaPromptExtensionsInput) => EaPromptExtensions | null;
  synthesisRules?: EaSynthesisRule[];
  orgState?: EaOrgStatePack;
  artifactBranding?: EaArtifactBranding;
  operationalDataProvider?: EaOperationalDataProvider;
  boardPackConfig?: EaBoardPackConfig;
  pdfBranding?: EaPdfBrandingDelegate;
  suggestedPromptsByView?: EaSuggestedPromptsByView;
  defaultSuggestedPrompts?: readonly string[];
  proactiveInsightMapping?: EaProactiveInsightMapping;
  businessSnapshotEnricher?: EaBusinessSnapshotEnricher;
  dailyBriefBuilder?: EaDailyBriefBuilder;
  unsupportedWriteMessage?: (registeredActions: string) => string;
  catalogueDescriptionTransform?: (description: string) => string;
  /** Client UI hint — server board-pack config remains authoritative. */
  clientSupportsBoardPack?: boolean;
};

export const EA_PROVISIONING_REQUIRED_PACK_IDS = [
  "abhi",
  "talanton",
  "onwardair",
  "internal",
  "demo",
] as const;
