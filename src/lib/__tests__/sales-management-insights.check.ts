/**
 * Sales Management Phase 1 — insights and data-model checks.
 */
import assert from "node:assert/strict";

import { getNorthstarCrmLeads } from "@/lib/demo/module-fixtures";
import {
  buildSalesDashboardMetrics,
  filterLeadsBySalesSegment,
  isOpenPipelineLead,
  isProspectLead,
} from "@/lib/sales-management-insights";

const leads = getNorthstarCrmLeads();

assert.ok(leads.length > 0, "demo CRM leads required for sales insights checks");
assert.ok(
  filterLeadsBySalesSegment(leads, "prospects").every((lead) => isProspectLead(lead.status)),
  "prospects segment must only include cold/warm leads",
);
assert.ok(
  filterLeadsBySalesSegment(leads, "pipeline").every((lead) => isOpenPipelineLead(lead.status)),
  "pipeline segment must only include open pipeline statuses",
);

const metrics = buildSalesDashboardMetrics({ leads, quotes: [], meetings: [] });
assert.ok(metrics.pipelineValue > 0, "demo pipeline value should be positive");
assert.ok(metrics.openOpportunityCount > 0, "demo should have open opportunities");
assert.ok(metrics.byStatus.length === 6, "status breakdown should cover all lead statuses");
assert.ok(metrics.byStatus.some((row) => row.count > 0), "status breakdown should include data");

console.log("ok  sales-management-insights checks passed\n");
