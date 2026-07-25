import { getFinancialOverview } from "@/lib/accounting/overview-service";
import { listExpenses } from "@/lib/financial-expenses-service";
import { listHrEmployees } from "@/lib/hr-employees-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import { listProjects } from "@/lib/internal-projects-service";
import { listLeads } from "@/lib/crm-leads-service";
import { calculateLivePayrollSnapshot } from "@/lib/payroll/payroll-service";
import { isLiveInvoiceOverdue, loadLiveInvoices } from "./live-finance";
import type { AssistantToolExecutionContext } from "./tool-result";
import {
  asNumber,
  asString,
  matchesQuery,
  toolError,
  toolForbidden,
  toolOk,
  type AssistantFollowUpAction,
  type AssistantToolResult,
} from "./tool-result";

function nav(href: string, label: string): AssistantFollowUpAction {
  return { id: `nav_${href}`, label, kind: "navigate", href };
}

export async function searchPerformanceReviews(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessHr) {
    return toolForbidden(
      "searchPerformanceReviews",
      "Your current role cannot access HR performance data.",
    );
  }
  return toolError(
    "searchPerformanceReviews",
    "Waiting for live business data — performance reviews are not connected to live storage yet. I will not invent review records.",
    ["hr-performance:reviews"],
  );
}

export async function searchLeave(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessHr) {
    return toolForbidden("searchLeave", "Your current role cannot access HR leave data.");
  }
  return toolError(
    "searchLeave",
    "Waiting for live business data — leave calendar is not connected to live storage yet. I will not invent who is on leave.",
    ["hr-leave:requests"],
  );
}

export async function searchInvoices(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessFinancials) {
    return toolForbidden(
      "searchInvoices",
      "Your current role cannot access accounts receivable.",
    );
  }

  try {
    const load = await loadLiveInvoices();
    const invoices = load.invoices;
    const query = asString(args.query);
    const outstandingOnly = Boolean(args.outstandingOnly ?? true);
    const overdueOnly = Boolean(args.overdueOnly);

    const filtered = invoices.filter((invoice) => {
      const paid = invoice.status === "paid";
      if (outstandingOnly && (paid || invoice.status === "cancelled" || invoice.status === "draft")) {
        return false;
      }
      if (overdueOnly && !isLiveInvoiceOverdue(invoice)) return false;
      const haystack = [
        invoice.clientName ?? "",
        invoice.invoiceNumber,
        invoice.paymentReference,
        invoice.status,
      ].join(" ");
      return matchesQuery(haystack, query);
    });

    const outstandingTotal = filtered.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);

    return toolOk(
      "searchInvoices",
      filtered.slice(0, 50).map((invoice) => ({
        id: invoice.id,
        clientName: invoice.clientName ?? "Client",
        number: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
        paid: invoice.status === "paid",
        overdue: isLiveInvoiceOverdue(invoice),
      })),
      {
        source: load.ok ? ["finance:invoices:live"] : ["finance:invoices:error"],
        pageSize: asNumber(args.pageSize, 50),
        summary: {
          matched: filtered.length,
          outstandingTotal: Math.round(outstandingTotal * 100) / 100,
          liveOk: load.ok,
          message:
            filtered.length === 0
              ? "There are currently no outstanding invoices."
              : `I found ${filtered.length} outstanding invoice${filtered.length === 1 ? "" : "s"} totalling ${outstandingTotal.toLocaleString("en-GB", {
                  style: "currency",
                  currency: filtered[0]?.currency ?? "GBP",
                  maximumFractionDigits: 0,
                })}.`,
        },
        dataGaps: load.ok ? undefined : [load.error],
        followUpActions: [nav("/?view=accounts-receivable", "Open Accounts Receivable")],
      },
    );
  } catch (error) {
    return toolError(
      "searchInvoices",
      error instanceof Error ? error.message : "Failed to load invoices.",
    );
  }
}

export async function searchExpenses(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessFinancials) {
    return toolForbidden("searchExpenses", "Your current role cannot access expenses.");
  }

  try {
    const expenses = await listExpenses();
    const query = asString(args.query);
    const minAmount = asNumber(args.minAmount, 0);
    const recentOnly = Boolean(args.recentOnly);
    const unpaidOnly = Boolean(args.unpaidOnly);

    let filtered = expenses.filter((expense) => {
      const amount = Number(expense.amount) || 0;
      if (minAmount > 0 && amount < minAmount) return false;
      if (unpaidOnly && expense.paid) return false;
      const haystack = [
        expense.supplier ?? "",
        expense.submitterName ?? "",
        expense.purposeDescription ?? "",
        expense.currency ?? "",
      ].join(" ");
      return matchesQuery(haystack, query);
    });

    if (recentOnly || (!query && minAmount <= 0 && !unpaidOnly)) {
      filtered = [...filtered].sort((a, b) =>
        String(b.expenseDate ?? b.dateSubmitted ?? "").localeCompare(
          String(a.expenseDate ?? a.dateSubmitted ?? ""),
        ),
      );
    }

    const limit = asNumber(args.pageSize, 25);
    const sliced = filtered.slice(0, Math.max(1, Math.min(limit, 100)));
    const total = sliced.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

    return toolOk(
      "searchExpenses",
      sliced.map((expense) => ({
        id: String(expense.id),
        supplier: expense.supplier ?? expense.submitterName ?? "Supplier",
        description: expense.purposeDescription ?? "",
        amount: Number(expense.amount) || 0,
        currency: expense.currency ?? "GBP",
        date: expense.expenseDate ?? expense.dateSubmitted,
        paid: Boolean(expense.paid),
      })),
      {
        source: ["finance:expenses"],
        pageSize: limit,
        summary: {
          matched: filtered.length,
          shown: sliced.length,
          totalAmount: Math.round(total * 100) / 100,
          message:
            sliced.length === 0
              ? "There are currently no expenses matching that request."
              : `I found ${sliced.length} recent expense${sliced.length === 1 ? "" : "s"}.`,
        },
        followUpActions: [nav("/?view=expenses", "Open Expenses")],
      },
    );
  } catch (error) {
    return toolError(
      "searchExpenses",
      error instanceof Error ? error.message : "Failed to load expenses.",
    );
  }
}

export async function getCashPosition(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessFinancials) {
    return toolForbidden("getCashPosition", "Your current role cannot access finance data.");
  }

  try {
    const overview = await getFinancialOverview();
    const cash = overview.cashPosition;
    return toolOk(
      "getCashPosition",
      [
        {
          cashPosition: cash,
          currency: "GBP",
          accountsReceivable: overview.accountsReceivable,
          accountsPayable: overview.accountsPayable,
          monthlyBurn: overview.burnRate.monthly,
          runwayMonths: overview.burnRate.runwayMonths,
          payrollMonthly: overview.payroll.monthly,
        },
      ],
      {
        source: ["finance:overview", "treasury"],
        summary: {
          cashPosition: cash,
          message: `Current bank / cash balance is ${cash.toLocaleString("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0,
          })}.`,
        },
        followUpActions: [
          nav("/?view=financials", "Open Finance"),
          nav("/?view=wise", "Open Bank"),
        ],
      },
    );
  } catch (error) {
    return toolError(
      "getCashPosition",
      error instanceof Error ? error.message : "Failed to load cash position.",
    );
  }
}

export async function getMonthlyPayrollObligation(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessHr && !ctx.business.permissions.canAccessFinancials) {
    return toolForbidden(
      "getMonthlyPayrollObligation",
      "Your current role cannot access payroll figures.",
    );
  }

  try {
    const [snapshot, overview] = await Promise.all([
      calculateLivePayrollSnapshot().catch(() => null),
      getFinancialOverview().catch(() => null),
    ]);

    const monthly = snapshot
      ? Math.round((snapshot.monthlyGross + snapshot.employerTax) * 100) / 100
      : overview?.payroll.monthly ?? 0;
    const employees = snapshot?.employeeCount ?? overview?.payroll.employees ?? 0;
    const nextDate = snapshot?.nextPayrollDate ?? null;
    const currency = snapshot?.currency ?? "GBP";

    return toolOk(
      "getMonthlyPayrollObligation",
      [
        {
          monthly,
          employees,
          nextPayrollDate: nextDate,
          currency,
          liability: monthly,
          gross: snapshot?.monthlyGross ?? monthly,
          employerTax: snapshot?.employerTax ?? 0,
          net: snapshot?.net ?? 0,
        },
      ],
      {
        source: ["payroll:live", "finance:overview"],
        summary: {
          monthly,
          employees,
          nextPayrollDate: nextDate,
          message: `Monthly payroll is ${monthly.toLocaleString("en-GB", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          })} across ${employees} employee${employees === 1 ? "" : "s"}${
            nextDate ? ` (next payroll ${nextDate})` : ""
          }.`,
        },
        followUpActions: [nav("/?view=payroll", "Open Payroll")],
      },
    );
  } catch (error) {
    return toolError(
      "getMonthlyPayrollObligation",
      error instanceof Error ? error.message : "Failed to load payroll obligation.",
    );
  }
}

export async function searchInventory(
  _args: Record<string, unknown>,
  _ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  void _args;
  void _ctx;
  return toolError(
    "searchInventory",
    "Waiting for live business data — inventory is not connected to live storage yet. I will not invent stock or asset counts.",
    ["inventory"],
  );
}

export async function platformSearch(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const query = asString(args.query);
  if (!query) {
    return toolError("platformSearch", "Provide a search query (e.g. a person or company name).");
  }

  try {
    const [employees, clients, projects, leads, invoiceLoad] = await Promise.all([
      ctx.business.permissions.canAccessHr
        ? listHrEmployees().catch(() => [])
        : Promise.resolve([]),
      listInternalClients().catch(() => []),
      listProjects().catch(() => []),
      listLeads().catch(() => []),
      ctx.business.permissions.canAccessFinancials
        ? loadLiveInvoices()
        : Promise.resolve({ ok: true as const, invoices: [], overdue: [] }),
    ]);

    const invoices = invoiceLoad.invoices;

    const hits: Array<Record<string, unknown>> = [];

    for (const employee of employees) {
      if (
        matchesQuery(
          [employee.fullName, employee.email, employee.role, employee.department].join(" "),
          query,
        )
      ) {
        hits.push({
          module: "Employees",
          id: employee.id,
          label: employee.fullName,
          detail: `${employee.role} · ${employee.department}`,
          href: "/?view=hr",
        });
      }
    }

    for (const client of clients) {
      if (
        matchesQuery(
          [
            client.companyName,
            client.primaryContact,
            client.email,
            client.region,
            client.companyCountry ?? "",
          ].join(" "),
          query,
        )
      ) {
        hits.push({
          module: "Clients",
          id: client.id,
          label: client.companyName,
          detail: `${client.primaryContact} · ${client.accountStatus}`,
          href: "/?view=clients",
        });
      }
    }

    for (const project of projects) {
      if (matchesQuery([project.name, project.clientName ?? "", project.notes ?? ""].join(" "), query)) {
        hits.push({
          module: "Projects",
          id: project.id,
          label: project.name,
          detail: `${project.clientName ?? "Internal"} · ${project.phase}`,
          href: "/?view=projects",
        });
      }
    }

    for (const lead of leads) {
      if (
        matchesQuery(
          [lead.contactName, lead.companyName ?? "", lead.email ?? "", lead.role ?? ""].join(" "),
          query,
        )
      ) {
        hits.push({
          module: "CRM",
          id: lead.id,
          label: lead.contactName,
          detail: `${lead.companyName ?? "Lead"} · ${lead.status ?? ""}`,
          href: "/?view=crm",
        });
      }
    }

    for (const invoice of invoices) {
      const clientName = invoice.clientName ?? "";
      if (matchesQuery([clientName, invoice.invoiceNumber].join(" "), query)) {
        hits.push({
          module: "Finance",
          id: invoice.id,
          label: clientName || invoice.invoiceNumber,
          detail: `Invoice ${invoice.invoiceNumber} · ${invoice.status}`,
          href: "/?view=accounts-receivable",
        });
      }
    }

    return toolOk(
      "platformSearch",
      hits.slice(0, 40),
      {
        source: ["platform:cross-module-search"],
        pageSize: 40,
        summary: {
          matched: hits.length,
          query,
          message:
            hits.length === 0
              ? `No employees, clients, or projects matched “${query}”. I can still prepare a meeting brief if you confirm who they are.`
              : `I found ${hits.length} match${hits.length === 1 ? "" : "es"} for “${query}” across Unit311.`,
        },
        followUpActions:
          hits.length === 0
            ? [
                {
                  id: "fu_search_employees",
                  label: "Show employees",
                  kind: "generate",
                },
                {
                  id: "fu_search_clients",
                  label: "Show clients",
                  kind: "generate",
                },
                {
                  id: "fu_crm",
                  label: "Show my biggest opportunities",
                  kind: "generate",
                },
              ]
            : hits
                .slice(0, 3)
                .filter((hit) => typeof hit.href === "string" && hit.href)
                .map((hit) =>
                  nav(String(hit.href), `Open ${String(hit.label ?? "record")}`),
                ),
      },
    );
  } catch (error) {
    return toolError(
      "platformSearch",
      error instanceof Error ? error.message : "Platform search failed.",
    );
  }
}
