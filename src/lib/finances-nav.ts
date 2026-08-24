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

/** Placeholder leaves — professional empty state until underlying workflows ship. */
export const FINANCES_SHELL_VIEWS = [
  "finances-ar-collections",
  "finances-ar-reporting",
  "finances-ap-payments",
  "finances-expense-approvals",
  "finances-expense-categories",
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

export type FinancesShellConfig = {
  areaLabel: string;
  sectionLabel: string;
  summary: string;
  relatedView?: InternalOperationsView;
  relatedLabel?: string;
};

export const FINANCES_SHELL_CONFIG: Record<FinancesShellView, FinancesShellConfig> = {
  "finances-ar-collections": {
    areaLabel: "Accounts Receivable",
    sectionLabel: "Collections",
    summary:
      "Collections workflows will consolidate chase activity, payment plans, and Wise payment matching here. Use Accounts Receivable today to sync Wise payments against open invoices.",
    relatedView: "accounts-receivable",
    relatedLabel: "Open Accounts Receivable",
  },
  "finances-ar-reporting": {
    areaLabel: "Accounts Receivable",
    sectionLabel: "AR Reporting",
    summary:
      "Dedicated AR reporting packs are planned. Use Financial Reports for published statements and the Finances dashboard for live AR ageing.",
    relatedView: "financial-reports",
    relatedLabel: "Open Financial Reports",
  },
  "finances-ap-payments": {
    areaLabel: "Accounts Payable",
    sectionLabel: "Payments",
    summary:
      "Supplier payment runs and treasury funding will surface here. Review outstanding payables and supplier invoice drafts in Accounts Payable today.",
    relatedView: "accounts-payable",
    relatedLabel: "Open Accounts Payable",
  },
  "finances-expense-approvals": {
    areaLabel: "Expenses",
    sectionLabel: "Approvals",
    summary:
      "Review submitted employee expenses, approve reimbursements, and request changes.",
    relatedView: "expenses",
    relatedLabel: "Open Expenses approvals",
  },
  "finances-expense-categories": {
    areaLabel: "Expenses",
    sectionLabel: "Configuration",
    summary:
      "Manage workspace expense categories, billing codes, mileage rates, and payment schedule.",
    relatedView: "expenses",
    relatedLabel: "Open Expenses configuration",
  },
  "finances-banking-cash-position": {
    areaLabel: "Banking & Cash",
    sectionLabel: "Cash Position",
    summary:
      "Consolidated cash position dashboards will roll up Wise balances and manual accounts here. Use Bank for live Wise balances and treasury activity today.",
    relatedView: "wise",
    relatedLabel: "Open Bank",
  },
  "finances-banking-reconciliation": {
    areaLabel: "Banking & Cash",
    sectionLabel: "Reconciliation",
    summary:
      "Bank reconciliation tooling is planned. Match customer receipts via Accounts Receivable Wise sync and review treasury activity under Bank.",
    relatedView: "accounts-receivable",
    relatedLabel: "Open Accounts Receivable",
  },
  "finances-planning-budget": {
    areaLabel: "Planning & Management",
    sectionLabel: "Budget",
    summary: "Budget authoring and departmental envelopes are not configured for this workspace yet.",
  },
  "finances-planning-actual-vs-budget": {
    areaLabel: "Planning & Management",
    sectionLabel: "Actual vs Budget",
    summary: "Variance analysis against approved budgets will appear here once budget baselines exist.",
  },
  "finances-planning-cash-flow": {
    areaLabel: "Planning & Management",
    sectionLabel: "Cash Flow",
    summary: "Rolling cash-flow forecasts will build on ledger, AR, and AP feeds when planning is enabled.",
  },
  "finances-planning-forecast": {
    areaLabel: "Planning & Management",
    sectionLabel: "Forecast",
    summary: "Scenario forecasting is not available yet. Use the Finances dashboard for current-month movement.",
    relatedView: "financials",
    relatedLabel: "Open Finances dashboard",
  },
  "finances-planning-kpis": {
    areaLabel: "Planning & Management",
    sectionLabel: "Financial KPIs",
    summary: "Executive KPI packs for finance will be curated here alongside the Finances dashboard tiles.",
    relatedView: "financials",
    relatedLabel: "Open Finances dashboard",
  },
  "finances-planning-management-accounts": {
    areaLabel: "Planning & Management",
    sectionLabel: "Management Accounts",
    summary:
      "Management account packs will complement Financial Reports. Published statements remain under Financial Reports today.",
    relatedView: "financial-reports",
    relatedLabel: "Open Financial Reports",
  },
};

export function isFinancesShellView(view: string | null | undefined): view is FinancesShellView {
  return (FINANCES_SHELL_VIEWS as readonly string[]).includes(String(view ?? ""));
}

/** Customer workspaces hide unfinished Finances leaves from navigation. */
export function shouldHideFinancesShellLeaves(input: {
  workspaceSlug?: string | null;
  workspaceType?: string | null;
}): boolean {
  const slug = String(input.workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  const type = String(input.workspaceType ?? "")
    .trim()
    .toLowerCase();
  if (type === "demo" || slug === "demo") return false;
  if (type === "internal") return false;
  return true;
}

function filterFinancesNavItem(
  item: InternalNavItem,
  hideUnfinishedLeaves: boolean,
): InternalNavItem | null {
  if (!item.children?.length) {
    if (!hideUnfinishedLeaves || !item.view || !isFinancesShellView(item.view)) {
      return item;
    }
    return null;
  }

  const children = item.children.filter(
    (child) => !hideUnfinishedLeaves || !child.view || !isFinancesShellView(child.view),
  );
  if (children.length === 0) return null;
  return { ...item, children };
}

export function buildFinancesNavSection(options?: {
  color?: string;
  icon?: string;
  hideUnfinishedLeaves?: boolean;
}): InternalNavSection {
  const hideUnfinishedLeaves = options?.hideUnfinishedLeaves === true;
  const items: InternalNavItem[] = [
    { label: "Dashboard", icon: "LayoutDashboard", view: "financials" },
    {
      label: "Accounting",
      icon: "ScrollText",
      children: [
        { label: "General Ledger", view: "general-ledger", query: { tab: "journal" } },
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
        { label: "Financial KPIs", view: "finances-planning-kpis" },
        { label: "Management Accounts", view: "finances-planning-management-accounts" },
      ],
    },
    { label: "Financial Reports", icon: "FileText", view: "financial-reports" },
  ];

  const filteredItems = hideUnfinishedLeaves
    ? items
        .map((item) => filterFinancesNavItem(item, hideUnfinishedLeaves))
        .filter((item): item is InternalNavItem => item !== null)
    : items;

  return {
    kind: "workspace",
    label: FINANCES_MODULE_LABEL,
    icon: options?.icon ?? "Wallet",
    color: options?.color ?? FINANCES_ACCENT,
    items: filteredItems,
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
    label: "Accounting",
    description: "General ledger, chart of accounts, trial balance, and journals.",
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
    description: "Wise treasury, balances, and payment activity.",
    view: "wise",
  },
  {
    label: "Planning & Management",
    description: "Budget, forecast, and management reporting (in progress).",
    view: "finances-planning-budget",
  },
  {
    label: "Financial Reports",
    description: "Published statements and statutory packs.",
    view: "financial-reports",
  },
];
