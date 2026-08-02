import { getFinancialOverview } from "@/lib/accounting/overview-service";
import { listExpenses } from "@/lib/financial-expenses-service";
import { listHrEmployees } from "@/lib/hr-employees-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import { listProjects } from "@/lib/internal-projects-service";
import { listLeads } from "@/lib/crm-leads-service";
import { calculateLivePayrollSnapshot } from "@/lib/payroll/payroll-service";
import { listSupportTickets } from "@/lib/support-tickets-service";
import {
  getSoftwareAssetsSummary,
  listSoftwareAssets,
} from "@/lib/software-assets-service";
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
import {
  computeTrainingDashboardKpis,
  getTqmsSnapshotForWorkspace,
} from "@/lib/tqms-mock-store";
import {
  leaveCurrentlyActive,
  loadWorkspaceInventory,
  loadWorkspaceLeaveRequests,
  loadWorkspacePerformanceReviews,
  loadWorkspaceVacancies,
} from "./workspace-operational-data";

function nav(href: string, label: string): AssistantFollowUpAction {
  return { id: `nav_${href}`, label, kind: "navigate", href };
}

export async function searchPerformanceReviews(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessHr) {
    return toolForbidden(
      "searchPerformanceReviews",
      "Your current role cannot access HR performance data.",
    );
  }
  try {
    const query = asString(args.query);
    const status = asString(args.status);
    const employeeId =
      asString(args.employeeId) || ctx.business.selection.employeeId || undefined;
    const pageSize = Math.min(asNumber(args.pageSize, 50), 100);
    const reviews = loadWorkspacePerformanceReviews(ctx.business.workspace.slug);
    const filtered = reviews.filter((review) => {
      if (employeeId && review.employeeId !== employeeId) return false;
      if (status && review.status.toLowerCase() !== status.toLowerCase()) return false;
      const haystack = [
        review.employeeName,
        review.department,
        review.role,
        review.managerName,
        review.reviewPeriod,
        review.status,
        review.summary,
      ].join(" ");
      return matchesQuery(haystack, query);
    });
    return toolOk(
      "searchPerformanceReviews",
      filtered.slice(0, pageSize).map((review) => ({
        id: review.id,
        employeeName: review.employeeName,
        department: review.department,
        role: review.role,
        reviewPeriod: review.reviewPeriod,
        status: review.status,
        overallRating: review.overallRating,
        managerName: review.managerName,
        nextReviewDate: review.nextReviewDate,
      })),
      {
        source: ["hr-performance:reviews", "workspace:hr-seed"],
        page: 1,
        pageSize,
        summary: {
          total: filtered.length,
          message:
            filtered.length === 0
              ? "No performance reviews match that request."
              : `${filtered.length} performance review${filtered.length === 1 ? "" : "s"}.`,
        },
        followUpActions: [nav("/?view=hr-performance", "Open Performance")],
        appliedContext: { activeView: ctx.business.page.activeView },
      },
    );
  } catch (error) {
    return toolError(
      "searchPerformanceReviews",
      error instanceof Error ? error.message : "Failed to load performance reviews",
      ["hr-performance:reviews"],
    );
  }
}

export async function searchLeave(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessHr) {
    return toolForbidden("searchLeave", "Your current role cannot access HR leave data.");
  }
  try {
    const query = asString(args.query);
    const status = asString(args.status);
    const currentlyOnLeave =
      args.currentlyOnLeave === true ||
      args.currentlyOnLeave === "true" ||
      args.onLeave === true ||
      args.onLeave === "true";
    const pendingOnly = args.pendingOnly === true || args.pendingOnly === "true";
    const pageSize = Math.min(asNumber(args.pageSize, 50), 100);
    const requests = loadWorkspaceLeaveRequests(ctx.business.workspace.slug);
    let filtered = currentlyOnLeave ? leaveCurrentlyActive(requests) : [...requests];
    if (pendingOnly) filtered = filtered.filter((row) => row.status === "pending");
    if (status) {
      filtered = filtered.filter((row) => row.status.toLowerCase() === status.toLowerCase());
    }
    filtered = filtered.filter((row) => {
      const haystack = [
        row.employeeName,
        row.department,
        row.role,
        row.type,
        row.status,
        row.notes,
      ].join(" ");
      return matchesQuery(haystack, query);
    });
    return toolOk(
      "searchLeave",
      filtered.slice(0, pageSize).map((row) => ({
        id: row.id,
        employeeName: row.employeeName,
        department: row.department,
        role: row.role,
        type: row.type,
        startDate: row.startDate,
        endDate: row.endDate,
        days: row.days,
        status: row.status,
        managerName: row.managerName,
        notes: row.notes,
      })),
      {
        source: ["hr-leave:requests", "workspace:hr-seed"],
        page: 1,
        pageSize,
        summary: {
          total: filtered.length,
          currentlyOnLeave: currentlyOnLeave || undefined,
          message:
            filtered.length === 0
              ? currentlyOnLeave
                ? "Nobody is on leave today."
                : "No leave requests match that request."
              : currentlyOnLeave
                ? `${filtered.length} person${filtered.length === 1 ? "" : "s"} currently on leave.`
                : `${filtered.length} leave request${filtered.length === 1 ? "" : "s"}.`,
        },
        followUpActions: [nav("/?view=hr-leave", "Open Leave")],
        appliedContext: { activeView: ctx.business.page.activeView },
      },
    );
  } catch (error) {
    return toolError(
      "searchLeave",
      error instanceof Error ? error.message : "Failed to load leave requests",
      ["hr-leave:requests"],
    );
  }
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
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  try {
    const query = asString(args.query);
    const pageSize = Math.min(asNumber(args.pageSize, 40), 100);
    const snapshot = loadWorkspaceInventory(ctx.business.workspace.slug);
    const assets = snapshot.assets.filter((asset) => !asset.archived);
    const filtered = assets.filter((asset) => {
      const haystack = [
        asset.assetTag,
        asset.name,
        asset.category,
        asset.location,
        asset.status,
        asset.assignedTo ?? "",
        asset.serialNumber ?? "",
      ].join(" ");
      return matchesQuery(haystack, query);
    });
    return toolOk(
      "searchInventory",
      filtered.slice(0, pageSize).map((asset) => ({
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        assignedTo: asset.assignedTo ?? null,
        currentValue: asset.currentValue ?? null,
      })),
      {
        source: ["inventory:register", "workspace:inventory-seed"],
        page: 1,
        pageSize,
        summary: {
          total: filtered.length,
          message:
            filtered.length === 0
              ? "No inventory assets match that request."
              : `${filtered.length} inventory asset${filtered.length === 1 ? "" : "s"}.`,
        },
        followUpActions: [nav("/?view=inventory", "Open Inventory")],
        appliedContext: { activeView: ctx.business.page.activeView },
      },
    );
  } catch (error) {
    return toolError(
      "searchInventory",
      error instanceof Error ? error.message : "Failed to load inventory",
      ["inventory"],
    );
  }
}

export async function searchVacancies(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!ctx.business.permissions.canAccessHr) {
    return toolForbidden("searchVacancies", "Your current role cannot access HR recruitment data.");
  }
  try {
    const query = asString(args.query);
    const pageSize = Math.min(asNumber(args.pageSize, 40), 100);
    const openOnly = args.openOnly !== false && args.openOnly !== "false";
    const vacancies = loadWorkspaceVacancies(ctx.business.workspace.slug);
    const filtered = vacancies
      .filter((row) => (openOnly ? row.status === "open" : true))
      .filter((row) => {
        const haystack = [
          row.title,
          row.department,
          row.location,
          row.hiringManager,
          row.status,
          row.description,
        ].join(" ");
        return matchesQuery(haystack, query);
      });
    return toolOk(
      "searchVacancies",
      filtered.slice(0, pageSize).map((row) => ({
        id: row.id,
        title: row.title,
        department: row.department,
        location: row.location,
        status: row.status,
        hiringManager: row.hiringManager,
        headcount: row.headcount,
        salaryBand: row.salaryBand,
        closingDate: row.closingDate,
      })),
      {
        source: ["hr-recruitment:vacancies", "workspace:hr-seed"],
        page: 1,
        pageSize,
        summary: {
          total: filtered.length,
          message:
            filtered.length === 0
              ? "No careers vacancies match that request."
              : `${filtered.length} open vacanc${filtered.length === 1 ? "y" : "ies"}.`,
        },
        followUpActions: [nav("/?view=hr-recruitment", "Open Recruitment")],
        appliedContext: { activeView: ctx.business.page.activeView },
      },
    );
  } catch (error) {
    return toolError(
      "searchVacancies",
      error instanceof Error ? error.message : "Failed to load vacancies",
      ["hr-recruitment:vacancies"],
    );
  }
}

export async function searchSupportTickets(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  try {
    const query = asString(args.query);
    const openOnly = args.openOnly !== false && args.openOnly !== "false";
    const pageSize = Math.min(asNumber(args.pageSize, 40), 100);
    const workspaceId = ctx.business.workspace.id ?? undefined;
    const tickets = await listSupportTickets(false, workspaceId ? { workspaceId } : undefined);
    const filtered = tickets.filter((ticket) => {
      if (openOnly && (ticket.closed || ticket.status === "closed" || ticket.archived)) {
        return false;
      }
      const haystack = [
        ticket.name,
        ticket.organisation,
        ticket.status,
        ticket.priority,
        ticket.description,
        ticket.userAssigned ?? "",
      ].join(" ");
      return matchesQuery(haystack, query);
    });
    return toolOk(
      "searchSupportTickets",
      filtered.slice(0, pageSize).map((ticket) => ({
        id: ticket.id,
        name: ticket.name,
        organisation: ticket.organisation,
        status: ticket.status,
        priority: ticket.priority,
        userAssigned: ticket.userAssigned,
        escalated: ticket.escalated,
      })),
      {
        source: ["supabase:support_tickets"],
        page: 1,
        pageSize,
        summary: {
          total: filtered.length,
          message:
            filtered.length === 0
              ? "No support tickets match that request."
              : `${filtered.length} support ticket${filtered.length === 1 ? "" : "s"}.`,
        },
        followUpActions: [nav("/?view=support", "Open Support")],
        appliedContext: { activeView: ctx.business.page.activeView },
      },
    );
  } catch (error) {
    return toolError(
      "searchSupportTickets",
      error instanceof Error
        ? error.message
        : "Support tickets could not be loaded from live storage.",
      ["supabase:support_tickets"],
    );
  }
}

export async function searchSoftwareAssets(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  try {
    const query = asString(args.query);
    const pageSize = Math.min(asNumber(args.pageSize, 40), 100);
    const workspaceId = ctx.business.workspace.id ?? undefined;
    const scope = workspaceId ? { workspaceId } : undefined;
    const summaryAsk = /\b(summary|spend|renewal|licence|license|cost)\b/i.test(query);
    if (summaryAsk || args.summary === true || args.summary === "true") {
      const pack = await getSoftwareAssetsSummary(scope);
      return toolOk(
        "searchSoftwareAssets",
        [
          {
            kind: "summary",
            totalProducts: pack.summary.totalProducts,
            monthlySpend: pack.summary.monthlySpend,
            annualSpend: pack.summary.annualSpend,
            renewalsDueIn30Days: pack.summary.renewalsDueIn30Days,
            unusedLicences: pack.summary.unusedLicences,
            currency: pack.summary.currency,
          },
        ],
        {
          source: ["supabase:software_assets"],
          page: 1,
          pageSize: 1,
          summary: {
            total: pack.assets.length,
            message: `Software register: ${pack.summary.totalProducts} products · ${pack.summary.renewalsDueIn30Days} renewals due in 30 days.`,
          },
          followUpActions: [nav("/?view=technology-software", "Open Software")],
          appliedContext: { activeView: ctx.business.page.activeView },
        },
      );
    }
    const assets = await listSoftwareAssets(scope);
    const filtered = assets.filter((asset) => {
      const haystack = [
        asset.name,
        asset.vendor,
        asset.category,
        asset.status,
        asset.businessOwner,
        asset.technicalOwner,
      ].join(" ");
      return matchesQuery(haystack, query);
    });
    return toolOk(
      "searchSoftwareAssets",
      filtered.slice(0, pageSize).map((asset) => ({
        id: asset.id,
        name: asset.name,
        vendor: asset.vendor,
        category: asset.category,
        status: asset.status,
        businessOwner: asset.businessOwner,
        nextRenewalDate: asset.nextRenewalDate,
        licencesPurchased: asset.licencesPurchased,
        licencesAllocated: asset.licencesAllocated,
        monthlyCost: asset.monthlyCost,
        currency: asset.currency,
      })),
      {
        source: ["supabase:software_assets"],
        page: 1,
        pageSize,
        summary: {
          total: filtered.length,
          message:
            filtered.length === 0
              ? "No software assets match that request."
              : `${filtered.length} software asset${filtered.length === 1 ? "" : "s"}.`,
        },
        followUpActions: [nav("/?view=technology-software", "Open Software")],
        appliedContext: { activeView: ctx.business.page.activeView },
      },
    );
  } catch (error) {
    return toolError(
      "searchSoftwareAssets",
      error instanceof Error
        ? error.message
        : "Software assets could not be loaded from live storage.",
      ["supabase:software_assets"],
    );
  }
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
              : `I found ${hits.length} match${hits.length === 1 ? "" : "es"} for “${query}” across the workspace.`,
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

export async function searchQmsTraining(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  try {
    const query = asString(args.query);
    const focusOverdue =
      args.overdueOnly === true ||
      args.overdueOnly === "true" ||
      /\boverdue\b/i.test(query);
    const snapshot = getTqmsSnapshotForWorkspace(ctx.business.workspace.slug);
    const kpis = computeTrainingDashboardKpis(snapshot);
    const learnerName = (id: string) =>
      snapshot.learners.find((row) => row.id === id)?.name ?? "Learner";
    const courseTitle = (id: string) =>
      snapshot.courses.find((row) => row.id === id)?.title ?? "Course";
    const assignments = snapshot.assignments.filter((row) => {
      if (focusOverdue && row.status !== "Overdue") return false;
      const haystack = [
        learnerName(row.learnerId),
        courseTitle(row.courseId),
        row.status,
        row.mandatory ? "mandatory" : "",
      ].join(" ");
      return matchesQuery(haystack, query);
    });
    const capas = snapshot.capas
      .filter((row) => row.status !== "Closed")
      .slice(0, 8)
      .map((row) => ({
        id: row.id,
        reference: row.reference,
        title: row.issue,
        status: row.status,
        owner: row.owner,
        dueDate: row.dueDate,
      }));

    return toolOk(
      "searchQmsTraining",
      [
        {
          kind: "summary",
          ...kpis,
          openCapas: capas.length,
        },
        ...assignments.slice(0, 40).map((row) => ({
          kind: "assignment",
          id: row.id,
          learnerName: learnerName(row.learnerId),
          courseTitle: courseTitle(row.courseId),
          status: row.status,
          progress: row.progress,
          mandatory: row.mandatory,
          dueDate: row.dueDate,
        })),
        ...capas.map((row) => ({ kind: "capa", ...row })),
      ],
      {
        source: ["tqms:training", "workspace:tqms-seed"],
        page: 1,
        pageSize: 50,
        summary: {
          overdue: kpis.overdue,
          complianceScore: kpis.complianceScore,
          expiringCertificates: kpis.expiring,
          message: `Training: ${kpis.overdue} overdue · compliance ${kpis.complianceScore}% · ${kpis.expiring} certificates expiring within 60 days · ${capas.length} open CAPAs.`,
        },
        followUpActions: [
          nav("/?view=qms-training", "Open QMS Training"),
          nav("/?view=qms-capa", "Open CAPA"),
        ],
        appliedContext: { activeView: ctx.business.page.activeView },
      },
    );
  } catch (error) {
    return toolError(
      "searchQmsTraining",
      error instanceof Error ? error.message : "Failed to load QMS training data",
      ["tqms:training"],
    );
  }
}
