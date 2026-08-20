/**
 * Central Application Semantic Model — machine-readable architecture for EA discovery.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import type { EaFormattedCapabilityAnswer, EaReadCapabilityPermission } from "@/lib/ai-operating-assistant/capabilities/types";

/** Stable canonical module id — extensible beyond current L1 count. */
export type CanonicalModuleId = string;

export type CanonicalDomainId = string;

export type EaCapabilityKind = "read" | "write" | "composite" | "content" | "report";

export type EaExecutionStrategy = "deterministic" | "tool_then_format" | "multi_tool" | "reasoning_required";

export type EaSemanticCapabilityBinding = {
  id: string;
  kind: EaCapabilityKind;
  /** Canonical module(s) this capability belongs to */
  moduleIds: CanonicalModuleId[];
  domainId: CanonicalDomainId;
  functionalAreaId?: string;
  entity?: string;
  description: string;
  /** Token/phrase metadata for semantic matching — not per-question handlers */
  keywords: string[];
  phrases?: string[];
  negativeKeywords?: string[];
  permissions: EaReadCapabilityPermission[];
  /** Workspace slug allow-list; omit = all workspaces where modules enabled */
  workspaceAllowList?: string[];
  requiredModules?: CanonicalModuleId[];
  tool?: string;
  actionId?: string;
  buildArgs?: (input: {
    message: string;
    normalized: string;
    business: AssistantBusinessContext;
  }) => Record<string, unknown>;
  executionStrategy: EaExecutionStrategy;
  deterministic: boolean;
  skipSynthesis: boolean;
  formatAnswer?: (
    result: AssistantToolResult,
    input: { message: string; business: AssistantBusinessContext },
  ) => EaFormattedCapabilityAnswer | null;
  /** Composite: ordered tool steps */
  compositeSteps?: Array<{
    tool: string;
    buildArgs: (input: {
      message: string;
      normalized: string;
      business: AssistantBusinessContext;
      priorResults: AssistantToolResult[];
    }) => Record<string, unknown>;
  }>;
  compositeFormat?: (
    results: AssistantToolResult[],
    input: { message: string; business: AssistantBusinessContext },
  ) => EaFormattedCapabilityAnswer;
  supportsVisualisation?: boolean;
  supportsReporting?: boolean;
  crossModule?: boolean;
};

export type CanonicalModuleDefinition = {
  id: CanonicalModuleId;
  label: string;
  description?: string;
  optional?: boolean;
  /** Nav L1 label variants that map to this module */
  navLabelAliases: string[];
};

export type FunctionalAreaBinding = {
  viewId: string;
  moduleId: CanonicalModuleId;
  domainId: CanonicalDomainId;
  label: string;
  keywords?: string[];
};

export type WorkspaceEnablementSnapshot = {
  workspaceSlug: string;
  enabledModuleIds: Set<CanonicalModuleId>;
  enabledViewIds: Set<string>;
  enabledDomainIds: Set<CanonicalDomainId>;
};

export type EaSemanticMatch = {
  binding: EaSemanticCapabilityBinding;
  score: number;
  strategy: EaExecutionStrategy;
};

export type EaSemanticDenied = {
  denied: true;
  reason: "permission" | "cross_workspace" | "module_disabled" | "workspace_disabled";
  message: string;
};

export type EaEvidenceSynthesisKind =
  | "investigation"
  | "comparative"
  | "composite_chart"
  | "board_report";

export type EaEvidencePlan = {
  capabilityIds: string[];
  tools: Array<{ tool: string; args: Record<string, unknown> }>;
  reasoningGoal: string;
  permissionsRequired: EaReadCapabilityPermission[];
  synthesisKind: EaEvidenceSynthesisKind;
  /** Domains identified for this plan (cash, revenue, sales, etc.) */
  domains: string[];
};
