import type { PlatformSession } from "@/lib/platform-session-token";
import type { InternalOperationsView } from "@/lib/internal-operations-data";

export type ExpenseAccess = {
  canViewMy: boolean;
  canViewAll: boolean;
  canApprove: boolean;
  canConfigure: boolean;
  canManageRuns: boolean;
  canViewBankDetails: boolean;
};

const FINANCE_ADMIN_VIEWS: InternalOperationsView[] = [
  "financials",
  "expenses",
  "finances-expense-approvals",
  "finances-expense-categories",
  "accounts-payable",
  "general-ledger",
];

function hasAnyView(
  allowedViews: InternalOperationsView[] | null | undefined,
  views: InternalOperationsView[],
) {
  if (allowedViews === null) return true;
  if (!allowedViews?.length) return false;
  return views.some((view) => allowedViews.includes(view));
}

export function resolveExpenseAccess(input: {
  session: Pick<PlatformSession, "sub"> & { displayName?: string };
  allowedViews?: InternalOperationsView[] | null;
}): ExpenseAccess {
  const views = input.allowedViews;
  const canFinance = hasAnyView(views, FINANCE_ADMIN_VIEWS);
  const canExpenses = hasAnyView(views, ["expenses"]);

  return {
    canViewMy: Boolean(input.session.sub) && (canExpenses || canFinance || views === null),
    canViewAll: canFinance,
    canApprove: canFinance,
    canConfigure: canFinance,
    canManageRuns: canFinance,
    canViewBankDetails: canFinance,
  };
}
