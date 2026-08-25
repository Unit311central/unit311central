import type { InternalNavItem, InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** User-facing module label (canonical module id stays `financials`). */
export const FINANCES_MODULE_LABEL = "Finances";

/** Breadcrumb / page subtitle for all Finances leaves. */
export const FINANCES_MODULE_SUBTITLE = "Finances";

/** Canonical application-catalogue module id — do not rename. */
export const FINANCES_CANONICAL_MODULE_ID = "financials";

/** Legacy section label kept for migration checks only. */
export const LEGACY_FINANCIALS_MODULE_LABEL = "Financials";

const FINANCES_ACCENT = "#166534";

/** Views that may carry `tab`, `filter`, or `section` query params in the URL. */
export const FINANCES_QUERY_PARAM_VIEWS: ReadonlySet<InternalOperationsView> = new Set([
  "general-ledger",
  "accounts-receivable",
  "accounts-payable",
  "expenses",
  "wise",
  "financial-reports",
]);

/** Extended Finances leaves (planning, collections, treasury sub-areas). */
export const FINANCES_SHELL_VIEWS = [
  "finances-ar-collections",
  "finances-ar-reporting",
  "finances-ap-payments",
  "finances-banking-cash-position",
  "finances-banking-reconciliation",
  "finances-planning-budget",
  "finances-planning-actual-vs-budget",
  "finances-planning-cash-flow",
  "finances-planning-forecast",
  "finances-planning-kpis",
  "finances-planning-management-accounts",
] as const satisfies readonly InternalOperationsView[];

export type FinancesShellView = (typeof FINANCES_SHELL_VIEWS)[number];

export function isFinancesShellView(view: string | null | undefined): view is FinancesShellView {
  return (FINANCES_SHELL_VIEWS as readonly string[]).includes(String(view ?? ""));
}

export function buildFinancesNavSection(options?: {
  color?: string;
  icon?: string;
}): InternalNavSection {
  const items: InternalNavItem[] = [
    { label: "Dashboard", icon: "LayoutDashboard", view: "financials" },
    {
      label: "General Ledger",
      icon: "ScrollText",
      children: [
        { label: "Chart of Accounts", view: "general-ledger", query: { tab: "accounts" } },
        { label: "Trial Balance", view: "general-ledger", query: { tab: "trial" } },
        { label: "Journals", view: "general-ledger", query: { tab: "journal" } },
      ],
    },
    {
      label: "Accounts Receivable",
      icon: "ArrowDownLeft",
      children: [
        { label: "Invoices", view: "accounts-receivable" },
        { label: "Outstanding", view: "accounts-receivable", query: { filter: "outstanding" } },
        { label: "Overdue", view: "accounts-receivable", query: { filter: "overdue" } },
        { label: "Collections", view: "finances-ar-collections" },
        { label: "AR Reporting", view: "finances-ar-reporting" },
      ],
    },
    {
      label: "Accounts Payable",
      icon: "ArrowUpRight",
      children: [
        { label: "Supplier Invoices", view: "accounts-payable", query: { section: "invoices" } },
        { label: "Approvals", view: "accounts-payable", query: { section: "approvals" } },
        { label: "Outstanding", view: "accounts-payable", query: { section: "outstanding" } },
        { label: "Due Dates", view: "accounts-payable", query: { section: "due-dates" } },
        { label: "Payments", view: "finances-ap-payments" },
      ],
    },
    {
      label: "Expenses",
      icon: "Receipt",
      children: [
        { label: "My Expenses", view: "expenses" },
        { label: "Add Expense", view: "expenses", query: { section: "add" } },
        { label: "All Expenses", view: "expenses", query: { section: "all" } },
        { label: "Approvals", view: "expenses", query: { section: "approvals" } },
        { label: "Expense Runs", view: "expenses", query: { section: "runs" } },
        { label: "Configuration", view: "expenses", query: { section: "config" } },
      ],
    },
    {
      label: "Banking & Cash",
      icon: "Landmark",
      children: [
        { label: "Bank", view: "wise" },
        { label: "Cash Position", view: "finances-banking-cash-position" },
        { label: "Reconciliation", view: "finances-banking-reconciliation" },
      ],
    },
    {
      label: "Planning & Management",
      icon: "BarChart3",
      children: [
        { label: "Budget", view: "finances-planning-budget" },
        { label: "Actual vs Budget", view: "finances-planning-actual-vs-budget" },
        { label: "Cash Flow", view: "finances-planning-cash-flow" },
        { label: "Forecast", view: "finances-planning-forecast" },
        { label: "KPIs", view: "finances-planning-kpis" },
        { label: "Management Accounts", view: "finances-planning-management-accounts" },
      ],
    },
    { label: "Financial Reports", icon: "FileText", view: "financial-reports" },
  ];

  return {
    kind: "workspace",
    label: FINANCES_MODULE_LABEL,
    icon: options?.icon ?? "Wallet",
    color: options?.color ?? FINANCES_ACCENT,
    items,
  };
}

/** Functional areas surfaced on the Finances dashboard for drill-down. */
export const FINANCES_DASHBOARD_AREAS: readonly {
  label: string;
  description: string;
  view: InternalOperationsView;
  query?: Record<string, string>;
}[] = [
  {
    label: "General Ledger",
    description: "Chart of accounts, trial balance, and journals.",
    view: "general-ledger",
    query: { tab: "journal" },
  },
  {
    label: "Accounts Receivable",
    description: "Customer invoices, outstanding balances, and collections.",
    view: "accounts-receivable",
  },
  {
    label: "Accounts Payable",
    description: "Supplier invoices, approvals, and outstanding obligations.",
    view: "accounts-payable",
    query: { section: "outstanding" },
  },
  {
    label: "Expenses",
    description: "Reimbursable expense capture and operating spend.",
    view: "expenses",
  },
  {
    label: "Banking & Cash",
    description: "Bank balances, cash position, and reconciliation.",
    view: "wise",
  },
  {
    label: "Planning & Management",
    description: "Budget, forecast, cash flow, and management reporting.",
    view: "finances-planning-budget",
  },
  {
    label: "Financial Reports",
    description: "Published statements and statutory packs.",
    view: "financial-reports",
  },
];
