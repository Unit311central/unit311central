/**
 * Materiality filter — only task-relevant evidence reaches synthesis prose.
 */

import type { ExecutiveTask } from "./types";
import type { EvidenceSnapshot } from "./evidence-snapshot";

function focusIncludes(focus: string[], ...domains: string[]): boolean {
  return domains.some((d) => focus.includes(d));
}

export function assessMateriality(
  snapshot: EvidenceSnapshot,
  task: ExecutiveTask,
): EvidenceSnapshot {
  const focus = task.focusDomains;
  const filtered: EvidenceSnapshot = {
    chartSeries: [],
    limitations: [...snapshot.limitations],
    sources: [...snapshot.sources],
  };

  const allowCash = focusIncludes(focus, "cash", "profitability");
  const allowRevenue = focusIncludes(focus, "revenue", "profitability", "sales");
  const allowExpenses = focusIncludes(focus, "expenses", "profitability");
  const allowSales = focusIncludes(focus, "sales", "clients");
  const allowHr = focusIncludes(focus, "headcount", "payroll");
  const allowAr = focusIncludes(focus, "ar");
  const allowProjects = focusIncludes(focus, "projects");
  const allowHealth =
    focusIncludes(focus, "health") || task.job === "investigate" || task.job === "brief";

  if (allowCash) {
    filtered.cash = snapshot.cash;
    filtered.runwayMonths = snapshot.runwayMonths;
    filtered.monthlyBurn = snapshot.monthlyBurn;
    filtered.accountsPayable = snapshot.accountsPayable;
  }
  if (allowRevenue) {
    filtered.revenueLatest = snapshot.revenueLatest;
    filtered.accountsReceivable = snapshot.accountsReceivable;
  }
  if (allowExpenses) filtered.expensesLatest = snapshot.expensesLatest;
  if (allowSales) {
    filtered.pipelineValue = snapshot.pipelineValue;
    filtered.pipelineCount = snapshot.pipelineCount;
    filtered.clientCount = snapshot.clientCount;
  }
  if (allowHr) {
    filtered.headcount = snapshot.headcount;
    filtered.payrollMonthly = snapshot.payrollMonthly;
  }
  if (allowAr) {
    filtered.overdueInvoiceCount = snapshot.overdueInvoiceCount;
    filtered.overdueInvoiceTotal = snapshot.overdueInvoiceTotal;
  }
  if (allowProjects) filtered.projectCount = snapshot.projectCount;
  if (allowHealth) {
    filtered.businessHealthScore = snapshot.businessHealthScore;
    filtered.businessRiskCount = snapshot.businessRiskCount;
  }

  for (const series of snapshot.chartSeries) {
    const label = series.label.toLowerCase();
    if (/revenue/i.test(label) && allowRevenue) filtered.chartSeries.push(series);
    else if (/expense/i.test(label) && allowExpenses) filtered.chartSeries.push(series);
    else if (/cash/i.test(label) && allowCash) filtered.chartSeries.push(series);
    else if (/ar|receivable/i.test(label) && allowAr) filtered.chartSeries.push(series);
  }

  if (task.job === "compare" && task.comparisonPair) {
    return filterForComparison(filtered, task.comparisonPair, snapshot);
  }

  return filtered;
}

function filterForComparison(
  _filtered: EvidenceSnapshot,
  pair: [string, string],
  full: EvidenceSnapshot,
): EvidenceSnapshot {
  const allowed = new Set(pair);
  const strict: EvidenceSnapshot = {
    chartSeries: [],
    limitations: full.limitations,
    sources: full.sources,
  };

  if (allowed.has("sales")) {
    strict.pipelineValue = full.pipelineValue;
    strict.pipelineCount = full.pipelineCount;
  }
  if (allowed.has("revenue")) {
    strict.revenueLatest = full.revenueLatest;
    for (const series of full.chartSeries) {
      if (/revenue/i.test(series.label)) strict.chartSeries.push(series);
    }
  }
  if (allowed.has("cash")) {
    strict.cash = full.cash;
    strict.runwayMonths = full.runwayMonths;
  }
  if (allowed.has("expenses")) {
    strict.expensesLatest = full.expensesLatest;
    for (const series of full.chartSeries) {
      if (/expense/i.test(series.label)) strict.chartSeries.push(series);
    }
  }
  if (allowed.has("headcount")) strict.headcount = full.headcount;
  if (allowed.has("projects")) strict.projectCount = full.projectCount;

  return strict;
}

export function offFocusDomainsMentioned(text: string, task: ExecutiveTask): string[] {
  const focus = new Set(task.focusDomains);
  const leaked: string[] = [];
  if (!focus.has("headcount") && /\bheadcount\b/i.test(text)) leaked.push("headcount");
  if (!focus.has("cash") && !focus.has("profitability") && /\b(cash|bank balance|runway)\b/i.test(text)) {
    leaked.push("cash");
  }
  if (!focus.has("sales") && /\b(pipeline|crm)\b/i.test(text)) leaked.push("sales");
  if (!focus.has("health") && /\bbusiness health\b/i.test(text)) leaked.push("health");
  return leaked;
}
