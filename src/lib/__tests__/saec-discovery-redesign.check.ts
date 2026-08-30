/**
 * SAEC Discovery questionnaire — config + draft snapshot checks.
 * Run: node --import tsx src/lib/__tests__/saec-discovery-redesign.check.ts
 */
import assert from "node:assert/strict";

import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_SECTIONS,
  buildDiscoverySubmissionSnapshot,
  discoveryResponsesAreBlank,
  emptySectionResponses,
  normalizeDiscoveryResponses,
  readSectionAnswer,
  responseKeysForSection,
} from "@/lib/saec-discovery/config";

assert.equal(SAEC_DISCOVERY_SECTIONS[0]?.id, "general");
assert.equal(SAEC_DISCOVERY_SECTIONS.at(-1)?.id, "reporting");

const softwareSections = SAEC_DISCOVERY_SECTIONS.filter((s) => s.kind === "software");
for (const section of softwareSections) {
  const keys = responseKeysForSection(section);
  assert.ok(keys.includes(SAEC_DISCOVERY_COMMENTS_KEY), `${section.title} must include comments`);
}

assert.equal(SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "general")?.includeComments, false);

const marketing = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "marketing-events");
assert.ok(marketing?.functions?.includes("Events"));
assert.equal(
  marketing?.functions?.includes("Campaigns"),
  false,
  "Campaigns must not appear in Marketing & Events",
);

const tech = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "tech-management");
assert.deepEqual(tech?.functions, ["IT Assets", "Software & Licenses", "Telecoms"]);

const hr = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "human-resources");
assert.ok(hr?.functions?.includes("Performance"));

const productivity = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "business-productivity");
assert.ok(productivity?.functions?.includes("Content Studio"));

const generalQuestions = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "general")?.questions ?? [];
assert.equal(generalQuestions.length, 6);

const reportingQuestions =
  SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "reporting")?.questions ?? [];
assert.equal(reportingQuestions.length, 6);
assert.equal(reportingQuestions[1]?.id, "difficult-to-produce");
assert.equal(reportingQuestions[5]?.id, "automatic-reports");

assert.equal(SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "general")?.footer, undefined);

const stored = normalizeDiscoveryResponses({});
assert.equal(Object.keys(stored).length, SAEC_DISCOVERY_SECTIONS.length);

const draft = {
  ...emptySectionResponses(SAEC_DISCOVERY_SECTIONS[0]!),
  "top-annoyances": "Slow reports",
};
const snapshot = buildDiscoverySubmissionSnapshot(stored, "general", draft);
assert.equal(readSectionAnswer(snapshot, "general", "top-annoyances"), "Slow reports");

const clientDraft = {
  ...emptySectionResponses(SAEC_DISCOVERY_SECTIONS[1]!),
  "Client Directory": "Excel",
  [SAEC_DISCOVERY_COMMENTS_KEY]: "Legacy CRM notes",
};
const clientSnapshot = buildDiscoverySubmissionSnapshot(stored, "client-management", clientDraft);
assert.equal(
  readSectionAnswer(clientSnapshot, "client-management", "Client Directory"),
  "Excel",
);
assert.equal(
  readSectionAnswer(clientSnapshot, "client-management", SAEC_DISCOVERY_COMMENTS_KEY),
  "Legacy CRM notes",
);

assert.equal(discoveryResponsesAreBlank(normalizeDiscoveryResponses({})), true);
assert.equal(discoveryResponsesAreBlank(clientSnapshot), false);

console.log("ok  saec-discovery-redesign checks passed\n");
