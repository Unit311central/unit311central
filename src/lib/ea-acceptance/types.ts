import type { EaResponseBlock } from "@/lib/ai-operating-assistant/capabilities/types";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import type { EaEvidencePlan } from "@/lib/central-application-model/types";

export type EaAcceptancePermissionProfile =
  | "executive"
  | "manager"
  | "employee"
  | "sales_rep";

export type EaAcceptanceQuestionKind =
  | "data"
  | "navigation"
  | "pdf"
  | "composite"
  | "chart"
  | "action"
  | "clarification"
  | "denied";

export type EaAcceptanceCheck = {
  id: string;
  passed: boolean;
  message: string;
};

export type EaAcceptanceExecution = {
  route: OrchestrationRoute;
  routeKind: string;
  capabilityId?: string;
  tool?: string;
  deterministic?: boolean;
  gptRequired: boolean;
  evidencePlan?: EaEvidencePlan;
  text: string;
  responseBlocks?: EaResponseBlock[];
  toolResult?: AssistantToolResult;
  artifactByteLength?: number;
  artifactIds?: string[];
  checks: EaAcceptanceCheck[];
  status: "pass" | "fail";
  error?: string;
};

export type EaAcceptanceScenario = {
  id: string;
  prompt: string;
  kind: EaAcceptanceQuestionKind;
  workspaceSlug: string;
  permissionProfile?: EaAcceptancePermissionProfile;
  expectCapabilityId?: string;
  expectTool?: string;
  expectDeterministic?: boolean;
  moduleLabel?: string;
};

export type EaAcceptanceCaseInput = {
  id: string;
  prompt: string;
  kind: EaAcceptanceQuestionKind;
  permissionProfile?: EaAcceptancePermissionProfile;
  expectTool?: string;
  expectCapabilityId?: string;
  expectDeterministic?: boolean;
  moduleLabel?: string;
  subModuleLabel?: string;
  viewId?: string;
};

export type EaAcceptanceCaseResult = {
  id: string;
  prompt: string;
  moduleLabel?: string;
  subModuleLabel?: string;
  status: "pass" | "fail";
  routeKind: string;
  capabilityId?: string;
  tool?: string;
  deterministic?: boolean;
  gptRequired?: boolean;
  summary?: string;
  checks: EaAcceptanceCheck[];
  durationMs: number;
  error?: string;
};
