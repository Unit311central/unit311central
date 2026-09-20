import assert from "node:assert/strict";

import { buildCreateClientRequestBody } from "@/lib/client-create-from-draft";
import {
  CLIENT_RECORD_COUNTRY_OPTIONS,
  NEW_CLIENT_DRAFT_ID,
  createNewClientDraft,
  isNewClientDraftId,
} from "@/lib/client-management-data";

assert.equal(isNewClientDraftId(NEW_CLIENT_DRAFT_ID), true);
assert.equal(isNewClientDraftId("client-abc123"), false);

const draft = createNewClientDraft();
assert.equal(draft.id, NEW_CLIENT_DRAFT_ID);
assert.equal(draft.companyName, "");
assert.equal(draft.companyCountry, "");
assert.equal(draft.supportLoungeUrl, undefined);

const createBody = buildCreateClientRequestBody({ ...draft, companyName: "Test 1" });
assert.equal(createBody.companyName, "Test 1");

for (const country of [
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "South Africa",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "India",
  "China",
  "Japan",
  "Brazil",
  "Mexico",
  "United Arab Emirates",
  "Singapore",
  "New Zealand",
]) {
  assert.ok(
    CLIENT_RECORD_COUNTRY_OPTIONS.includes(country),
    `expected ${country} in CLIENT_RECORD_COUNTRY_OPTIONS`,
  );
}

console.log("ok  client-new-draft");
