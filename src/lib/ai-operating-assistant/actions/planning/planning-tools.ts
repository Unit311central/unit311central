/**
 * OpenAI-discoverable Planning Engine tools.
 *
 * CEO mode: materialise Action Framework steps and execute immediately.
 * No Approve / Plan Viewer gate for registered writes.
 */

import { asString, toolOk, type AssistantToolExecutionContext } from "../../tool-result";
import { buildActionPlan, executeActionPlan } from "../execution-pipeline";
import { shortCeoActionMessage } from "../instant-execute";
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

  const effectivelyBlocked = blocked || actionBlocked;
  if (effectivelyBlocked || actionPlan.status !== "proposed") {
    return toolOk(
      "planBusinessGoal",
      [
        {
          goalId: plan.id,
          planId: actionPlan.id,
          plan: summary,
          blocked: true,
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
          requiresConfirmation: false,
          blocked: true,
          executed: false,
          message: blockReason ?? actionBlockReason ?? "I couldn't complete that.",
        },
      },
    );
  }

  const executed = await executeActionPlan({
    planId: actionPlan.id,
    business: ctx.business,
    confirmed: true,
  });

  const succeeded = [...executed.plan.steps]
    .reverse()
    .find((step) => step.status === "succeeded" && step.result);
  const message = succeeded?.result
    ? shortCeoActionMessage({
        actionId: succeeded.actionId,
        result: succeeded.result,
        stepInput: succeeded.input,
      })
    : executed.summary || "Completed.";

  return toolOk(
    "planBusinessGoal",
    [
      {
        goalId: plan.id,
        planId: executed.plan.id,
        plan: summary,
        blocked: false,
        executed: true,
        status: executed.plan.status,
      },
    ],
    {
      source: ["assistant:planning-engine", "assistant:action-pipeline"],
      pageSize: 1,
      summary: {
        goalId: plan.id,
        planId: executed.plan.id,
        status: executed.plan.status,
        stepCount: executed.plan.steps.length,
        plannerSource: plan.plannerSource,
        requiresConfirmation: false,
        blocked: false,
        executed: true,
        message,
      },
    },
  );
}

/** Legacy stub — writes now auto-execute via planBusinessGoal / proposeBusinessActionPlan. */
export async function executeGoalPlanTool() {
  return toolOk("executeGoalPlan", [], {
    source: ["assistant:planning-engine"],
    pageSize: 0,
    summary: {
      error:
        "executeGoalPlan is disabled. Ask the assistant to perform the action directly.",
      blocked: true,
    },
  });
}
