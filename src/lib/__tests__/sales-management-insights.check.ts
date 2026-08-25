/**
 * Sales Management Phase 1 — insights and data-model checks.
 */
import assert from "node:assert/strict";

import { getDemoSalesManagementLeads } from "@/lib/demo/demo-sales-management-fixtures";
import {
  buildSalesDashboardMetrics,
  filterLeadsBySalesSegment,
  isOpenPipelineLead,
  isProspectLead,
  resolveLeadWinProbability,
} from "@/lib/sales-management-insights";

const leads = getDemoSalesManagementLeads();

assert.ok(leads.length > 0, "demo CRM leads required for sales insights checks");
assert.ok(
  filterLeadsBySalesSegment(leads, "prospects").every((lead) => isProspectLead(lead.status)),
  "prospects segment must only include cold/warm leads",
);
assert.ok(
  filterLeadsBySalesSegment(leads, "pipeline").every((lead) => isOpenPipelineLead(lead.status)),
  "pipeline segment must only include open pipeline statuses",
);

const metrics = buildSalesDashboardMetrics({
  leads,
  quotes: [],
  meetings: [],
  workspaceSlug: "demo",
  reportingCurrency: "GBP",
});
assert.ok(metrics.pipelineValue > 0, "demo pipeline value should be positive");
assert.ok(metrics.openOpportunityCount > 0, "demo should have open opportunities");
assert.ok(metrics.currency === "GBP", "demo sales metrics must use GBP reporting currency");
assert.ok(metrics.byStatus.length === 6, "status breakdown should cover all lead statuses");
assert.ok(metrics.byStatus.some((row) => row.count > 0), "status breakdown should include data");
assert.ok(
  resolveLeadWinProbability(leads[0]!) === 65,
  "win probability should be read from lead record",
);

console.log("ok  sales-management-insights checks passed\n");
