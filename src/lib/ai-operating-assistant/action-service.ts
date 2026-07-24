import type { AssistantFollowUpAction } from "./tool-result";

/**
 * Legacy catalogue types retained only for stale follow-up action ids in old messages.
 * There is no executable path here — writes go through Action Framework plans only:
 * proposeBusinessActionPlan → Plan Viewer → POST /api/executive-assistant/actions/plans/{id}
 * → executeActionPlan().
 */

export type AssistantPendingActionKind =
  | "create_client"
  | "create_project"
  | "create_employee"
  | "approve_leave"
  | "invite_external_user"
  | "generate_report";

export type AssistantPendingAction = {
  id: string;
  kind: AssistantPendingActionKind;
  label: string;
  description: string;
  requiresConfirmation: true;
  payload: Record<string, unknown>;
  status: "proposed" | "confirmed" | "cancelled" | "executed";
};

export const ASSISTANT_ACTION_DEFINITIONS: Array<{
  kind: AssistantPendingActionKind;
  label: string;
  description: string;
}> = [
  {
    kind: "create_client",
    label: "Create Client",
    description: "Create a new client directory record after explicit confirmation.",
  },
  {
    kind: "create_project",
    label: "Create Project",
    description: "Create a project record after explicit confirmation.",
  },
  {
    kind: "create_employee",
    label: "Create Employee",
    description: "Create an HR employee record after explicit confirmation.",
  },
  {
    kind: "approve_leave",
    label: "Approve Leave",
    description: "Approve an employee leave request after explicit confirmation.",
  },
  {
    kind: "invite_external_user",
    label: "Invite External User",
    description: "Invite an external portal user after explicit confirmation.",
  },
  {
    kind: "generate_report",
    label: "Generate Report",
    description: "Generate a report pack from live tool data after confirmation.",
  },
];

/** @deprecated Do not use — retained for type compatibility with old transcripts. */
export function proposeAction(
  kind: AssistantPendingActionKind,
  payload: Record<string, unknown> = {},
): AssistantPendingAction {
  const definition = ASSISTANT_ACTION_DEFINITIONS.find((entry) => entry.kind === kind);
  return {
    id: `action_${kind}_${Date.now().toString(36)}`,
    kind,
    label: definition?.label ?? kind,
    description: definition?.description ?? "Requires confirmation before execution.",
    requiresConfirmation: true,
    payload,
    status: "proposed",
  };
}

/** @deprecated Do not emit confirm_action follow-ups for catalogue kinds. */
export function actionFollowUps(
  kinds: AssistantPendingActionKind[],
): AssistantFollowUpAction[] {
  return kinds.map((kind) => {
    const definition = ASSISTANT_ACTION_DEFINITIONS.find((entry) => entry.kind === kind);
    return {
      id: `follow_${kind}`,
      label: definition?.label ?? kind,
      kind: "navigate" as const,
      href: "/?view=clients",
      requiresConfirmation: false,
    };
  });
}

/**
 * Removed. Any call is a hard error — there is no alternate write path.
 */
export async function executeConfirmedAction(_action: AssistantPendingAction): Promise<never> {
  void _action;
  throw new Error(
    "executeConfirmedAction was removed. Executable actions must use Plan Viewer → POST /api/executive-assistant/actions/plans/{id} → executeActionPlan().",
  );
}
