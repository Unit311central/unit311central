import type { AssistantFollowUpAction } from "./tool-result";

/**
 * Safe action catalogue — definitions only.
 * No writes execute automatically; UI/runtime must require explicit confirmation.
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

export function actionFollowUps(
  kinds: AssistantPendingActionKind[],
): AssistantFollowUpAction[] {
  return kinds.map((kind) => {
    const definition = ASSISTANT_ACTION_DEFINITIONS.find((entry) => entry.kind === kind);
    return {
      id: `follow_${kind}`,
      label: definition?.label ?? kind,
      kind: "confirm_action",
      actionId: kind,
      requiresConfirmation: true,
    };
  });
}

/** Execution is intentionally unimplemented — confirmation gate only. */
export async function executeConfirmedAction(_action: AssistantPendingAction) {
  try {
    const { recordQualityEvent } = await import("./feedback-service");
    void recordQualityEvent({
      kind: "confirmation_blocked",
      meta: { actionKind: _action.kind, status: "blocked" },
    });
  } catch {
    // optional
  }
  return {
    status: "blocked" as const,
    message:
      "AI recommends — you decide. This action was not executed. Explicit confirmation is required and write execution is intentionally blocked until you approve a future confirmed write path.",
  };
}
