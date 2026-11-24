import assert from "node:assert/strict";

import {
  applySalesBusinessContext,
  clientsVisibleInSalesContext,
  DEFAULT_SALES_BUSINESS_CONTEXT,
  readRequestedSalesBusinessContext,
  resolveSalesBusinessContext,
  SalesBusinessContextError,
  salesBusinessContextColumn,
  salesRecordScope,
} from "@/lib/sales-business-context";

function request(url: string) {
  return new Request(url);
}

function query(calls: Array<[string, string]>) {
  const builder = {
    eq(column: string, value: string) {
      calls.push([column, value]);
      return builder;
    },
  };
  return builder;
}

assert.equal(
  resolveSalesBusinessContext({ workspaceSlug: "unit311" }),
  "unit311central",
);
assert.equal(
  resolveSalesBusinessContext({ workspaceSlug: "UNIT311", requested: "  " }),
  "unit311central",
);
assert.equal(
  resolveSalesBusinessContext({ workspaceSlug: "unit311", requested: "wolf" }),
  "wolf",
);

for (const slug of ["demo", "abhi", "wolf-central", "saec", "greendesert"]) {
  assert.equal(
    resolveSalesBusinessContext({ workspaceSlug: slug, requested: "wolf" }),
    null,
    `${slug} stays workspace-only`,
  );
  assert.equal(salesRecordScope({ id: "ws", slug }, "wolf").businessContext, undefined);
}

assert.throws(
  () => resolveSalesBusinessContext({ workspaceSlug: "unit311", requested: "WOLF" }),
  SalesBusinessContextError,
);
assert.throws(
  () => resolveSalesBusinessContext({ workspaceSlug: "demo", requested: "other" }),
  SalesBusinessContextError,
);
assert.throws(
  () =>
    readRequestedSalesBusinessContext(request("https://internal.example/api?businessContext=wolf"), {
      businessContext: "unit311central",
    }),
  SalesBusinessContextError,
);

assert.equal(
  readRequestedSalesBusinessContext(request("https://internal.example/api?businessContext=wolf")),
  "wolf",
);
assert.equal(readRequestedSalesBusinessContext(request("https://internal.example/api")), undefined);

const unit311 = salesRecordScope({ id: "unit-id", slug: "unit311" });
assert.deepEqual(unit311, {
  workspaceId: "unit-id",
  workspaceSlug: "unit311",
  businessContext: DEFAULT_SALES_BUSINESS_CONTEXT,
});

assert.equal(salesBusinessContextColumn(null), "unit311central");
assert.equal(salesBusinessContextColumn("wolf"), "wolf");
assert.equal(salesBusinessContextColumn(undefined), "unit311central");

const unfiltered: Array<[string, string]> = [];
applySalesBusinessContext(query(unfiltered), null);
assert.deepEqual(unfiltered, []);

const filtered: Array<[string, string]> = [];
applySalesBusinessContext(query(filtered), "wolf");
assert.deepEqual(filtered, [["business_context", "wolf"]]);

const clients = [
  { id: "u", companyName: "Shared Co", clientType: "unit311central" },
  { id: "w", companyName: "Shared Co", clientType: "wolf" },
];
assert.deepEqual(
  clientsVisibleInSalesContext(clients, "wolf").map((client) => client.id),
  ["w"],
);
assert.deepEqual(
  clientsVisibleInSalesContext(clients, "unit311central").map((client) => client.id),
  ["u"],
);
assert.equal(clientsVisibleInSalesContext(clients, null).length, 2);

console.log("sales-business-context.check.ts: ok");
