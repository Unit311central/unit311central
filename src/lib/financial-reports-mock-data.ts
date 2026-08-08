/** Demo-only mock data for the Financial Reports centre. No persistence / APIs. */

export type FinancialReportCategory =
  | "Profit & Loss"
  | "Balance Sheet"
  | "Cash Flow"
  | "Receivables"
  | "Payables"
  | "Ledger"
  | "Expenses"
  | "Tax"
  | "Budget"
  | "Banking"
  | "Custom";

export type FinancialReportPeriodKind = "Live" | "Monthly" | "Quarterly" | "Yearly" | "Custom";

export type FinancialReportFormat = "PDF" | "Excel" | "CSV";

export type FinancialReportStatus = "Ready" | "Draft" | "Generating" | "Failed";

export type FinancialReportType =
  | "Profit & Loss"
  | "Balance Sheet"
  | "Cash Flow"
  | "Trial Balance"
  | "General Ledger"
  | "Accounts Receivable"
  | "Accounts Payable"
  | "Expense Report"
  | "Budget vs Actual"
  | "Custom Report";

export type FinancialReportGeneration = {
  id: string;
  generatedAt: string;
  generatedBy: string;
  format: FinancialReportFormat;
  status: FinancialReportStatus;
  note?: string;
};

export type FinancialReportRecord = {
  id: string;
  name: string;
  category: FinancialReportCategory;
  reportType: FinancialReportType;
  periodKind: FinancialReportPeriodKind;
  periodLabel: string;
  createdBy: string;
  lastGenerated: string | null;
  formats: FinancialReportFormat[];
  primaryFormat: FinancialReportFormat;
  status: FinancialReportStatus;
  description: string;
  organisation: string;
  department: string;
  project: string;
  currency: string;
  includeCharts: boolean;
  includeNotes: boolean;
  maturity: "Draft" | "Final";
  dateFrom?: string;
  dateTo?: string;
  history: FinancialReportGeneration[];
};

export const FINANCIAL_REPORT_TYPES: FinancialReportType[] = [
  "Profit & Loss",
  "Balance Sheet",
  "Cash Flow",
  "Trial Balance",
  "General Ledger",
  "Accounts Receivable",
  "Accounts Payable",
  "Expense Report",
  "Budget vs Actual",
  "Custom Report",
];

export const FINANCIAL_REPORT_PERIOD_KINDS: FinancialReportPeriodKind[] = [
  "Live",
  "Monthly",
  "Quarterly",
  "Yearly",
  "Custom",
];

export const FINANCIAL_REPORT_ORGANISATIONS = [
  "Unit311 Central",
  "Unit311 Holdings",
  "All entities",
] as const;

export const DEMO_FINANCIAL_REPORT_ORGANISATIONS = [
  "Meridian Atlas Group",
  "Meridian Atlas Holdings",
  "All entities",
] as const;

export const FINANCIAL_REPORT_DEPARTMENTS = [
  "All departments",
  "Finance",
  "Operations",
  "Sales",
  "Engineering",
] as const;

export const FINANCIAL_REPORT_PROJECTS = [
  "All projects",
  "Unassigned",
  "Platform Core",
  "Client Delivery",
] as const;

export const FINANCIAL_REPORT_CURRENCIES = ["EUR", "GBP", "USD", "AUD"] as const;

export type CreateReportDraft = {
  reportType: FinancialReportType | null;
  periodKind: FinancialReportPeriodKind;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  organisation: string;
  department: string;
  project: string;
  currency: string;
  includeCharts: boolean;
  includeNotes: boolean;
  maturity: "Draft" | "Final";
  outputs: FinancialReportFormat[];
  name: string;
};

export function createBlankReportDraft(options?: {
  demo?: boolean;
  talanton?: boolean;
  abhi?: boolean;
}): CreateReportDraft {
  const demo = options?.demo ?? false;
  const talanton = options?.talanton ?? false;
  const abhi = options?.abhi ?? false;
  return {
    reportType: null,
    periodKind: "Monthly",
    periodLabel: abhi ? "August 2026" : "June 2026",
    dateFrom: abhi ? "2026-08-01" : "2026-06-01",
    dateTo: abhi ? "2026-08-31" : "2026-06-30",
    organisation: abhi
      ? "Association of British HealthTech Industries"
      : talanton
        ? "Talanton Impact Fund"
        : demo
          ? "Meridian Atlas Group"
          : "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: abhi || demo ? "GBP" : talanton ? "USD" : "EUR",
    includeCharts: true,
    includeNotes: true,
    maturity: "Final",
    outputs: ["PDF", "Excel"],
    name: "",
  };
}

function todayLabel() {
  return "Today";
}

function categoryForType(type: FinancialReportType): FinancialReportCategory {
  switch (type) {
    case "Profit & Loss":
      return "Profit & Loss";
    case "Balance Sheet":
      return "Balance Sheet";
    case "Cash Flow":
      return "Cash Flow";
    case "Accounts Receivable":
      return "Receivables";
    case "Accounts Payable":
      return "Payables";
    case "General Ledger":
    case "Trial Balance":
      return "Ledger";
    case "Expense Report":
      return "Expenses";
    case "Budget vs Actual":
      return "Budget";
    default:
      return "Custom";
  }
}

export function reportStatusClass(status: FinancialReportStatus) {
  if (status === "Ready") return "border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
  if (status === "Draft") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  if (status === "Generating") return "border-sky-400/35 bg-sky-500/15 text-sky-200";
  return "border-rose-400/35 bg-rose-500/15 text-rose-200";
}

export function formatBadgeClass(format: FinancialReportFormat) {
  if (format === "PDF") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (format === "Excel") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  return "border-sky-400/30 bg-sky-500/10 text-sky-100";
}

export function buildReportFromDraft(draft: CreateReportDraft, id: string): FinancialReportRecord {
  const reportType = draft.reportType ?? "Custom Report";
  const name =
    draft.name.trim() ||
    `${reportType}${draft.periodLabel ? ` — ${draft.periodLabel}` : ""}`;
  const primaryFormat = draft.outputs[0] ?? "PDF";
  const now = new Date().toISOString();

  return {
    id,
    name,
    category: categoryForType(reportType),
    reportType,
    periodKind: draft.periodKind,
    periodLabel: draft.periodLabel || draft.periodKind,
    createdBy: "You",
    lastGenerated: draft.maturity === "Final" ? todayLabel() : null,
    formats: draft.outputs.length > 0 ? draft.outputs : ["PDF"],
    primaryFormat,
    status: draft.maturity === "Draft" ? "Draft" : "Ready",
    description: `${reportType} for ${draft.organisation}. ${draft.maturity} pack covering ${draft.periodLabel || draft.periodKind}.`,
    organisation: draft.organisation,
    department: draft.department,
    project: draft.project,
    currency: draft.currency,
    includeCharts: draft.includeCharts,
    includeNotes: draft.includeNotes,
    maturity: draft.maturity,
    dateFrom: draft.dateFrom,
    dateTo: draft.dateTo,
    history:
      draft.maturity === "Final"
        ? [
            {
              id: `${id}-gen-1`,
              generatedAt: now,
              generatedBy: "You",
              format: primaryFormat,
              status: "Ready",
              note: "Generated from Create Report wizard",
            },
          ]
        : [],
  };
}

export const SEED_FINANCIAL_REPORTS: FinancialReportRecord[] = [
  {
    id: "rpt-pl-jun-2026",
    name: "Profit & Loss Statement",
    category: "Profit & Loss",
    reportType: "Profit & Loss",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "Jane Smith",
    lastGenerated: "Today",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description:
      "Consolidated income statement including revenue, COGS, operating expenses, and net profit for the selected month.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: true,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-pl-3",
        generatedAt: "2026-07-20T09:14:00.000Z",
        generatedBy: "Jane Smith",
        format: "PDF",
        status: "Ready",
      },
      {
        id: "h-pl-2",
        generatedAt: "2026-07-01T08:02:00.000Z",
        generatedBy: "Jane Smith",
        format: "Excel",
        status: "Ready",
      },
      {
        id: "h-pl-1",
        generatedAt: "2026-06-30T17:40:00.000Z",
        generatedBy: "Finance Team",
        format: "PDF",
        status: "Ready",
        note: "Month-end close pack",
      },
    ],
  },
  {
    id: "rpt-bs-q2-2026",
    name: "Balance Sheet",
    category: "Balance Sheet",
    reportType: "Balance Sheet",
    periodKind: "Quarterly",
    periodLabel: "Q2 2026",
    createdBy: "John Adams",
    lastGenerated: "Yesterday",
    formats: ["PDF"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Statement of financial position as at quarter end — assets, liabilities, and equity.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-04-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-bs-1",
        generatedAt: "2026-07-19T16:22:00.000Z",
        generatedBy: "John Adams",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-cf-jun-2026",
    name: "Cash Flow Statement",
    category: "Cash Flow",
    reportType: "Cash Flow",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "Sarah Brown",
    lastGenerated: "Today",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Operating, investing, and financing cash movements for the month.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: true,
    includeNotes: false,
    maturity: "Final",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-cf-1",
        generatedAt: "2026-07-20T10:05:00.000Z",
        generatedBy: "Sarah Brown",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-ar-ageing",
    name: "Accounts Receivable Ageing",
    category: "Receivables",
    reportType: "Accounts Receivable",
    periodKind: "Live",
    periodLabel: "Live",
    createdBy: "Finance",
    lastGenerated: "Today",
    formats: ["Excel", "CSV"],
    primaryFormat: "Excel",
    status: "Ready",
    description: "Open customer balances bucketed by current, 30, 60, and 90+ days overdue.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: true,
    includeNotes: false,
    maturity: "Final",
    history: [
      {
        id: "h-ar-1",
        generatedAt: "2026-07-20T11:30:00.000Z",
        generatedBy: "Finance",
        format: "Excel",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-ap-ageing",
    name: "Accounts Payable Ageing",
    category: "Payables",
    reportType: "Accounts Payable",
    periodKind: "Live",
    periodLabel: "Live",
    createdBy: "Finance",
    lastGenerated: "Today",
    formats: ["Excel", "CSV"],
    primaryFormat: "Excel",
    status: "Ready",
    description: "Supplier balances due by ageing bucket for cash planning.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    history: [
      {
        id: "h-ap-1",
        generatedAt: "2026-07-20T11:32:00.000Z",
        generatedBy: "Finance",
        format: "Excel",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-gl-jun-2026",
    name: "General Ledger Summary",
    category: "Ledger",
    reportType: "General Ledger",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "Finance Team",
    lastGenerated: "Today",
    formats: ["PDF", "Excel", "CSV"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Account-level debit/credit totals for the month with opening and closing balances.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-gl-1",
        generatedAt: "2026-07-20T08:45:00.000Z",
        generatedBy: "Finance Team",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-expense-jun",
    name: "Expense Analysis",
    category: "Expenses",
    reportType: "Expense Report",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "Sarah Brown",
    lastGenerated: "Yesterday",
    formats: ["Excel", "PDF"],
    primaryFormat: "Excel",
    status: "Ready",
    description: "Spend by category, department, and vendor with variance against prior month.",
    organisation: "Unit311 Central",
    department: "All departments",
    project: "All projects",
    currency: "EUR",
    includeCharts: true,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-ex-1",
        generatedAt: "2026-07-19T14:10:00.000Z",
        generatedBy: "Sarah Brown",
        format: "Excel",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-bank-recon",
    name: "Bank Reconciliation",
    category: "Banking",
    reportType: "Custom Report",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "John Adams",
    lastGenerated: "Yesterday",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Matched and unmatched bank lines versus ledger cash accounts for month end.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "Unassigned",
    currency: "EUR",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-br-1",
        generatedAt: "2026-07-19T18:05:00.000Z",
        generatedBy: "John Adams",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-gst-vat",
    name: "GST / VAT Summary",
    category: "Tax",
    reportType: "Custom Report",
    periodKind: "Quarterly",
    periodLabel: "Q2 2026",
    createdBy: "Jane Smith",
    lastGenerated: "3 days ago",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Output and input tax totals with net payable / reclaimable position for the quarter.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-04-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-tax-1",
        generatedAt: "2026-07-17T12:00:00.000Z",
        generatedBy: "Jane Smith",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-trial-balance",
    name: "Trial Balance",
    category: "Ledger",
    reportType: "Trial Balance",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "Finance Team",
    lastGenerated: "Today",
    formats: ["Excel", "PDF"],
    primaryFormat: "Excel",
    status: "Ready",
    description: "Debit and credit trial balance by account code prior to period close.",
    organisation: "Unit311 Central",
    department: "Finance",
    project: "All projects",
    currency: "EUR",
    includeCharts: false,
    includeNotes: false,
    maturity: "Final",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "h-tb-1",
        generatedAt: "2026-07-20T07:55:00.000Z",
        generatedBy: "Finance Team",
        format: "Excel",
        status: "Ready",
      },
    ],
  },
  {
    id: "rpt-budget-vs-actual",
    name: "Budget vs Actual",
    category: "Budget",
    reportType: "Budget vs Actual",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "Jane Smith",
    lastGenerated: null,
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Draft",
    description: "Budget variance by department with commentary placeholders for leadership review.",
    organisation: "Unit311 Central",
    department: "All departments",
    project: "All projects",
    currency: "EUR",
    includeCharts: true,
    includeNotes: true,
    maturity: "Draft",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [],
  },
];

export const TALANTON_FINANCIAL_REPORT_ORGANISATIONS = [
  "Talanton Impact Fund",
  "Talanton Impact GP",
  "All entities",
] as const;

export const TALANTON_SEED_FINANCIAL_REPORTS: FinancialReportRecord[] = [
  {
    id: "ti-rpt-pl-q2-2026",
    name: "Fund Profit & Loss",
    category: "Profit & Loss",
    reportType: "Profit & Loss",
    periodKind: "Quarterly",
    periodLabel: "Q2 2026",
    createdBy: "Andy Moore",
    lastGenerated: "Today",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description:
      "Quarterly fund P&L — management fees, fund expenses, and net investment income in USD.",
    organisation: "Talanton Impact Fund",
    department: "Finance",
    project: "All projects",
    currency: "USD",
    includeCharts: true,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-04-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "ti-h-pl-1",
        generatedAt: "2026-07-08T14:00:00.000Z",
        generatedBy: "Andy Moore",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "ti-rpt-bs-jun-2026",
    name: "Fund Balance Sheet",
    category: "Balance Sheet",
    reportType: "Balance Sheet",
    periodKind: "Monthly",
    periodLabel: "June 2026",
    createdBy: "Mercy Nelima",
    lastGenerated: "Today",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Statement of financial position — cash, investments, and fund liabilities.",
    organisation: "Talanton Impact Fund",
    department: "Finance",
    project: "All projects",
    currency: "USD",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "ti-h-bs-1",
        generatedAt: "2026-07-05T11:30:00.000Z",
        generatedBy: "Mercy Nelima",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "ti-rpt-cf-q2-2026",
    name: "Fund Cash Flow",
    category: "Cash Flow",
    reportType: "Cash Flow",
    periodKind: "Quarterly",
    periodLabel: "Q2 2026",
    createdBy: "Carol Rubiro",
    lastGenerated: "Today",
    formats: ["PDF"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Operating, investing, and financing cash flows for the impact fund.",
    organisation: "Talanton Impact Fund",
    department: "Fund Operations",
    project: "All projects",
    currency: "USD",
    includeCharts: true,
    includeNotes: false,
    maturity: "Final",
    dateFrom: "2026-04-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "ti-h-cf-1",
        generatedAt: "2026-07-10T09:00:00.000Z",
        generatedBy: "Carol Rubiro",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "ti-rpt-mgmt-fees-2026",
    name: "Management Fee & Operating Expense Report",
    category: "Expenses",
    reportType: "Expense Report",
    periodKind: "Yearly",
    periodLabel: "FY 2026",
    createdBy: "Andy Moore",
    lastGenerated: null,
    formats: ["PDF", "Excel"],
    primaryFormat: "Excel",
    status: "Draft",
    description:
      "YTD management fees, fund administration, and GP operating expenses for LP reporting.",
    organisation: "Talanton Impact GP",
    department: "Finance",
    project: "All projects",
    currency: "USD",
    includeCharts: true,
    includeNotes: true,
    maturity: "Draft",
    dateFrom: "2026-01-01",
    dateTo: "2026-06-30",
    history: [],
  },
  {
    id: "ti-rpt-lp-capital",
    name: "LP Capital Account Summary",
    category: "Custom",
    reportType: "Custom Report",
    periodKind: "Quarterly",
    periodLabel: "Q2 2026",
    createdBy: "Michelle Ochieng",
    lastGenerated: "Today",
    formats: ["PDF"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Limited partner capital accounts, contributions, and distributions summary.",
    organisation: "Talanton Impact Fund",
    department: "Investor Relations",
    project: "All projects",
    currency: "USD",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-04-01",
    dateTo: "2026-06-30",
    history: [
      {
        id: "ti-h-lp-1",
        generatedAt: "2026-07-15T16:45:00.000Z",
        generatedBy: "Michelle Ochieng",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
];

export const ABHI_FINANCIAL_REPORT_ORGANISATIONS = [
  "Association of British HealthTech Industries",
  "ABHI Events Ltd",
  "All entities",
] as const;

export const ABHI_SEED_FINANCIAL_REPORTS: FinancialReportRecord[] = [
  {
    id: "abhi-rpt-pl-ytd-2026",
    name: "Membership & Services P&L",
    category: "Profit & Loss",
    reportType: "Profit & Loss",
    periodKind: "Yearly",
    periodLabel: "YTD 2026",
    createdBy: "Jane Lewis",
    lastGenerated: "Today",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description:
      "Year-to-date profit and loss — membership income, events revenue, and operating expenditure.",
    organisation: "Association of British HealthTech Industries",
    department: "Finance",
    project: "All projects",
    currency: "GBP",
    includeCharts: true,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-01-01",
    dateTo: "2026-08-08",
    history: [
      {
        id: "abhi-h-pl-1",
        generatedAt: "2026-08-08T09:00:00.000Z",
        generatedBy: "Jane Lewis",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "abhi-rpt-bs-aug-2026",
    name: "Balance Sheet",
    category: "Balance Sheet",
    reportType: "Balance Sheet",
    periodKind: "Monthly",
    periodLabel: "August 2026",
    createdBy: "Jane Lewis",
    lastGenerated: "Today",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Statement of financial position — £1.0m cash, receivables, and liabilities.",
    organisation: "Association of British HealthTech Industries",
    department: "Finance",
    project: "All projects",
    currency: "GBP",
    includeCharts: false,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-08-01",
    dateTo: "2026-08-31",
    history: [
      {
        id: "abhi-h-bs-1",
        generatedAt: "2026-08-07T11:00:00.000Z",
        generatedBy: "Jane Lewis",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
  {
    id: "abhi-rpt-cf-ytd-2026",
    name: "Cash Flow Statement",
    category: "Cash Flow",
    reportType: "Cash Flow",
    periodKind: "Yearly",
    periodLabel: "YTD 2026",
    createdBy: "Peter Ellingworth",
    lastGenerated: "Today",
    formats: ["PDF"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Operating, investing, and financing cash flows for the membership year.",
    organisation: "Association of British HealthTech Industries",
    department: "Finance",
    project: "All projects",
    currency: "GBP",
    includeCharts: true,
    includeNotes: false,
    maturity: "Final",
    dateFrom: "2026-01-01",
    dateTo: "2026-08-08",
    history: [],
  },
  {
    id: "abhi-rpt-ar-aug-2026",
    name: "Membership Receivables Ageing",
    category: "Receivables",
    reportType: "Accounts Receivable",
    periodKind: "Live",
    periodLabel: "Live",
    createdBy: "Finance Team",
    lastGenerated: "Today",
    formats: ["PDF", "Excel", "CSV"],
    primaryFormat: "Excel",
    status: "Ready",
    description: "Outstanding membership invoices by ageing bucket.",
    organisation: "Association of British HealthTech Industries",
    department: "Finance",
    project: "All projects",
    currency: "GBP",
    includeCharts: false,
    includeNotes: false,
    maturity: "Final",
    history: [],
  },
  {
    id: "abhi-rpt-ap-aug-2026",
    name: "Creditors & Payables",
    category: "Payables",
    reportType: "Accounts Payable",
    periodKind: "Monthly",
    periodLabel: "August 2026",
    createdBy: "Finance Team",
    lastGenerated: "Today",
    formats: ["PDF", "Excel"],
    primaryFormat: "Excel",
    status: "Ready",
    description: "Open supplier and expense payables due in August.",
    organisation: "Association of British HealthTech Industries",
    department: "Finance",
    project: "All projects",
    currency: "GBP",
    includeCharts: false,
    includeNotes: false,
    maturity: "Final",
    dateFrom: "2026-08-01",
    dateTo: "2026-08-31",
    history: [],
  },
  {
    id: "abhi-rpt-exp-mtd-aug",
    name: "Expense Report — August MTD",
    category: "Expenses",
    reportType: "Expense Report",
    periodKind: "Monthly",
    periodLabel: "August 2026 (MTD)",
    createdBy: "Operations",
    lastGenerated: "Today",
    formats: ["PDF", "Excel", "CSV"],
    primaryFormat: "Excel",
    status: "Ready",
    description: "Staff expenses and programme spend submitted in August 2026.",
    organisation: "Association of British HealthTech Industries",
    department: "Operations",
    project: "All projects",
    currency: "GBP",
    includeCharts: true,
    includeNotes: true,
    maturity: "Draft",
    dateFrom: "2026-08-01",
    dateTo: "2026-08-08",
    history: [
      {
        id: "abhi-h-exp-1",
        generatedAt: "2026-08-08T08:30:00.000Z",
        generatedBy: "Operations",
        format: "Excel",
        status: "Ready",
      },
    ],
  },
  {
    id: "abhi-rpt-budget-aug",
    name: "Budget vs Actual",
    category: "Budget",
    reportType: "Budget vs Actual",
    periodKind: "Monthly",
    periodLabel: "August 2026",
    createdBy: "Jane Lewis",
    lastGenerated: "Yesterday",
    formats: ["PDF", "Excel"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Membership, events, and overhead budget variance for the current month.",
    organisation: "Association of British HealthTech Industries",
    department: "Finance",
    project: "All projects",
    currency: "GBP",
    includeCharts: true,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-08-01",
    dateTo: "2026-08-31",
    history: [],
  },
  {
    id: "abhi-rpt-board-fin",
    name: "Board Pack — Financial Annex",
    category: "Custom",
    reportType: "Custom Report",
    periodKind: "Monthly",
    periodLabel: "August 2026",
    createdBy: "Board Secretariat",
    lastGenerated: "Today",
    formats: ["PDF"],
    primaryFormat: "PDF",
    status: "Ready",
    description: "Cash position, burn rate, and membership revenue summary for board review.",
    organisation: "Association of British HealthTech Industries",
    department: "Executive",
    project: "All projects",
    currency: "GBP",
    includeCharts: true,
    includeNotes: true,
    maturity: "Final",
    dateFrom: "2026-08-01",
    dateTo: "2026-08-31",
    history: [
      {
        id: "abhi-h-board-1",
        generatedAt: "2026-08-05T14:00:00.000Z",
        generatedBy: "Board Secretariat",
        format: "PDF",
        status: "Ready",
      },
    ],
  },
];

export function getFinancialReportOrganisations(options?: {
  demo?: boolean;
  talanton?: boolean;
  abhi?: boolean;
}) {
  if (options?.abhi) return ABHI_FINANCIAL_REPORT_ORGANISATIONS;
  if (options?.talanton) return TALANTON_FINANCIAL_REPORT_ORGANISATIONS;
  if (options?.demo) return DEMO_FINANCIAL_REPORT_ORGANISATIONS;
  return FINANCIAL_REPORT_ORGANISATIONS;
}

export function getSeedFinancialReports(options?: {
  demo?: boolean;
  talanton?: boolean;
  abhi?: boolean;
}): FinancialReportRecord[] {
  const demo = options?.demo ?? false;
  const talanton = options?.talanton ?? false;
  const abhi = options?.abhi ?? false;
  if (abhi) return ABHI_SEED_FINANCIAL_REPORTS;
  if (talanton) return TALANTON_SEED_FINANCIAL_REPORTS;
  if (!demo) return SEED_FINANCIAL_REPORTS;
  return SEED_FINANCIAL_REPORTS.map((report) => ({
    ...report,
    organisation: "Meridian Atlas Group",
    currency: "GBP",
  }));
}

export function periodLabelForKind(kind: FinancialReportPeriodKind): string {
  switch (kind) {
    case "Live":
      return "Live";
    case "Monthly":
      return "June 2026";
    case "Quarterly":
      return "Q2 2026";
    case "Yearly":
      return "FY 2026";
    case "Custom":
      return "Custom range";
    default:
      return kind;
  }
}
