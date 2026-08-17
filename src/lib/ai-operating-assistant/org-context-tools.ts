import { getTypeTotals } from "@/lib/accounting/balances";
import { buildBusinessSnapshot } from "./business-snapshot-service";
import { asString, toolError, toolOk } from "./tool-result";
import type { AssistantToolExecutionContext } from "./tool-result";

/**
 * Unified org context for open-ended executive Q&A — primary grounding source in real EA mode.
 */
export async function getOrgContextTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  try {
    const question = asString(args.question) || "";
    const focus = asString(args.focus) || "all";

    const snapshot = await buildBusinessSnapshot(
      ctx.business,
      focus === "overview" ? "overview" : "all",
    );

    let balanceSheet: Record<string, number | null> | null = null;
    if (ctx.business.permissions.canAccessFinancials) {
      try {
        const totals = await getTypeTotals(
          ctx.business.workspace.id ? { workspaceId: ctx.business.workspace.id } : undefined,
        );
        balanceSheet = {
          assets: totals.assets,
          liabilities: totals.liabilities,
          equity: totals.equity,
          income: totals.income,
          expenses: totals.expenses,
          netProfit: totals.netProfit,
          cashPosition: totals.cashPosition,
          accountsReceivable: totals.accountsReceivable,
          accountsPayable: totals.accountsPayable,
        };
      } catch {
        balanceSheet = null;
      }
    }

    return toolOk("getOrgContext", [{ snapshot, balanceSheet }], {
      source: ["live-platform", "assistant:org-context"],
      page: 1,
      pageSize: 1,
      summary: {
        focus,
        question: question || null,
        activeClients: snapshot.overview.activeClients ?? null,
        liveProjects: snapshot.overview.liveProjects ?? null,
        headcount: snapshot.overview.headcount ?? null,
        cashPosition: snapshot.overview.cashPosition ?? null,
        reportingCurrency: snapshot.overview.reportingCurrency ?? null,
        balanceSheetAvailable: balanceSheet != null,
        dataGapCount: snapshot.dataGaps?.length ?? 0,
        message: question
          ? `Unified org context for: ${question}`
          : "Unified org context ready.",
      },
      groundingContract: {
        rule: "Answer only from this payload. Never invent figures, people, or statuses.",
        onMissing: "Say plainly what is unknown or restricted — do not guess.",
      },
    });
  } catch (error) {
    return toolError(
      "getOrgContext",
      error instanceof Error ? error.message : "Failed to load org context",
      [],
    );
  }
}
