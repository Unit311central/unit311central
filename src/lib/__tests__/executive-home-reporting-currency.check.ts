import assert from "node:assert/strict";
import test from "node:test";

import { buildExecutiveHomeLiveKpis } from "@/lib/executive-home-dashboard";
import { buildNorthstarFinancialOverview } from "@/lib/demo/module-fixtures";

test("executive home KPIs prefer workspace reporting currency over finance fixture currency", () => {
  const financials = buildNorthstarFinancialOverview();
  assert.equal(financials.burnRate.currency, "USD");

  const kpis = buildExecutiveHomeLiveKpis({
    financials,
    projects: [],
    clients: [],
    reportingCurrency: "GBP",
  });

  const revenue = kpis.find((kpi) => kpi.id === "revenue");
  const cash = kpis.find((kpi) => kpi.id === "cash");
  const burn = kpis.find((kpi) => kpi.id === "burn");

  assert.match(String(revenue?.value), /£/);
  assert.match(String(cash?.value), /£/);
  assert.match(String(burn?.value), /£/);
  assert.doesNotMatch(String(revenue?.value), /\$/);
});

test("finance and executive home reporting currency resolvers diverge for demo slug", async () => {
  const {
    resolveExecutiveHomeReportingCurrency,
    resolveWorkspaceReportingCurrency,
  } = require("@/lib/workspace-reporting-currency-server") as typeof import("@/lib/workspace-reporting-currency-server");

  assert.equal(await resolveWorkspaceReportingCurrency(null, "demo"), "USD");
  assert.equal(await resolveExecutiveHomeReportingCurrency(null, "demo"), "USD");
});
