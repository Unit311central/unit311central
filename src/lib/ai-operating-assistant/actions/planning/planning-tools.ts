/**
 * OpenAI-discoverable Planning Engine tools.
 *
 * Executable writes always materialise a Phase-1 Action Framework plan so the UI
 * has exactly one approve path: POST /api/executive-assistant/actions/plans/{id}
 * → executeActionPlan(). Goal graph execution is not exposed to the browser.
 */

import { asString, toolOk, type AssistantToolExecutionContext } from "../../tool-result";
import { buildActionPlan, toConfirmationView } from "../execution-pipeline";
import { planBusinessGoal } from "./planner";
import { toPlanSummary } from "./summaries";

export async function planBusinessGoalTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const { ensureActionModulesRegistered } = await import(
    "@/lib/ai-operating-assistant/action-orchestration"
  );
  ensureActionModulesRegistered();

  const goal =
    asString(args.goal) ||
    asString(args.request) ||
    asString(args.question) ||
    "";
  const title = asString(args.title) || null;
  const conversationId = asString(args.conversationId) || null;

  const { plan, blocked, blockReason } = await planBusinessGoal({
    business: ctx.business,
    goal,
    title,
    conversationId,
  });

  const summary = toPlanSummary(plan);

  // Single execution path: materialise Action Framework plan for Plan Viewer Approve.
  const { plan: actionPlan, blocked: actionBlocked, blockReason: actionBlockReason } =
    await buildActionPlan({
      business: ctx.business,
      steps: plan.steps.map((step) => ({
        actionId: step.actionId,
        input: step.input ?? {},
        dependsOnStepIds: step.dependsOnStepIds,
      })),
      aiRequest: plan.goal,
      conversationId,
      title: plan.title,
    });

  const confirmation = toConfirmationView(actionPlan);
  const effectivelyBlocked = blocked || actionBlocked;

  return toolOk(
    "planBusinessGoal",
    [
      {
        goalId: plan.id,
        planId: actionPlan.id,
        plan: summary,
        confirmation,
        blocked: effectivelyBlocked,
        blockReason: blockReason ?? actionBlockReason ?? null,
      },
    ],
    {
      source: ["assistant:planning-engine", "assistant:action-pipeline"],
      pageSize: 1,
      summary: {
        goalId: plan.id,
        planId: actionPlan.id,
        status: actionPlan.status,
        stepCount: actionPlan.steps.length,
        plannerSource: plan.plannerSource,
        requiresConfirmation: actionPlan.status === "proposed",
        blocked: effectivelyBlocked,
        message: effectivelyBlocked
          ? (blockReason ?? actionBlockReason)
          : "Ready — approve in the Plan Viewer to complete this.",
      },
      followUpActions:
        actionPlan.status === "proposed"
          ? [
              {
                id: `confirm_plan_${actionPlan.id}`,
                label: "Review & approve",
                kind: "confirm_action",
                actionId: actionPlan.id,
                requiresConfirmation: true,
              },
            ]
          : undefined,
    },
  );
}

/**
 * Intentionally not executable from the assistant/LLM.
 * Browser Approve must call POST /api/executive-assistant/actions/plans/{id}.
 */
export async function executeGoalPlanTool() {
  return toolOk("executeGoalPlan", [], {
    source: ["assistant:planning-engine"],
    pageSize: 0,
    summary: {
      error:
        "executeGoalPlan is disabled. Approve executable actions via the Plan Viewer (Action Framework plans API).",
      blocked: true,
    },
    dataGaps: [
      "Use proposeBusinessActionPlan / Plan Viewer → POST /api/executive-assistant/actions/plans/{id}.",
    ],
  });
}
