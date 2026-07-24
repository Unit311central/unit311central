/**
 * Executive Assistant orchestration — intent → execute → report.
 *
 * Users speak naturally. Registered actions are discovered from the registry.
 * Workflow/page guidance never overrides an executable business action.
 */

import type { AssistantBusinessContext, AssistantChatMessage } from "./types";
import type { DirectAssistantIntent } from "./intent-router";
import { resolveDirectIntent } from "./intent-router";
import { registerAllActionModules } from "./actions/register-all-modules";
import { getAssistantAction } from "./actions/registry";
import {
  answerCapabilityQuestion,
  isCapabilityQuestion,
} from "./actions/capability-service";
import { resolveBusinessActionIntent } from "./intent-action-resolver";
import { formatActionSuccess, formatPlanReadyMessage } from "./action-ui-messages";
import {
  buildNeedInfoCards,
  buildReadWorkflowCards,
  matchCapabilityWorkflow,
  primaryWorkflowActionId,
} from "./capability-workflows";
import type { EaExecutionCard } from "./execution-cards";
import { shortCardLead } from "./execution-cards";

export { formatActionSuccess, formatPlanReadyMessage };
/** @deprecated Prefer formatActionSuccess */
export { formatExecutedClientOutcome } from "./action-ui-messages";

let modulesBootstrapped = false;

/** Idempotent — safe on every turn / serverless invoke. */
export function ensureActionModulesRegistered() {
  registerAllActionModules();
  modulesBootstrapped = true;
  return modulesBootstrapped;
}

const MANUAL_GUIDANCE_TOOLS = new Set([
  "detectWorkflowIntent",
  "guideWorkflow",
  "getPageGuide",
  "startGuidedTour",
  "listWorkflows",
  "listPageGuides",
]);

export type OrchestrationRoute =
  | {
      kind: "tool";
      intent: DirectAssistantIntent;
      executionCards?: EaExecutionCard[];
    }
  | {
      kind: "need_info";
      message: string;
      actionId: string;
      missingFields: string[];
      input: Record<string, unknown>;
      executionCards: EaExecutionCard[];
    }
  | {
      kind: "capability_answer";
      message: string;
      executionCards?: EaExecutionCard[];
    }
  | {
      kind: "workflow_read";
      message: string;
      executionCards: EaExecutionCard[];
    }
  | {
      kind: "none";
    };

function proposeSteps(
  actionId: string,
  input: Record<string, unknown>,
  request: string,
  reason: string,
): DirectAssistantIntent {
  const definition = getAssistantAction(actionId);
  return {
    tool: "proposeBusinessActionPlan",
    args: {
      request,
      title: definition?.name ?? actionId,
      steps: [{ actionId, input }],
    },
    reason,
  };
}

/**
 * Primary orchestration entry: understand intent, map to registered action, propose execution.
 */
export async function resolveOrchestrationRoute(
  message: string,
  history: AssistantChatMessage[],
  business: AssistantBusinessContext,
): Promise<OrchestrationRoute> {
  ensureActionModulesRegistered();

  // 0) Capability catalogue / "can you …?" — answered from the Capability Graph only.
  if (isCapabilityQuestion(message)) {
    const answered = answerCapabilityQuestion(message, { business });
    if (answered) {
      return { kind: "capability_answer", message: answered.answer };
    }
  }

  // 0b) Multi-step capability workflows (COO orchestration presentation).
  const workflow = matchCapabilityWorkflow(message);
  if (workflow) {
    const primaryActionId = primaryWorkflowActionId(workflow);
    if (!primaryActionId) {
      const cards = buildReadWorkflowCards(workflow);
      return {
        kind: "workflow_read",
        message: shortCardLead(cards) || workflow.purpose,
        executionCards: cards,
      };
    }

    const businessIntent = await resolveBusinessActionIntent(message, business);
    if (businessIntent.kind === "need_info") {
      const cards = buildNeedInfoCards({
        actionId: businessIntent.actionId,
        message: businessIntent.question,
        missingFields: businessIntent.missingFields,
        prefill: businessIntent.input,
        workflow,
        business,
      });
      return {
        kind: "need_info",
        message: shortCardLead(cards) || businessIntent.question,
        actionId: businessIntent.actionId,
        missingFields: businessIntent.missingFields,
        input: businessIntent.input,
        executionCards: cards,
      };
    }

    const actionId =
      businessIntent.kind === "propose" ? businessIntent.actionId : primaryActionId;
    const input = businessIntent.kind === "propose" ? businessIntent.input : {};
    const cards = buildNeedInfoCards({
      actionId,
      message: workflow.purpose,
      missingFields: [],
      prefill: input,
      workflow,
      business,
    }).filter((card) => card.kind === "workflow");

    return {
      kind: "tool",
      intent: proposeSteps(
        actionId,
        input,
        message,
        businessIntent.kind === "propose"
          ? `workflow:${workflow.id}|${businessIntent.reason}|confidence=${businessIntent.confidence}`
          : `workflow:${workflow.id}`,
      ),
      executionCards: cards,
    };
  }

  // 1) Semantic write intent against the live action registry (meaning, not phrasing).
  const businessIntent = await resolveBusinessActionIntent(message, business);
  if (businessIntent.kind === "need_info") {
    const cards = buildNeedInfoCards({
      actionId: businessIntent.actionId,
      message: businessIntent.question,
      missingFields: businessIntent.missingFields,
      prefill: businessIntent.input,
      business,
    });
    return {
      kind: "need_info",
      message: shortCardLead(cards) || businessIntent.question,
      actionId: businessIntent.actionId,
      missingFields: businessIntent.missingFields,
      input: businessIntent.input,
      executionCards: cards,
    };
  }
  if (businessIntent.kind === "propose") {
    return {
      kind: "tool",
      intent: proposeSteps(
        businessIntent.actionId,
        businessIntent.input,
        message,
        `${businessIntent.reason}|confidence=${businessIntent.confidence}`,
      ),
    };
  }

  // 2) Deterministic read/PDF/email intents (non-write).
  const direct = resolveDirectIntent(message, history);
  if (direct?.tool === "proposeBusinessActionPlan" || direct?.tool === "planBusinessGoal") {
    return { kind: "tool", intent: direct };
  }
  if (direct) {
    return { kind: "tool", intent: direct };
  }

  return { kind: "none" };
}

/** @deprecated Prefer resolveOrchestrationRoute — writes are registry-only. */
export function resolveExecutableActionRoute(
  message: string,
  history: AssistantChatMessage[],
): DirectAssistantIntent | null {
  ensureActionModulesRegistered();
  return resolveDirectIntent(message, history);
}

export function isManualGuidanceTool(toolName: string): boolean {
  return MANUAL_GUIDANCE_TOOLS.has(toolName);
}

export async function redirectManualGuidanceToActionPlan(
  toolName: string,
  userMessage: string,
  business: AssistantBusinessContext,
): Promise<DirectAssistantIntent | null> {
  if (!isManualGuidanceTool(toolName)) return null;
  ensureActionModulesRegistered();
  const intent = await resolveBusinessActionIntent(userMessage, business);
  if (intent.kind !== "propose") return null;
  return proposeSteps(intent.actionId, intent.input, userMessage, "redirect_from_guidance");
}
