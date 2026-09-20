import assert from "node:assert/strict";

import { resolveSalesManagementShellTitles } from "@/lib/sales-management-nav";

const base = resolveSalesManagementShellTitles("opportunities");
assert.deepEqual(base.breadcrumb, ["Sales Management", "Sales", "Opportunities"]);

const record = resolveSalesManagementShellTitles("opportunities", {
  opportunityRecordName: "Moroccan Advanced Manufacturing",
});
assert.equal(record.title, "Moroccan Advanced Manufacturing");
assert.deepEqual(record.breadcrumb, [
  "Sales Management",
  "Sales",
  "Opportunities",
  "Moroccan Advanced Manufacturing",
]);

console.log("ok  sales-management-opportunity-breadcrumb");
