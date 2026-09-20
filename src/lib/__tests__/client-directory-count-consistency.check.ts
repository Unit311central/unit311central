import assert from "node:assert/strict";

import { buildWorkspaceBcDashboardSummaryFromClients } from "@/lib/business-central/workspace-dashboard-summary";
import { buildClientsDashboardKpis } from "@/lib/clients-dashboard-insights";
import type { ManagedClient } from "@/lib/client-management-data";

const sample: ManagedClient[] = [
  {
    id: "c1",
    companyName: "Active Co",
    industry: "Technology",
    primaryContact: "A",
    email: "a@example.com",
    phone: "",
    region: "UK",
    accountStatus: "Active",
    contractType: "Retainer",
    taxId: "",
    billingAddress: "",
    activeProjects: 0,
    notes: "",
  },
  {
    id: "c2",
    companyName: "Archived Co",
    industry: "Technology",
    primaryContact: "B",
    email: "b@example.com",
    phone: "",
    region: "UK",
    accountStatus: "Archived",
    contractType: "Retainer",
    taxId: "",
    billingAddress: "",
    activeProjects: 0,
    notes: "",
  },
];

const bc = buildWorkspaceBcDashboardSummaryFromClients(sample);
const kpis = buildClientsDashboardKpis(sample, null, null, null);

assert.equal(bc.clientsCount, kpis.totalClients, "BC dashboard and Clients Dashboard must share total");
assert.equal(bc.activeClients, kpis.activeClients, "Active client counts must match");
assert.equal(bc.clientsCount, 1);

console.log("ok  client-directory-count-consistency");
