/**
 * SAEC Discovery questionnaire — config + draft snapshot checks.
 * Run: node --import tsx src/lib/__tests__/saec-discovery-redesign.check.ts
 */
import assert from "node:assert/strict";

import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_SECTIONS,
  SAEC_DISCOVERY_STORAGE_KEY,
  buildDiscoverySubmissionSnapshot,
  discoveryResponsesAreBlank,
  emptySectionResponses,
  normalizeDiscoveryResponses,
  readSectionAnswer,
  responseKeysForSection,
  parseStoredDiscoveryDraftRaw,
  saecDiscoveryDraftStorageKey,
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
assert.ok(marketing?.functions?.some((entry) => entry.id === "Events"));
assert.equal(
  marketing?.functions?.some((entry) => entry.id === "Campaigns"),
  false,
  "Campaigns must not appear in Marketing & Events",
);

const tech = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "tech-management");
assert.deepEqual(
  tech?.functions?.map((entry) => entry.id),
  ["IT Assets", "Software & Licenses", "Telecoms"],
);

const hr = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "human-resources");
assert.ok(hr?.functions?.some((entry) => entry.id === "Performance"));

const productivity = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "business-productivity");
assert.ok(productivity?.functions?.some((entry) => entry.id === "Content Studio"));

const training = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "training");
assert.ok(training?.functions?.some((entry) => entry.id === "Training Records"));
assert.ok(training?.functions?.some((entry) => entry.id === "Competency Tracking"));

const qms = SAEC_DISCOVERY_SECTIONS.find((s) => s.id === "qms");
assert.ok(qms?.functions?.some((entry) => entry.id === "Quality Records"));
assert.ok(qms?.functions?.some((entry) => entry.id === "Quality Procedures"));

const legacyTraining = normalizeDiscoveryResponses({
  training: {
    completed: false,
    responses: {
      Courses: "LMS A",
      Certifications: "Spreadsheet",
      "Staff Training": "Teams",
      "Compliance Training": "SharePoint",
      [SAEC_DISCOVERY_COMMENTS_KEY]: "",
    },
  },
});
assert.equal(readSectionAnswer(legacyTraining, "training", "Training Records"), "LMS A");
assert.equal(readSectionAnswer(legacyTraining, "training", "Competency Tracking"), "Spreadsheet");
assert.equal(readSectionAnswer(legacyTraining, "training", "Training Delivery"), "Teams");
assert.equal(readSectionAnswer(legacyTraining, "training", "Training Requirements"), "SharePoint");

const legacyUnscoped = {
  general: {
    completed: false,
    responses: { "top-annoyances": "stale browser test answer" },
  },
};
assert.equal(
  parseStoredDiscoveryDraftRaw(JSON.stringify(legacyUnscoped), "user-123").state.general?.responses?.[
    "top-annoyances"
  ] ?? "",
  "",
  "authed users must not inherit legacy unscoped draft data",
);
const scopedEnvelope = JSON.stringify({
  ownerId: "user-123",
  state: normalizeDiscoveryResponses(legacyUnscoped),
});
assert.equal(
  parseStoredDiscoveryDraftRaw(scopedEnvelope, "user-123").state.general?.responses?.["top-annoyances"],
  "stale browser test answer",
  "user-scoped drafts restore for the matching owner",
);
assert.equal(
  parseStoredDiscoveryDraftRaw(scopedEnvelope, "user-456").state.general?.responses?.["top-annoyances"] ?? "",
  "",
  "other users must not read another user's scoped draft",
);
assert.equal(
  saecDiscoveryDraftStorageKey("user-123"),
  `${SAEC_DISCOVERY_STORAGE_KEY}:user-123`,
);

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
