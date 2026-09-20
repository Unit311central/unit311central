import assert from "node:assert/strict";

import type { ManagedClient } from "@/lib/client-management-data";
import { filterClientDirectoryDisplayRows } from "@/lib/client-directory-filter";
import { clientDirectoryRows } from "@/lib/business-central/workspace-dashboard-summary";

const sample: ManagedClient[] = [
  {
    id: "c1",
    companyName: "Active Co",
    industry: "Infrastructure",
    primaryContact: "A",
    email: "a@example.com",
    phone: "",
    region: "United Kingdom",
    accountStatus: "Active",
    contractType: "Retainer",
    taxId: "",
    billingAddress: "",
    activeProjects: 0,
    notes: "",
  },
  {
    id: "c2",
    companyName: "Onboarding Co",
    industry: "Infrastructure",
    primaryContact: "B",
    email: "b@example.com",
    phone: "",
    region: "United Kingdom",
    accountStatus: "Onboarding",
    contractType: "Retainer",
    taxId: "",
    billingAddress: "",
    activeProjects: 0,
    notes: "",
  },
  {
    id: "c3",
    companyName: "Archived Co",
    industry: "Infrastructure",
    primaryContact: "C",
    email: "c@example.com",
    phone: "",
    region: "United Kingdom",
    accountStatus: "Archived",
    contractType: "Retainer",
    taxId: "",
    billingAddress: "",
    activeProjects: 0,
    notes: "",
  },
];

const defaultFilters = {
  search: "",
  industry: "all",
  country: "all",
  city: "all",
  status: "all" as const,
  contract: "all",
};

const defaultRows = filterClientDirectoryDisplayRows(sample, defaultFilters);
assert.equal(defaultRows.length, 2, "default directory shows all non-archived statuses");
assert.equal(clientDirectoryRows(sample).length, 2);

const activeOnly = filterClientDirectoryDisplayRows(sample, {
  ...defaultFilters,
  status: "Active",
});
assert.equal(activeOnly.length, 1);

const archivedOnly = filterClientDirectoryDisplayRows(sample, {
  ...defaultFilters,
  status: "Archived",
});
assert.equal(archivedOnly.length, 1);
assert.equal(archivedOnly[0]?.companyName, "Archived Co");

console.log("ok  client-directory-filter");
