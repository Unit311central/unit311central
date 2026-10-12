/**
 * Target Clients — validation, search, CRM mapping (internal Sales Management).
 */
import assert from "node:assert/strict";

import type { CrmLead } from "@/lib/crm-data";
import {
  ADD_TARGET_CLIENT_FIELD_ORDER,
  assertTargetClientsApiHost,
  mapLeadToTargetClientRow,
  normalizeTargetClientWebsiteInput,
  resolveTargetClientContactNameForSave,
  searchTargetClientRows,
  validateAddTargetClientForm,
  validateTargetClientEmail,
} from "@/lib/target-clients";
import { isTargetClientsRolloutHost } from "@/lib/sales-management-target-clients";

assert.deepEqual(ADD_TARGET_CLIENT_FIELD_ORDER, [
  "companyName",
  "website",
  "sector",
  "contactName",
  "contactPosition",
  "email",
]);

assert.equal(validateAddTargetClientForm({ companyName: "  ", website: "", sector: "", contactName: "", contactPosition: "", email: "" }).companyName, "Company name is required.");

assert.equal(normalizeTargetClientWebsiteInput("").error, null);
assert.equal(normalizeTargetClientWebsiteInput("not a url").error, "Enter a valid website URL.");
assert.ok(normalizeTargetClientWebsiteInput("acme.com").normalized.startsWith("https://"));

assert.equal(validateTargetClientEmail(""), null);
assert.equal(validateTargetClientEmail("bad"), "Enter a valid email address.");
assert.equal(validateTargetClientEmail("a@b.co"), null);

assert.equal(resolveTargetClientContactNameForSave(""), "—");
assert.equal(resolveTargetClientContactNameForSave("Alex"), "Alex");

const sampleLead = {
  id: "lead-1",
  workspaceId: "ws-1",
  companyName: "Acme Ltd",
  companyWebsite: "https://acme.example",
  industry: "Construction",
  contactName: "Jordan Lee",
  firstName: "",
  surname: "",
  role: "Director",
  email: "j@acme.example",
  phone: "",
  status: "Cold",
  source: "Target Clients",
  nextAction: "",
  nextActionDate: null,
  estimatedValue: null,
  notes: "",
  discoveryNotes: "",
  lastContactAt: null,
  lastActivityAt: null,
  contactCount: 0,
  needsManualReview: false,
  manualReviewReason: "",
  originalEnquirySubject: "",
  originalEnquiryMessage: "",
  originalEnquirySubmittedAt: null,
  clientReportFileId: null,
  clientReportFileName: null,
  clientReportGeneratedAt: null,
  clientReportPptFileId: null,
  clientReportPptFileName: null,
  clientReportSentAt: null,
  clientReportMessageId: null,
  clientReportRepliedAt: null,
  clientReportReminder7dSentAt: null,
  clientReportReminder14dSentAt: null,
  clientReportLastReminderSentAt: null,
  clientChatRoom: null,
  clientChatKey: null,
  clientChatAccessToken: null,
  companyLogoFileId: null,
  companyLogoFileName: null,
  ownerUserId: null,
  winProbability: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies CrmLead;

const row = mapLeadToTargetClientRow(sampleLead);
assert.equal(row.companyName, "Acme Ltd");
assert.equal(row.sector, "Construction");
assert.equal(row.contacted, false);

const contactedLead = { ...sampleLead, contactCount: 1 };
assert.equal(mapLeadToTargetClientRow(contactedLead).contacted, true);

const rows = [
  row,
  { ...row, id: "2", companyName: "Beta Corp", email: "x@beta.example" },
];
assert.equal(searchTargetClientRows(rows, "").length, 2);
assert.equal(searchTargetClientRows(rows, "beta").length, 1);
assert.equal(searchTargetClientRows(rows, "nomatch").length, 0);

assert.throws(() => assertTargetClientsApiHost("demo.unit311central.com"));
assert.doesNotThrow(() => assertTargetClientsApiHost("internal.unit311central.com"));
assert.equal(isTargetClientsRolloutHost("wolf.unit311central.com"), false);

console.log("ok  target-clients checks passed\n");
