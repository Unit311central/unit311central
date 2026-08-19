/**
 * Executive Assistant orchestration — intent → correct knowledge domain → execute → report.
 *
 * Permanent foundation: three independent knowledge domains (see knowledge-domains.ts).
 *   PLATFORM   → Application Catalogue
 *   CAPABILITY → Action Registry
 *   BUSINESS   → Live data tools
 * Write requests use the Action Framework (propose → Plan Viewer → execute).
 */

import {
  ensureEaWorkspacePacksRegistered,
  getEaWorkspaceUnsupportedWriteMessage,
  resolveEaWorkspacePackOrchestration,
} from "@/lib/ai-operating-assistant/workspace-packs";

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
  searchApplicationCatalogue,
} from "./application-catalogue";
import {
  classifyKnowledgeDomain,
  isBusinessStatusRead,
  isLiveFinancialBalanceQuestion,
} from "./knowledge-domains";
import { eaStage } from "./ea-forensic-trace";
import { isEaGeneralIntentMode } from "./ea-general-mode";

export { formatActionSuccess, formatPlanReadyMessage };
/** @deprecated Prefer formatActionSuccess */
export { formatExecutedClientOutcome } from "./action-ui-messages";

let modulesBootstrapped = false;

/** Idempotent — safe on every turn / serverless invoke. */
export function ensureActionModulesRegistered() {
  ensureEaWorkspacePacksRegistered();
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

import type { OrchestrationRoute } from "./orchestration-route";
export type { OrchestrationRoute } from "./orchestration-route";

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

  const catalogueOptions = { workspaceSlug: business.workspace.slug };

  // Workspace packs (Northstar / ABHI / Talanton / OnwardAir) win before generic routing.
  const workspacePackRoute = await resolveEaWorkspacePackOrchestration({
    message,
    business,
    history,
  });
  if (workspacePackRoute) {
    return workspacePackRoute;
  }

  // Navigation — Application Catalogue wins over coarse business "where/find" routing.
  if (/\b(where|open|navigate|take\s+me\s+to|go\s+to)\b/i.test(message)) {
    const navigationAnswer = answerPlatformQuestion(message, catalogueOptions);
    if (navigationAnswer?.navigateHref) {
      const cards: EaExecutionCard[] = [
        buildNavigationCard({
          title: navigationAnswer.navigateLabel ?? "Open module",
          body: "Platform navigation — Application Catalogue",
          href: navigationAnswer.navigateHref,
          label: navigationAnswer.navigateLabel ?? "Open",
        }),
      ];
      return {
        kind: "platform_answer",
        message: navigationAnswer.answer,
        executionCards: cards,
      };
    }
  }

  // PLATFORM — Application Catalogue only (never Action Registry).
  // Do not override an explicit business-domain classification with catalogue hits
  // ("List our office locations" must stay live-data, not navigation copy).
  if (
    (domain.domain === "platform" ||
      (domain.domain === "unknown" && isPlatformQuestion(message, catalogueOptions))) &&
    !isLiveFinancialBalanceQuestion(message)
  ) {
    const answered = answerPlatformQuestion(message, catalogueOptions);
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

  // Document / PDF / export intents win before any write propose path.
  // Prevents "create me a pdf…" becoming Create client location.
  // Preference changes that merely mention PDF must not steal this path.
  // Compositor PDFs (scoped business report, board pack, etc.) stay deterministic in Real EA.
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
      "abhi.generateRegulatoryImpactPdf",
      "abhi.generateQuarterlyFinancialDeltaPdf",
      "abhi.generateProjectHealthPdf",
      "abhi.generatePlatformAccessPdf",
      "talanton.generateStoriesLessonsPdf",
      "talanton.generateStoriesReport",
      "boardpack.generate",
      "emailAssistantArtifact",
    ].includes(documentIntent.tool)
  ) {
    return { kind: "tool", intent: documentIntent };
  }

  // BUSINESS — live data tools (deterministic read intents).
  if (domain.domain === "business") {
    if (isEaGeneralIntentMode() && !hasExplicitWriteIntent(message)) {
      return { kind: "none" };
    }
    const direct = resolveDirectIntent(message, history);
    if (
      direct &&
      direct.tool !== "proposeBusinessActionPlan" &&
      direct.tool !== "planBusinessGoal"
    ) {
      return { kind: "tool", intent: direct };
    }
    // Prefer workspace executive tools; fall back to live snapshot for open business reads.
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
    const writeMessage =
      getEaWorkspaceUnsupportedWriteMessage(business.workspace.slug, registered) ??
      [
        "I don't have a registered write action for that request yet.",
        "",
        "Registered executable writes today:",
        registered,
        "",
        "I can still look up related live data, or you can ask one of the registered actions above.",
      ].join("\n");
    return {
      kind: "capability_answer",
      message: writeMessage,
    };
  }

  // BUSINESS / other reads — conversational shortcuts (PDF follow-up, email) or legacy deterministic tools.
  const direct = resolveDirectIntent(message, history);
  if (direct?.tool === "proposeBusinessActionPlan" || direct?.tool === "planBusinessGoal") {
    return { kind: "tool", intent: direct };
  }
  if (direct) {
    return { kind: "tool", intent: direct };
  }

  // Module / platform structure — natural-language questions before business snapshot fallback.
  const structureAnswer = answerPlatformQuestion(message, catalogueOptions);
  if (structureAnswer) {
    const cards: EaExecutionCard[] = [];
    if (structureAnswer.navigateHref) {
      cards.push(
        buildNavigationCard({
          title: structureAnswer.navigateLabel ?? "Open module",
          body: "Platform navigation — Application Catalogue",
          href: structureAnswer.navigateHref,
          label: structureAnswer.navigateLabel ?? "Open",
        }),
      );
    }
    return {
      kind: "platform_answer",
      message: structureAnswer.answer,
      executionCards: cards.length ? cards : undefined,
    };
  }

  if (!hasExplicitWriteIntent(message)) {
    const searchHits = searchApplicationCatalogue(message, 3, catalogueOptions);
    if (
      searchHits.length > 0 &&
      /\b(what|how|tell|explain|describe|which|where|about|module|application|section|page|screen|view|do)\b/i.test(
        message,
      )
    ) {
      return {
        kind: "tool",
        intent: {
          tool: "searchApplications",
          args: { query: message },
          reason: "module_nl_search_fallback",
        },
      };
    }
  }

  // Unknown CEO status/lookup reads → model tools in real EA mode; legacy uses queryBusiness snapshot.
  if (
    !isEaGeneralIntentMode() &&
    isBusinessStatusRead(message) &&
    !hasExplicitWriteIntent(message)
  ) {
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
