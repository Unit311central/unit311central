/**
 * Normalise authorised tool results into a compact evidence snapshot for synthesis.
 */

import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";

export type EvidenceChartSeries = {
  label: string;
  labels: string[];
  data: number[];
};

export type EvidenceSnapshot = {
  cash?: number;
  runwayMonths?: number;
  monthlyBurn?: number;
  payrollMonthly?: number;
  accountsReceivable?: number;
  accountsPayable?: number;
  revenueLatest?: number;
  expensesLatest?: number;
  overdueInvoiceCount?: number;
  overdueInvoiceTotal?: number;
  headcount?: number;
  clientCount?: number;
  projectCount?: number;
  pipelineValue?: number;
  pipelineCount?: number;
  businessHealthScore?: number;
  businessRiskCount?: number;
  chartSeries: EvidenceChartSeries[];
  limitations: string[];
  sources: string[];
};

function money(value: number, currency = "GBP") {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `£${(value || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  }
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function chartFromItem(item: Record<string, unknown>): EvidenceChartSeries | null {
  const labels = Array.isArray(item.labels) ? (item.labels as string[]) : [];
  const datasets = Array.isArray(item.datasets)
    ? (item.datasets as Array<{ label: string; data: number[] }>)
    : [];
  if (!labels.length || !datasets.length) return null;
  const primary = datasets[0];
  return { label: primary.label || "Series", labels, data: primary.data };
}

export function buildEvidenceSnapshot(
  evidence: Array<{ tool: string; result: AssistantToolResult }>,
): EvidenceSnapshot {
  const snapshot: EvidenceSnapshot = {
    chartSeries: [],
    limitations: [],
    sources: [],
  };

  for (const entry of evidence) {
    const { tool, result } = entry;
    if (result.status !== "ok") {
      snapshot.limitations.push(`${tool} returned ${result.status}`);
      continue;
    }
    snapshot.sources.push(...(result.source ?? []));

    if (tool === "getCashPosition") {
      const row = (result.items?.[0] ?? {}) as Record<string, unknown>;
      snapshot.cash = asNumber(row.cashPosition);
      snapshot.runwayMonths = asNumber(row.runwayMonths);
      snapshot.monthlyBurn = asNumber(row.monthlyBurn);
      snapshot.payrollMonthly = asNumber(row.payrollMonthly);
      snapshot.accountsReceivable = asNumber(row.accountsReceivable);
      snapshot.accountsPayable = asNumber(row.accountsPayable);
    }

    if (tool === "getFinancialChartData") {
      const row = (result.items?.[0] ?? {}) as Record<string, unknown>;
      const series = chartFromItem(row);
      if (series) snapshot.chartSeries.push(series);
      const summary = result.summary as Record<string, unknown> | undefined;
      const seriesKind = String(summary?.series ?? "");
      if (seriesKind === "revenue" && series?.data.length) {
        snapshot.revenueLatest = series.data[series.data.length - 1];
      }
      if (seriesKind === "revenue_vs_expenses") {
        const datasets = Array.isArray(row.datasets)
          ? (row.datasets as Array<{ label: string; data: number[] }>)
          : [];
        const revenue = datasets.find((d) => /revenue/i.test(d.label));
        const expenses = datasets.find((d) => /expense/i.test(d.label));
        if (revenue?.data.length) snapshot.revenueLatest = revenue.data[revenue.data.length - 1];
        if (expenses?.data.length) snapshot.expensesLatest = expenses.data[expenses.data.length - 1];
      }
      if (seriesKind === "cash" && series?.data.length) {
        snapshot.cash = series.data[series.data.length - 1];
      }
    }

    if (tool === "searchInvoices") {
      const items = result.items ?? [];
      snapshot.overdueInvoiceCount = result.total ?? items.length;
      let total = 0;
      for (const item of items) {
        const row = item as Record<string, unknown>;
        total += asNumber(row.amount) ?? asNumber(row.total) ?? 0;
      }
      if (total > 0) snapshot.overdueInvoiceTotal = total;
    }

    if (tool === "searchEmployees") {
      const summary = result.summary as Record<string, unknown> | undefined;
      snapshot.headcount =
        asNumber(summary?.headcount) ?? (Array.isArray(result.items) ? result.items.length : undefined);
    }

    if (tool === "searchClients") {
      snapshot.clientCount = result.total ?? result.items?.length;
    }

    if (tool === "searchProjects") {
      snapshot.projectCount = result.total ?? result.items?.length;
    }

    if (tool === "searchCRM") {
      const items = result.items ?? [];
      snapshot.pipelineCount = result.total ?? items.length;
      let pipelineValue = 0;
      for (const item of items) {
        const row = item as Record<string, unknown>;
        pipelineValue += asNumber(row.estimatedValue) ?? asNumber(row.value) ?? 0;
      }
      if (pipelineValue > 0) snapshot.pipelineValue = pipelineValue;
    }

    if (tool === "getBusinessHealth") {
      const row = (result.items?.[0] ?? {}) as Record<string, unknown>;
      snapshot.businessHealthScore = asNumber(row.overall);
      const risks = Array.isArray(row.risks) ? row.risks : [];
      snapshot.businessRiskCount = risks.length;
    }
  }

  if (!snapshot.sources.length) {
    snapshot.limitations.push("Limited authorised evidence was returned for this workspace.");
  }

  return snapshot;
}

export function formatMoney(value: number | undefined, currency = "GBP") {
  if (value === undefined) return "not available";
  return money(value, currency);
}
