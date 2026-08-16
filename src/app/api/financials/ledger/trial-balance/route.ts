import { NextResponse } from "next/server";

import { getTrialBalance, getTypeTotals } from "@/lib/accounting/balances";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarLedgerAccounts, getNorthstarTrialBalance } from "@/lib/demo/module-fixtures";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (await isDemoApiRequest()) {
      const rows = getNorthstarTrialBalance();
      const debitTotal = rows.reduce((sum, row) => sum + row.debit, 0);
      const creditTotal = rows.reduce((sum, row) => sum + row.credit, 0);
      const accounts = getNorthstarLedgerAccounts();
      const totals = {
        assets: accounts.filter((a) => a.type === "asset").reduce((s, a) => s + a.balance, 0),
        liabilities: accounts.filter((a) => a.type === "liability").reduce((s, a) => s + a.balance, 0),
        equity: accounts.filter((a) => a.type === "equity").reduce((s, a) => s + a.balance, 0),
        income: accounts.filter((a) => a.type === "income").reduce((s, a) => s + a.balance, 0),
        expenses: accounts.filter((a) => a.type === "expense").reduce((s, a) => s + a.balance, 0),
      };
      return NextResponse.json({
        trialBalance: {
          rows,
          debitTotal,
          creditTotal,
          difference: Math.round((debitTotal - creditTotal) * 100) / 100,
        },
        totals,
      });
    }

    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { isOnwardAirSlug } = await import("@/lib/onwardair-surface");
    if (isOnwardAirSlug(workspace.slug)) {
      const { ensureOnwardAirFinancialsSeeded } = await import(
        "@/lib/onwardair/financials-seed"
      );
      await ensureOnwardAirFinancialsSeeded(workspace.id);
    }
    const scope = { workspaceId: workspace.id };
    const [trialBalance, totals] = await Promise.all([
      getTrialBalance(scope),
      getTypeTotals(scope),
    ]);
    return NextResponse.json({ trialBalance, totals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load trial balance.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
