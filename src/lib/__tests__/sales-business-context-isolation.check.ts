/**
 * Proves Sales Management queries record workspace and business_context filters
 * by executing the service functions against an in-memory query builder.
 */
import assert from "node:assert/strict";
import Module from "node:module";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";

type Call = { op: string; args: unknown[] };

const calls: Call[] = [];
let readRow: Record<string, unknown> | null = null;

function builder() {
  const api = {
    select(...args: unknown[]) {
      calls.push({ op: "select", args });
      return api;
    },
    insert(payload: unknown) {
      calls.push({ op: "insert", args: [payload] });
      return api;
    },
    update(payload: unknown) {
      calls.push({ op: "update", args: [payload] });
      return api;
    },
    delete() {
      calls.push({ op: "delete", args: [] });
      return api;
    },
    eq(column: string, value: string) {
      calls.push({ op: "eq", args: [column, value] });
      return api;
    },
    neq() {
      return api;
    },
    in() {
      return api;
    },
    order() {
      return api;
    },
    limit() {
      return api;
    },
    or() {
      return api;
    },
    not() {
      return api;
    },
    is() {
      return api;
    },
    maybeSingle() {
      return Promise.resolve({ data: readRow, error: null });
    },
    single() {
      const inserted = [...calls].reverse().find((call) => call.op === "insert")?.args[0] as
        | Record<string, unknown>
        | undefined;
      return Promise.resolve({
        data: {
          id: "lead-1",
          workspace_id: inserted?.workspace_id ?? "ws-unit",
          company_name: inserted?.company_name ?? "Acme",
          contact_name: inserted?.contact_name ?? "Ada",
          status: "Cold",
          notes: "",
          name: inserted?.name ?? "Standard",
          rate_pct: inserted?.rate_pct ?? 5,
          applies_to: inserted?.applies_to ?? "won_deal",
          is_active: true,
          business_context: inserted?.business_context ?? "unit311central",
        },
        error: null,
      });
    },
    then(resolve: (value: { data: unknown[]; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
      const writing = calls.some((call) => call.op === "update" || call.op === "delete");
      return Promise.resolve({ data: writing ? [{ id: "row-1" }] : [], error: null }).then(resolve, reject);
    },
  };
  return api;
}

const supabase = {
  from(table: string) {
    calls.push({ op: "from", args: [table] });
    return builder();
  },
};

const moduleLoader = Module as unknown as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};
const originalLoad = moduleLoader._load;
moduleLoader._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request.includes("tenancy-server")) {
    return {
      createTenancyServerClient: () => supabase,
      isTenancyHardeningActive: () => false,
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

async function main() {
const { createLead, deleteLead, getLeadById, listLeads, updateLead } = await import(
  "@/lib/crm-leads-service"
);
const {
  createSalesActivity,
  createSalesCommissionRule,
  deleteSalesTarget,
  updateSalesTarget,
} = await import("@/lib/sales-management-service");
const { createSalesQuote, getSalesQuoteById } = await import("@/lib/accounting/sales-quotes-core");
const { listSalesQuotes } = await import("@/lib/accounting/sales-quotes-list-load");


function eqs() {
  return calls.filter((call) => call.op === "eq").map((call) => call.args);
}

function reset() {
  calls.length = 0;
}

const wolfScope = { workspaceId: "ws-unit", businessContext: "wolf" as const };

reset();
const listed = await listLeads("All", wolfScope);
assert.deepEqual(listed, []);
assert.deepEqual(eqs(), [
  ["workspace_id", "ws-unit"],
  ["business_context", "wolf"],
]);

reset();
const missing = await getLeadById("lead-foreign", wolfScope);
assert.equal(missing, null);
assert.deepEqual(eqs(), [
  ["id", "lead-foreign"],
  ["workspace_id", "ws-unit"],
  ["business_context", "wolf"],
]);

reset();
readRow = {
  id: "lead-foreign",
  workspace_id: "ws-unit",
  company_name: "Hidden",
  contact_name: "Ada",
  status: "Cold",
  notes: "",
};
await deleteLead("lead-foreign", wolfScope);
readRow = null;
assert.ok(
  calls.some((call) => call.op === "delete"),
  "delete must run only after the scoped read",
);
const deleteFilters = eqs();
assert.ok(
  deleteFilters.filter((pair) => pair[0] === "business_context" && pair[1] === "wolf").length >= 2,
  "lead delete must filter the existence check and the delete",
);

reset();
const created = await createLead(
  { companyName: "Demo Co", contactName: "Ada" },
  { workspaceId: "ws-other" },
);
assert.equal(created.companyName, "Demo Co");
const inserted = calls.find((call) => call.op === "insert")?.args[0] as { business_context?: string };
assert.equal(inserted.business_context, "unit311central");
assert.equal(
  calls.some((call) => call.op === "eq" && call.args[0] === "business_context"),
  false,
  "non-unit311 writes assign the default column and do not add a context filter",
);

reset();
readRow = {
  id: "lead-1",
  workspace_id: "ws-unit",
  company_name: "Wolf Co",
  contact_name: "Ada",
  status: "Cold",
  notes: "",
};
await updateLead("lead-1", { companyName: "Renamed", businessContext: "unit311central" } as never, wolfScope);
readRow = null;
const leadPatch = calls.find((call) => call.op === "update")?.args[0] as Record<string, unknown>;
assert.equal(leadPatch.company_name, "Renamed");
assert.equal("business_context" in leadPatch, false);
assert.ok(eqs().some((pair) => pair[0] === "business_context" && pair[1] === "wolf"));

reset();
await createLead({ companyName: "Wolf Co", contactName: "Ada" }, wolfScope);
const wolfInsert = calls.find((call) => call.op === "insert")?.args[0] as { business_context?: string };
assert.equal(wolfInsert.business_context, "wolf");

reset();
await updateSalesTarget({
  workspaceId: "ws-unit",
  targetId: "target-1",
  targetValue: 10,
  businessContext: "wolf",
});
assert.deepEqual(eqs(), [
  ["workspace_id", "ws-unit"],
  ["id", "target-1"],
  ["business_context", "wolf"],
]);
const targetPatch = calls.find((call) => call.op === "update")?.args[0] as Record<string, unknown>;
assert.equal("business_context" in targetPatch, false);

reset();
await deleteSalesTarget("ws-unit", "target-1", "unit311central");
assert.deepEqual(eqs(), [
  ["workspace_id", "ws-unit"],
  ["id", "target-1"],
  ["business_context", "unit311central"],
]);

reset();
await createSalesCommissionRule({
  workspaceId: "ws-demo",
  name: "Standard",
  ratePct: 5,
  appliesTo: "won_deal",
  businessContext: null,
});
const ruleInsert = calls.find((call) => call.op === "insert")?.args[0] as { business_context?: string };
assert.equal(ruleInsert.business_context, "unit311central");

const quoteScope = {
  workspaceId: "ws-unit",
  workspaceSlug: "unit311",
  businessContext: "wolf" as const,
};

reset();
const quote = await getSalesQuoteById("quote-foreign", quoteScope);
assert.equal(quote, null);
assert.deepEqual(eqs(), [
  ["workspace_id", "ws-unit"],
  ["id", "quote-foreign"],
  ["business_context", "wolf"],
]);

reset();
const quotes = await listSalesQuotes(quoteScope);
assert.deepEqual(quotes, []);
assert.deepEqual(eqs(), [
  ["workspace_id", "ws-unit"],
  ["business_context", "wolf"],
]);

reset();
await listSalesQuotes({ workspaceId: "ws-wolf-central", workspaceSlug: "wolf-central" });
assert.deepEqual(eqs(), [["workspace_id", "ws-wolf-central"]]);

reset();
await assert.rejects(
  () =>
    createSalesActivity({
      workspaceId: "ws-unit",
      crmLeadId: "lead-other-context",
      title: "Call",
      businessContext: "wolf",
    }),
  /Lead not found/,
);
assert.equal(
  calls.some((call) => call.op === "insert"),
  false,
  "activity insert must not run when the parent lead is outside the context",
);
assert.ok(
  eqs().some((pair) => pair[0] === "business_context" && pair[1] === "wolf"),
  "activity creation must check the parent lead in the current context",
);

reset();
readRow = {
  id: "quote-1",
  workspace_id: "ws-unit",
  quote_number: "Q-1",
  company_name: "Wolf Co",
  title: "Proposal",
  status: "draft",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};
const createdQuote = await createSalesQuote(quoteScope, {
  companyName: "Wolf Co",
  title: "Proposal",
  lineItems: [{ description: "Licence", quantity: 1, unitPrice: 100 }],
});
readRow = null;
assert.equal(createdQuote.companyName, "Wolf Co");
const quotePayload = calls.find((call) => call.op === "insert")?.args[0] as { business_context?: string };
assert.equal(quotePayload.business_context, "wolf");

console.log("sales-business-context-isolation.check.ts: ok");
}

main();
