import type { AssistantBusinessContext } from "./types";
import type { WorkflowDefinition, WorkflowGuideSession, WorkflowStep } from "./executive-types";
import {
  getWorkflow,
  listWorkflows,
  workflowsForPermissions,
} from "./workflow-registry";
import {
  filterWorkflowsForRole,
  resolveExecutivePersona,
} from "./role-awareness";
import { buildHighlightAction, buildStartTourAction } from "./guided-learning";

/**
 * Intent detection — map natural language to Workflow Registry entries.
 * Guides via existing highlight / navigate (does not rewrite guided learning).
 */

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchWorkflowIntent(
  message: string,
  context: AssistantBusinessContext,
): WorkflowDefinition | null {
  const text = normalize(message);
  if (!text) return null;

  const persona = resolveExecutivePersona(
    context.permissions.roleView,
    context.user.displayName,
  );
  const candidates = filterWorkflowsForRole(
    workflowsForPermissions(context.permissions),
    persona,
  );

  let best: { workflow: WorkflowDefinition; score: number } | null = null;

  for (const workflow of candidates) {
    let score = 0;
    for (const phrase of workflow.intentPhrases) {
      if (text.includes(normalize(phrase))) {
        score += phrase.length;
      }
    }
    if (text.includes(normalize(workflow.name))) {
      score += workflow.name.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { workflow, score };
    }
  }

  return best?.workflow ?? null;
}

export function buildWorkflowGuideSession(
  workflowId: string,
  stepIndex = 0,
): WorkflowGuideSession | null {
  const workflow = getWorkflow(workflowId);
  if (!workflow) return null;
  const safeIndex = Math.max(0, Math.min(stepIndex, workflow.steps.length - 1));
  const step = workflow.steps[safeIndex];
  if (!step) return null;

  return {
    workflowId: workflow.id,
    name: workflow.name,
    stepIndex: safeIndex,
    steps: workflow.steps,
    clientAction: clientActionForStep(step),
  };
}

export function clientActionForStep(step: WorkflowStep): WorkflowGuideSession["clientAction"] {
  if (step.targetId && step.viewId) {
    const highlight = buildHighlightAction(step.viewId, step.targetId);
    if (highlight) {
      return {
        type: "highlight",
        viewId: step.viewId,
        targetId: step.targetId,
        explanation: step.instruction,
      };
    }
  }

  if (step.viewId && !step.targetId) {
    const tour = buildStartTourAction(step.viewId);
    return {
      type: "start_tour",
      viewId: tour.viewId,
      explanation: step.instruction,
    };
  }

  if (step.href || step.viewId) {
    return {
      type: "navigate",
      viewId: step.viewId,
      href: step.href ?? (step.viewId ? `/internaldashboard?view=${step.viewId}` : undefined),
      explanation: step.instruction,
    };
  }

  return undefined;
}

export function listIntentExamples(context: AssistantBusinessContext): string[] {
  const persona = resolveExecutivePersona(
    context.permissions.roleView,
    context.user.displayName,
  );
  return filterWorkflowsForRole(workflowsForPermissions(context.permissions), persona)
    .slice(0, 6)
    .map((workflow) => workflow.intentPhrases[0] ?? workflow.name);
}

export function searchWorkflows(query: string, context: AssistantBusinessContext) {
  const text = normalize(query);
  const persona = resolveExecutivePersona(
    context.permissions.roleView,
    context.user.displayName,
  );
  const pool = filterWorkflowsForRole(workflowsForPermissions(context.permissions), persona);
  if (!text) return pool;
  return pool.filter((workflow) => {
    const haystack = [
      workflow.name,
      workflow.purpose,
      workflow.businessOutcome,
      ...workflow.intentPhrases,
      ...workflow.relatedModules,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(text);
  });
}

export function allWorkflowSummaries() {
  return listWorkflows().map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    purpose: workflow.purpose,
    businessOutcome: workflow.businessOutcome,
    estimatedDurationMinutes: workflow.estimatedDurationMinutes,
    relatedModules: workflow.relatedModules,
    stepCount: workflow.steps.length,
  }));
}
