import {
  GUIDED_LEARNING_ENABLED,
  buildHighlightAction,
  buildStartTourAction,
} from "./guided-learning";
import { findPageTarget, getPageGuide, listRegisteredPageGuides } from "./page-registry";
import { userCanAccessView } from "./actions/permissions";
import type { AssistantToolExecutionContext } from "./tool-result";
import { asString, toolError, toolForbidden, toolOk } from "./tool-result";

/**
 * Guided learning tools — return structured client actions.
 * The browser executes highlight/tour; the model orchestrates explanations.
 */

function denyIfViewBlocked(viewId: string, ctx: AssistantToolExecutionContext, tool: string) {
  if (!userCanAccessView(ctx.business, viewId)) {
    return toolForbidden(
      tool,
      `You do not have access to the “${viewId}” module. Ask for a page within your granted modules.`,
    );
  }
  return null;
}

export async function getPageGuideTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const viewId = asString(args.viewId) || ctx.business.page.activeView || "home";
  const denied = denyIfViewBlocked(viewId, ctx, "getPageGuide");
  if (denied) return denied;

  const page = getPageGuide(viewId);
  return toolOk("getPageGuide", [page], {
    source: ["ai:page-registry"],
    page: 1,
    pageSize: 1,
    summary: {
      pageName: page.pageName,
      targetCount: page.targets.length,
      commonQuestions: page.commonQuestions,
    },
    followUpActions: [
      ...(GUIDED_LEARNING_ENABLED
        ? [
            {
              id: "start_tour",
              label: "Show Me Around",
              kind: "navigate" as const,
              href: `guided://start_tour?view=${encodeURIComponent(viewId)}`,
            },
          ]
        : []),
      ...page.commonQuestions.slice(0, 3).map((question, index) => ({
        id: `ask_${index}`,
        label: question,
        kind: "generate" as const,
      })),
    ],
    appliedContext: { activeView: viewId },
  });
}

export async function startGuidedTour(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  if (!GUIDED_LEARNING_ENABLED) {
    return toolError(
      "startGuidedTour",
      "Module tutorials are temporarily unavailable. I can still answer questions about this page.",
    );
  }
  const viewId = asString(args.viewId) || ctx.business.page.activeView || "home";
  const denied = denyIfViewBlocked(viewId, ctx, "startGuidedTour");
  if (denied) return denied;

  const action = buildStartTourAction(viewId);
  return toolOk("startGuidedTour", [action], {
    source: ["ai:guided-learning"],
    page: 1,
    pageSize: 1,
    summary: {
      clientAction: action,
      stepCount: action.steps.length,
      instruction:
        "Client must dispatch this clientAction to begin the visual walkthrough. Explain steps as the user continues.",
    },
    followUpActions: [
      {
        id: "tour_running",
        label: "Continue tour",
        kind: "navigate",
        href: "guided://next",
      },
    ],
    appliedContext: { activeView: viewId },
  });
}

export async function highlightUiTarget(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  if (!GUIDED_LEARNING_ENABLED) {
    return toolError(
      "highlightUiTarget",
      "UI walkthrough highlights are temporarily unavailable.",
    );
  }
  const viewId = asString(args.viewId) || ctx.business.page.activeView || "home";
  const denied = denyIfViewBlocked(viewId, ctx, "highlightUiTarget");
  if (denied) return denied;

  const targetId = asString(args.targetId);
  if (!targetId) {
    return toolError("highlightUiTarget", "targetId is required");
  }

  const target = findPageTarget(viewId, targetId);
  if (!target) {
    const page = getPageGuide(viewId);
    return toolError(
      "highlightUiTarget",
      `Unknown target “${targetId}” on ${page.pageName}. Known targets: ${page.targets
        .map((entry) => entry.id)
        .join(", ")}`,
      ["ai:page-registry"],
    );
  }

  const explanation = asString(args.explanation) || target.explanation;
  const action = buildHighlightAction(viewId, targetId);
  if (action && explanation) {
    action.explanation = explanation;
  }

  return toolOk("highlightUiTarget", [action], {
    source: ["ai:guided-learning"],
    page: 1,
    pageSize: 1,
    summary: {
      clientAction: action,
      target,
      instruction:
        "Client must dispatch clientAction to pulse/scroll the UI control while you explain it.",
    },
    followUpActions: [
      {
        id: "ask_more",
        label: "Explain related controls",
        kind: "generate",
      },
      {
        id: "start_full_tour",
        label: "Show Me Around",
        kind: "navigate",
        href: `guided://start_tour?view=${encodeURIComponent(viewId)}`,
      },
    ],
    appliedContext: { activeView: viewId },
  });
}

export async function listPageGuidesTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const guides = listRegisteredPageGuides()
    .filter((page) => userCanAccessView(ctx.business, page.viewId))
    .map((page) => ({
      viewId: page.viewId,
      pageName: page.pageName,
      purpose: page.purpose,
      targetCount: page.targets.length,
    }));
  return toolOk("listPageGuides", guides, {
    source: ["ai:page-registry"],
    page: 1,
    pageSize: guides.length,
    summary: { registeredPages: guides.length },
  });
}
