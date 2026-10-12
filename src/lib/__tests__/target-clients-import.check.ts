/**
 * Target Clients import/export parsing, mapping, validation, CSV safety.
 */
import assert from "node:assert/strict";

import { buildTargetClientsExportCsv, targetClientsExportFilename } from "@/lib/target-clients-export";
import {
  applyColumnMapping,
  buildCrmDuplicateKeysFromLeads,
  matchesExistingCrm,
  parseTargetClientsCsv,
  previewImportRows,
  sanitizeCsvExportCell,
  splitCsvLine,
  suggestColumnMapping,
} from "@/lib/target-clients-import";
import type { TargetClientRow } from "@/lib/target-clients";
import { validateTargetClientSector } from "@/lib/target-clients";

assert.deepEqual(splitCsvLine('"a,b",c'), ["a,b", "c"]);
assert.deepEqual(splitCsvLine('"say ""hi""",x'), ['say "hi"', "x"]);

const multilineCsv = 'Name,Note\nAcme,"line1\nline2"\n';
const parsedMulti = parseTargetClientsCsv(multilineCsv);
assert.equal(parsedMulti.rows.length, 1);
assert.equal(parsedMulti.rows[0][1], "line1\nline2");

const utf8Csv =
  "\uFEFFOrganisation,Web address,Market sector,Primary contact,Contact's role,Work email\nNordic Å Ltd,example.com,Construction,Ann O'Neill,Director,ann@nordic.example\n";
const parsedUtf8 = parseTargetClientsCsv(utf8Csv);
const mapping = suggestColumnMapping(parsedUtf8.headers);
assert.equal(mapping.companyName, 0);
assert.equal(mapping.website, 1);
assert.equal(mapping.sector, 2);
assert.equal(mapping.contactName, 3);
assert.equal(mapping.contactPosition, 4);
assert.equal(mapping.email, 5);

const mapped = applyColumnMapping(parsedUtf8.headers, parsedUtf8.rows, mapping);
assert.equal(mapped[0].companyName, "Nordic Å Ltd");

const crmKeys = buildCrmDuplicateKeysFromLeads([
  { companyName: "Existing Co", email: "dup@example.com" },
]);
assert.equal(
  matchesExistingCrm(
    {
      companyName: "Existing Co",
      website: "",
      sector: "",
      contactName: "",
      contactPosition: "",
      email: "",
    },
    crmKeys,
  ),
  true,
);

const previewRows = [
  {
    sourceRowNumber: 2,
    companyName: "Good Co",
    website: "good.com",
    sector: "Construction",
    contactName: "",
    contactPosition: "",
    email: "good@example.com",
  },
  {
    sourceRowNumber: 3,
    companyName: "",
    website: "",
    sector: "",
    contactName: "",
    contactPosition: "",
    email: "",
  },
  {
    sourceRowNumber: 4,
    companyName: "Bad Email",
    website: "",
    sector: "",
    contactName: "",
    contactPosition: "",
    email: "not-an-email",
  },
  {
    sourceRowNumber: 5,
    companyName: "Good Co",
    website: "",
    sector: "",
    contactName: "",
    contactPosition: "",
    email: "other@example.com",
  },
];

const previews = previewImportRows(previewRows, crmKeys);
assert.equal(previews.filter((p) => p.status === "ready").length, 1);
assert.equal(previews.filter((p) => p.status === "error").length, 2);
assert.equal(previews.filter((p) => p.status === "duplicate_file").length, 1);

assert.equal(sanitizeCsvExportCell("=SUM(A1)"), "'=SUM(A1)");
assert.equal(sanitizeCsvExportCell("+441234"), "'+441234");
assert.equal(sanitizeCsvExportCell("Acme Ltd"), "Acme Ltd");

const exportRow: TargetClientRow = {
  id: "1",
  companyName: "Test, \"Quote\" Co",
  website: "https://test.example",
  sector: "Other",
  contactName: "Sam",
  contactPosition: "CEO",
  email: "sam@test.example",
  contacted: true,
};
const csvOut = buildTargetClientsExportCsv([exportRow]);
assert.ok(csvOut.startsWith("\uFEFF"));
assert.ok(csvOut.includes("Company Name"));
assert.ok(csvOut.includes("Contacted?"));
assert.ok(csvOut.includes("Yes"));
assert.match(targetClientsExportFilename(new Date("2026-10-12T12:00:00Z")), /^unit311-target-clients-2026-10-12\.csv$/);

const emptyParsed = parseTargetClientsCsv("\n\n");
assert.equal(emptyParsed.headers.length, 0);

assert.equal(validateTargetClientSector("Technology"), null);
assert.equal(validateTargetClientSector("Construction"), null);
assert.equal(validateTargetClientSector("a".repeat(121)), validateTargetClientSector("x".repeat(121)));

const sevenRowCsv = `Organisation,Web address,Market sector,Primary contact,Contact's role,Work email
Northstar Fixtures Ltd,northstar-fixtures.example,Manufacturing,Alex Mercer,Head of Procurement,alex.m@northstar-fixtures.example
Harborline Analytics,harborline-analytics.example,Technology,Priya Nair,VP Commercial,priya.nair@harborline-analytics.example
Summit Civic Partners,summit-civic.example,Government & Public,Jordan Ellis,Programme Director,j.ellis@summit-civic.example
Delta Logistics Ltd,delta-logistics.example,Logistics & Ports,Sam Lee,Operations Director,sam@delta-logistics.example
Northstar Fixtures Ltd,northstar-fixtures.example,Manufacturing,Alex Mercer,Head of Procurement,alex.m@northstar-fixtures.example
Bad Email Co,bad.example.com,Construction,Chris Epsilon,Manager,not-an-email
,ghost.example.com,Other,Ghost User,Intern,ghost@example.com
`;

const sevenParsed = parseTargetClientsCsv(sevenRowCsv);
assert.equal(sevenParsed.rows.length, 7);
const sevenMapping = suggestColumnMapping(sevenParsed.headers);
const sevenMapped = applyColumnMapping(sevenParsed.headers, sevenParsed.rows, sevenMapping);
const sevenPreviews = previewImportRows(sevenMapped, new Set());
assert.equal(sevenPreviews.length, 7);
assert.equal(sevenPreviews.filter((p) => p.status === "ready").length, 4);
assert.equal(sevenPreviews.filter((p) => p.status === "duplicate_file").length, 1);
assert.equal(sevenPreviews.filter((p) => p.status === "error").length, 2);
assert.equal(
  sevenPreviews.find((p) => p.sourceRowNumber === 6)?.status,
  "duplicate_file",
  "second Northstar row should be a file duplicate",
);
assert.equal(
  sevenPreviews.find((p) => p.sourceRowNumber === 7)?.messages.some((m) => m.includes("email")),
  true,
);
assert.equal(
  sevenPreviews.find((p) => p.sourceRowNumber === 8)?.messages.some((m) => m.includes("Company name")),
  true,
);

console.log("target-clients-import.check.ts: ok");
