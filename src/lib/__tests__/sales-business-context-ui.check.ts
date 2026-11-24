/**
 * Sales Management context switch.
 * Run: node --import tsx src/lib/__tests__/sales-business-context-ui.check.ts
 */
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SalesBusinessContextSelector } from "@/components/testflighthub/sales-management/SalesBusinessContextSelector";
import { SALES_BUSINESS_CONTEXT_FIELD } from "@/lib/sales-business-context";
import {
  SALES_CONTEXT_OPTIONS,
  applySalesContextSearchParam,
  readSalesBusinessContext,
  salesContextSelectorEnabled,
  scopeSalesFetch,
  writeSalesBusinessContext,
} from "@/lib/sales-business-context-ui";

assert.deepEqual(
  SALES_CONTEXT_OPTIONS.map((option) => option.label),
  ["UNIT311CENTRAL", "WOLF"],
);

assert.equal(salesContextSelectorEnabled({ basePath: "/", workspaceSlug: "unit311" }), true);
assert.equal(
  salesContextSelectorEnabled({ basePath: "/internaldashboard", workspaceSlug: "unit311" }),
  true,
);
assert.equal(salesContextSelectorEnabled({ basePath: "/dashboard", workspaceSlug: "unit311" }), false);
assert.equal(salesContextSelectorEnabled({ basePath: "/", workspaceSlug: "wolf-central" }), false);
assert.equal(salesContextSelectorEnabled({ basePath: "/", workspaceSlug: "demo" }), false);
assert.equal(salesContextSelectorEnabled({ basePath: "/", workspaceSlug: null }), false);

assert.equal(readSalesBusinessContext(), "unit311central");
writeSalesBusinessContext("wolf");
assert.equal(readSalesBusinessContext(), "wolf");
writeSalesBusinessContext("unit311central");
assert.equal(readSalesBusinessContext(), "unit311central");

const kept = new URLSearchParams("view=sales-management&tab=sales-quotes");
applySalesContextSearchParam(kept, "sales-management", { tab: "opportunities" }, "wolf");
assert.equal(kept.get("salesContext"), "wolf");
assert.equal(kept.get("tab"), "sales-quotes");

const explicit = new URLSearchParams("view=sales-management&tab=targets&salesContext=wolf");
applySalesContextSearchParam(explicit, "sales-management", { tab: "targets", salesContext: "unit311central" }, "wolf");
assert.equal(explicit.get("salesContext"), null);

const left = new URLSearchParams("view=clients&salesContext=wolf");
applySalesContextSearchParam(left, "clients", null, "wolf");
assert.equal(left.get("salesContext"), null);

const quote = scopeSalesFetch(
  "/api/financials/sales-quotes",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Wolf quote", companyName: "Mohammed Petrol Stations" }),
  },
  "wolf",
);
assert.equal(quote.input, "/api/financials/sales-quotes?businessContext=wolf");
assert.equal(JSON.parse(String(quote.init?.body)).businessContext, "wolf");
assert.equal(JSON.parse(String(quote.init?.body)).title, "Wolf quote");
assert.equal(SALES_BUSINESS_CONTEXT_FIELD, "businessContext");

const clients = scopeSalesFetch(
  "/api/clients",
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crmLeadId: "lead-1" }),
  },
  "wolf",
);
assert.equal(clients.input, "/api/clients?businessContext=wolf");
assert.equal(JSON.parse(String(clients.init?.body)).crmLeadId, "lead-1");
assert.equal("businessContext" in JSON.parse(String(clients.init?.body)), false);

const invoice = scopeSalesFetch("/api/financials/invoices", { cache: "no-store" }, "wolf");
assert.equal(invoice.input, "/api/financials/invoices");

const untouched = scopeSalesFetch("/api/crm/leads", undefined, null);
assert.equal(untouched.input, "/api/crm/leads");

const markup = renderToStaticMarkup(
  createElement(SalesBusinessContextSelector, { context: "wolf", onChange: () => {} }),
);
assert.equal(markup.includes("UNIT311CENTRAL"), true);
assert.equal(markup.includes("WOLF"), true);
assert.equal(markup.includes('data-sales-context="wolf"'), true);
assert.equal(markup.includes('aria-checked="true"'), true);

console.log("sales-business-context-ui.check.ts: ok");
