/**
 * Executive Assistant orchestration — intent → correct knowledge domain → execute → report.
 *
 * Permanent foundation: three independent knowledge domains (see knowledge-domains.ts).
 *   PLATFORM   → Application Catalogue
 *   CAPABILITY → Action Registry
 *   BUSINESS   → Live data tools
 * Write requests use the Action Framework (propose → Plan Viewer → execute).
 */

import { isAbhiSlug } from "@/lib/abhi-surface";
import { resolveAbhiExecutiveIntelligenceIntent } from "@/lib/abhi/executive-intelligence-intent";
import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveAbhiLmsCourseIntent } from "@/lib/abhi/lms-course-intent";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { resolveTalantonExecutiveIntelligenceIntent } from "@/lib/talanton/executive-intelligence-intent";

import type { AssistantBusinessContext, AssistantChatMessage } from "./types";
import type { DirectAssistantIntent } from "./intent-router";
import { resolveDirectIntent } from "./intent-router";
import { registerAllActionModules } from "./actions/register-all-modules";
import { getAssistantAction } from "./actions/registry";
import { executeRegisteredActionNow } from "./actions/instant-execute";
import {
  answerCapabilityQuestion,
  isCapabilityQuestion,
} from "./actions/capability-service";
import {
  hasExplicitWriteIntent,
  resolveBusinessActionIntent,
} from "./intent-action-resolver";
import { formatActionSuccess, formatPlanReadyMessage } from "./action-ui-messages";
import {
  buildReadWorkflowCards,
  matchCapabilityWorkflow,
  primaryWorkflowActionId,
} from "./capability-workflows";
import type { EaExecutionCard } from "./execution-cards";
import { buildNavigationCard, shortCardLead } from "./execution-cards";
import {
  answerPlatformQuestion,
  isPlatformQuestion,
} from "./application-catalogue";
import { classifyKnowledgeDomain, isBusinessStatusRead } from "./knowledge-domains";
import { eaStage } from "./ea-forensic-trace";

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
      kind: "platform_answer";
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
 * Primary orchestration entry: classify knowledge domain, then route.
 */
export async function resolveOrchestrationRoute(
  message: string,
  history: AssistantChatMessage[],
  business: AssistantBusinessContext,
): Promise<OrchestrationRoute> {
  ensureActionModulesRegistered();

  // Meeting invite follow-up: emails after "Meeting created — please give me…"
  {
    const {
      looksLikeMeetingAttendeeReply,
      extractEmailsFromMessage,
      findPendingMeetingForInvite,
      sendMeetingAttendeeInvites,
    } = await import("./actions/modules/calendar/meeting-invite-flow");
    if (looksLikeMeetingAttendeeReply(message, history)) {
      const emails = extractEmailsFromMessage(message);
      const scope = { workspaceId: business.workspace.id?.trim() || null };
      const pending = await findPendingMeetingForInvite(scope, history);
      if (!pending) {
        return {
          kind: "capability_answer",
          message:
            "I couldn't find a meeting waiting for invites. Schedule a meeting first, then send the emails.",
        };
      }
      const result = await sendMeetingAttendeeInvites({
        event: pending,
        attendeeEmails: emails,
        business,
        scope,
      });
      return { kind: "capability_answer", message: result.message };
    }
  }

  const domain = classifyKnowledgeDomain(message);
  eaStage("Knowledge domain", {
    domain: domain.domain,
    reason: domain.reason,
    message,
  });

  // PLATFORM — Application Catalogue only (never Action Registry).
  // Do not override an explicit business-domain classification with catalogue hits
  // ("List our office locations" must stay live-data, not navigation copy).
  if (
    domain.domain === "platform" ||
    (domain.domain === "unknown" && isPlatformQuestion(message))
  ) {
    const answered = answerPlatformQuestion(message);
    if (answered) {
      const cards: EaExecutionCard[] = [];
      if (answered.navigateHref) {
        cards.push(
          buildNavigationCard({
            title: answered.navigateLabel ?? "Open module",
            body: "Platform navigation — Application Catalogue",
            href: answered.navigateHref,
            label: answered.navigateLabel ?? "Open",
          }),
        );
      }
      return {
        kind: "platform_answer",
        message: answered.answer,
        executionCards: cards.length ? cards : undefined,
      };
    }
  }

  // CAPABILITY — Action Registry / Capability Graph only (never Application Catalogue).
  if (domain.domain === "capability" || isCapabilityQuestion(message)) {
    const answered = answerCapabilityQuestion(message, { business });
    if (answered) {
      return { kind: "capability_answer", message: answered.answer };
    }
  }

  // ABHI flagship — Board Pack Generation (PowerPoint + PDF). Workspace-gated.
  if (isAbhiSlug(business.workspace.slug)) {
    const execIntel = resolveAbhiExecutiveIntelligenceIntent(message);
    if (execIntel) {
      return {
        kind: "tool",
        intent: {
          tool: execIntel.tool,
          args: execIntel.args,
          reason: execIntel.reason,
        },
      };
    }

    const boardPack = resolveAbhiBoardPackIntent(message);
    if (boardPack) {
      return {
        kind: "tool",
        intent: {
          tool: boardPack.tool,
          args: boardPack.args,
          reason: boardPack.reason,
        },
      };
    }

    if (resolveAbhiLmsCourseIntent(message)) {
      return {
        kind: "tool",
        intent: {
          tool: "lms.generateCourseFromDocument",
          args: {
            fileId: business.selection?.fileId ?? undefined,
            fileName: business.selection?.fileName ?? undefined,
            title: undefined,
          },
          reason: "ABHI AI course generator from document",
        },
      };
    }
  }

  // Talanton Impact — executive intelligence, board pack, AI training course.
  if (isTalantonImpactSlug(business.workspace.slug)) {
    const execIntel = resolveTalantonExecutiveIntelligenceIntent(message);
    if (execIntel) {
      return {
        kind: "tool",
        intent: {
          tool: execIntel.tool,
          args: execIntel.args,
          reason: execIntel.reason,
        },
      };
    }

    const boardPack = resolveAbhiBoardPackIntent(message);
    if (boardPack) {
      return {
        kind: "tool",
        intent: {
          tool: boardPack.tool,
          args: boardPack.args,
          reason: "Talanton Impact board pack generation",
        },
      };
    }

    if (resolveAbhiLmsCourseIntent(message)) {
      return {
        kind: "tool",
        intent: {
          tool: "lms.generateCourseFromDocument",
          args: {
            fileId: business.selection?.fileId ?? undefined,
            fileName: business.selection?.fileName ?? undefined,
            title: undefined,
          },
          reason: "Talanton Impact AI course generator from document",
        },
      };
    }
  }

  // OnwardAir — board deck generation (aerospace pack; same NL verbs as ABHI).
  if (isOnwardAirSlug(business.workspace.slug)) {
    const boardPack = resolveAbhiBoardPackIntent(message);
    if (boardPack) {
      return {
        kind: "tool",
        intent: {
          tool: boardPack.tool,
          args: boardPack.args,
          reason: "OnwardAir board deck generation",
        },
      };
    }

    if (resolveAbhiLmsCourseIntent(message)) {
      return {
        kind: "tool",
        intent: {
          tool: "lms.generateCourseFromDocument",
          args: {
            fileId: business.selection?.fileId ?? undefined,
            fileName: business.selection?.fileName ?? undefined,
            title: undefined,
          },
          reason: "OnwardAir AI course generator from document",
        },
      };
    }
  }

  // Document / PDF / export intents win before any write propose path.
  // Prevents "create me a pdf…" becoming Create client location.
  // Preference changes that merely mention PDF must not steal this path.
  const documentIntent = resolveDirectIntent(message, history);
  const isRealDocumentAsk =
    /\b(create|make|generate|export|produce|build|prepare|give|get|show)\b/i.test(message) &&
    /\b(pdf|report|pack|directory|document)\b/i.test(message) &&
    !/\b(preference|switch\s+the|delivery\s+preference)\b/i.test(message);
  if (
    isRealDocumentAsk &&
    documentIntent &&
    [
      "generateScopedBusinessPdf",
      "generateFinancialReportPdf",
      "generateReportPdf",
      "generateEmployeeListPdf",
      "generatePayrollPdf",
      "emailAssistantArtifact",
    ].includes(documentIntent.tool)
  ) {
    return { kind: "tool", intent: documentIntent };
  }

  // BUSINESS — live data tools (deterministic read intents).
  if (domain.domain === "business") {
    const direct = resolveDirectIntent(message, history);
    if (
      direct &&
      direct.tool !== "proposeBusinessActionPlan" &&
      direct.tool !== "planBusinessGoal"
    ) {
      return { kind: "tool", intent: direct };
    }
    // Prefer live business query over falling into platform/catalogue answers.
    if (!hasExplicitWriteIntent(message)) {
      return {
        kind: "tool",
        intent: {
          tool: "queryBusiness",
          args: { question: message },
          reason: "business_domain_fallback",
        },
      };
    }
  }

  // WRITE / multi-step capability workflows (COO orchestration presentation).
  // Never run write workflows for live-data business questions.
  const workflow = matchCapabilityWorkflow(message);
  if (
    workflow &&
    domain.domain !== "business" &&
    domain.domain !== "platform" &&
    hasExplicitWriteIntent(message)
  ) {
    const primaryActionId = primaryWorkflowActionId(workflow);
    if (!primaryActionId) {
      const cards = buildReadWorkflowCards(workflow);
      return {
        kind: "workflow_read",
        message: shortCardLead(cards) || workflow.purpose,
        executionCards: cards,
      };
    }

    const businessIntent = await resolveBusinessActionIntent(message, business, history);
    if (businessIntent.kind === "need_info") {
      return {
        kind: "need_info",
        message: businessIntent.question,
        actionId: businessIntent.actionId,
        missingFields: businessIntent.missingFields,
        input: businessIntent.input,
        executionCards: [],
      };
    }

    const actionId =
      businessIntent.kind === "propose" ? businessIntent.actionId : primaryActionId;
    const actionInput = businessIntent.kind === "propose" ? businessIntent.input : {};
    if (actionId) {
      const executed = await executeRegisteredActionNow({
        actionId,
        actionInput,
        business,
      });
      return { kind: "capability_answer", message: executed.message };
    }

    return {
      kind: "capability_answer",
      message: workflow.purpose,
    };
  }

  // WRITE — registry-driven instant execute / need_info (no Approve UI).
  // Business-domain reads must not fall into write plans.
  const mayWrite =
    domain.domain === "write" ||
    (domain.domain !== "platform" &&
      domain.domain !== "capability" &&
      hasExplicitWriteIntent(message));
  if (mayWrite) {
    const businessIntent = await resolveBusinessActionIntent(message, business, history);
    if (businessIntent.kind === "need_info") {
      return {
        kind: "need_info",
        message: businessIntent.question,
        actionId: businessIntent.actionId,
        missingFields: businessIntent.missingFields,
        input: businessIntent.input,
        executionCards: [],
      };
    }
    if (businessIntent.kind === "propose") {
      const executed = await executeRegisteredActionNow({
        actionId: businessIntent.actionId,
        actionInput: businessIntent.input,
        business,
      });
      return { kind: "capability_answer", message: executed.message };
    }

    // Honest unsupported write — do not invent CRM/leave/invoice mutations.
    const capabilities = answerCapabilityQuestion("What can you do?", { business });
    const registered = capabilities?.statements?.length
      ? capabilities.statements.map((s) => `• ${s}`).join("\n")
      : "• Create client\n• Create project\n• Related client contact / location actions";
    return {
      kind: "capability_answer",
      message: [
        "I don't have a registered write action for that request yet.",
        "",
        "Registered executable writes today:",
        registered,
        "",
        "I can still look up related live data, or you can ask one of the registered actions above.",
      ].join("\n"),
    };
  }

  // BUSINESS / other reads — deterministic tools (PDF, email, search*).
  const direct = resolveDirectIntent(message, history);
  if (direct?.tool === "proposeBusinessActionPlan" || direct?.tool === "planBusinessGoal") {
    return { kind: "tool", intent: direct };
  }
  if (direct) {
    return { kind: "tool", intent: direct };
  }

  // Unknown CEO status/lookup reads → live business query (never freeform Application Catalogue).
  if (isBusinessStatusRead(message) && !hasExplicitWriteIntent(message)) {
    return {
      kind: "tool",
      intent: {
        tool: "queryBusiness",
        args: { question: message },
        reason: "unknown_business_read_fallback",
      },
    };
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
  const intent = await resolveBusinessActionIntent(userMessage, business, []);
  if (intent.kind !== "propose") return null;
  return proposeSteps(intent.actionId, intent.input, userMessage, "redirect_from_guidance");
}
