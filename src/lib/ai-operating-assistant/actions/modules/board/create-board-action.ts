import { createBoardActionViaEa } from "@/lib/onwardair/executive-mutations-store";
import type { OaBoardActionStatus } from "@/lib/onwardair/board-data";
import type { AssistantActionDefinition } from "../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(raw: string): OaBoardActionStatus | null {
  const key = raw.trim().toLowerCase();
  const map: Record<string, OaBoardActionStatus> = {
    completed: "Completed",
    underway: "Underway",
    overdue: "Overdue",
    blocked: "Blocked",
    closed: "Closed",
  };
  return map[key] ?? null;
}

export const createBoardActionAction: AssistantActionDefinition = {
  id: "board.createAction",
  name: "Create board action",
  description:
    "Track a new board action with owner and due date. Use when the user asks to assign or log a board follow-up.",
  module: "board",
  requiredPermissions: ["authenticated", "canAccessStrategy"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      owner: { type: "string" },
      dueDate: { type: "string" },
      status: { type: "string" },
    },
    required: ["title", "owner", "dueDate"],
  },
  capability: {
    id: "board.createAction",
    businessObject: "BoardAction",
    intentExamples: [
      "Create a board action for Rick to close seed data room by Friday",
      "Log board follow-up — Cameron to review VTOL gate by 2026-09-01",
      "Add board action: update risk register before next meeting",
    ],
    semanticAliases: ["board", "action", "follow-up", "governance", "assign"],
    entityExtraction: {
      primaryNameFields: ["title", "owner"],
      fields: [{ field: "owner", from: "person" }],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Board action created — {recordLabel}.",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.permissions.canAccessStrategy) {
        return { ok: false, errors: ["Board / strategy access required."], warnings: [] };
      }
      const errors: string[] = [];
      if (!asTrimmedString(input.title)) errors.push("Provide an action title.");
      if (!asTrimmedString(input.owner)) errors.push("Provide an owner.");
      if (!asTrimmedString(input.dueDate)) errors.push("Provide a due date.");
      return { ok: errors.length === 0, errors, warnings: [] };
    },

    async preview(input) {
      const title = asTrimmedString(input.title);
      const owner = asTrimmedString(input.owner);
      const dueDate = asTrimmedString(input.dueDate);
      return {
        summary: `Board action — ${title} (${owner}, due ${dueDate})`,
        affectedRecords: [{ type: "board_action", id: "new", label: title, change: "Create" }],
        warnings: [],
        reversible: false,
      };
    },

    async execute(input) {
      const statusRaw = asTrimmedString(input.status);
      const status = statusRaw ? normalizeStatus(statusRaw) : undefined;
      if (statusRaw && !status) {
        return { ok: false, message: `Unknown board action status “${statusRaw}”.` };
      }

      const result = createBoardActionViaEa({
        title: asTrimmedString(input.title),
        owner: asTrimmedString(input.owner),
        dueDate: asTrimmedString(input.dueDate),
        status: status ?? undefined,
      });

      if (!result.ok) {
        return { ok: false, message: result.error };
      }

      return {
        ok: true,
        message: `Board action created — ${result.action.title}.`,
        recordId: result.action.id,
        recordLabel: `${result.action.title} · ${result.action.owner}`,
        afterState: result.action as unknown as Record<string, unknown>,
        output: { actionId: result.action.id },
      };
    },
  },
};
