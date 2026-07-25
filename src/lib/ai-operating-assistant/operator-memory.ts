import { listActionAuditForUser } from "./actions/audit-service";

/**
 * Light durable operator memory — recent approved/executed actions.
 * Injected into EA prompts so the assistant remembers what was done.
 */

export type OperatorMemorySnapshot = {
  recentApprovals: Array<{
    actionId: string;
    actionName: string;
    result: string;
    label: string | null;
    createdAt: string;
  }>;
  summaryLine: string | null;
};

export async function loadOperatorMemory(input: {
  userId: string;
  workspaceId?: string | null;
  limit?: number;
}): Promise<OperatorMemorySnapshot> {
  const rows = await listActionAuditForUser({
    userId: input.userId,
    workspaceId: input.workspaceId,
    limit: input.limit ?? 12,
  });

  const recentApprovals = rows
    .filter((row) => row.result === "success")
    .slice(0, 8)
    .map((row) => {
      const after = row.afterState ?? {};
      const label =
        (typeof after.invoiceNumber === "string" && after.invoiceNumber) ||
        (typeof after.purpose === "string" && after.purpose) ||
        (typeof after.title === "string" && after.title) ||
        (typeof after.clientName === "string" && after.clientName) ||
        row.actionName;
      return {
        actionId: row.actionId,
        actionName: row.actionName,
        result: row.result,
        label: typeof label === "string" ? label : null,
        createdAt: row.createdAt,
      };
    });

  const summaryLine =
    recentApprovals.length > 0
      ? `Recent approvals: ${recentApprovals
          .slice(0, 5)
          .map((entry) => `${entry.actionName}${entry.label ? ` (${entry.label})` : ""}`)
          .join("; ")}.`
      : null;

  return { recentApprovals, summaryLine };
}
