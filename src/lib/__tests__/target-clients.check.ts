/**
 * Target Clients — validation, search, CRM mapping (internal Sales Management).
 */
import assert from "node:assert/strict";

import type { CrmLead } from "@/lib/crm-data";
import {
  ADD_TARGET_CLIENT_FIELD_ORDER,
  TARGET_CLIENTS_CRM_SOURCE,
  assertTargetClientsApiHost,
  isTargetClientLead,
  mapLeadToTargetClientRow,
  normalizeTargetClientWebsiteInput,
  normalizeTargetClientNotesForSave,
  resolveTargetClientContactNameForSave,
  searchTargetClientRows,
  validateAddTargetClientForm,
  validateTargetClientEmail,
  validateTargetClientNotes,
  TARGET_CLIENT_NOTES_MAX_LENGTH,
  displayTargetClientNotes,
} from "@/lib/target-clients";
import { CRM_CLIENT_REPORT_NOTES_PREFIX } from "@/lib/crm-client-report-notes";
import { isTargetClientsRolloutHost } from "@/lib/sales-management-target-clients";

assert.deepEqual(ADD_TARGET_CLIENT_FIELD_ORDER, [
  "companyName",
  "website",
  "sector",
  "notes",
  "contactName",
  "contactPosition",
  "email",
]);

assert.equal(
  validateAddTargetClientForm({
    companyName: "  ",
    website: "",
    sector: "",
    contactName: "",
    contactPosition: "",
    email: "",
    notes: "",
  }).companyName,
  "Company name is required.",
);

assert.equal(normalizeTargetClientWebsiteInput("").error, null);
assert.equal(normalizeTargetClientWebsiteInput("not a url").error, "Enter a valid website address.");
assert.equal(normalizeTargetClientWebsiteInput("acme.com").normalized, "https://acme.com");
assert.equal(normalizeTargetClientWebsiteInput("www.acme.com").normalized, "https://www.acme.com");
assert.equal(normalizeTargetClientWebsiteInput("http://acme.com").normalized, "http://acme.com");
assert.equal(normalizeTargetClientWebsiteInput("javascript:alert(1)").error, "Enter a valid website address.");

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

assert.equal(isTargetClientLead({ ...sampleLead, source: "Website", status: "Cold" }), false);
assert.equal(isTargetClientLead({ ...sampleLead, source: TARGET_CLIENTS_CRM_SOURCE, status: "Warm" }), false);
assert.equal(isTargetClientLead({ ...sampleLead, source: TARGET_CLIENTS_CRM_SOURCE, status: "Cold" }), true);

const row = mapLeadToTargetClientRow(sampleLead);
assert.equal(row.companyName, "Acme Ltd");
assert.equal(row.sector, "Construction");
assert.equal(row.contacted, false);
assert.equal(row.notes, "");

const notesLead = {
  ...sampleLead,
  notes: "Line one\nLine two",
};
assert.equal(mapLeadToTargetClientRow(notesLead).notes, "Line one\nLine two");

const reportBlock = `${CRM_CLIENT_REPORT_NOTES_PREFIX}\n{"clientReportFileId":"x"}`;
assert.equal(displayTargetClientNotes(`Research memo\n\n${reportBlock}`), "Research memo");

assert.equal(normalizeTargetClientNotesForSave("  hello  "), "hello");
assert.equal(validateTargetClientNotes(""), null);
assert.equal(validateTargetClientNotes("a".repeat(TARGET_CLIENT_NOTES_MAX_LENGTH)), null);
assert.match(validateTargetClientNotes("a".repeat(TARGET_CLIENT_NOTES_MAX_LENGTH + 1)) ?? "", /5000/);

const contactedLead = { ...sampleLead, contactCount: 1 };
assert.equal(mapLeadToTargetClientRow(contactedLead).contacted, true);

const rows = [
  row,
  { ...row, id: "2", companyName: "Beta Corp", email: "x@beta.example" },
];
assert.equal(searchTargetClientRows(rows, "").length, 2);
assert.equal(searchTargetClientRows(rows, "beta").length, 1);
assert.equal(searchTargetClientRows(rows, "nomatch").length, 0);

assert.doesNotThrow(() => assertTargetClientsApiHost("internal.unit311central.com"));
assert.doesNotThrow(() => assertTargetClientsApiHost("demo.unit311central.com"));
assert.doesNotThrow(() => assertTargetClientsApiHost("wolf.unit311central.com"));
assert.throws(() => assertTargetClientsApiHost("abhi.unit311central.com"));
assert.equal(isTargetClientsRolloutHost("wolf.unit311central.com"), true);

console.log("ok  target-clients checks passed\n");
