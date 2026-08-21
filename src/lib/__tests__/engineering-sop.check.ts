/**
 * Engineering SOP foundation — nav wiring, data model, and store.
 */
import assert from "node:assert/strict";

import { injectDemoNavSections } from "@/lib/demo/nav";
import {
  ENG_SOP_STATUSES,
  createSeedEngineeringSops,
  engSopStatusClass,
} from "@/lib/engineering-sop-data";
import { ENGINEERING_SOPS_NAV_ITEM } from "@/lib/engineering-nav";
import {
  approveEngSop,
  createEngSop,
  getEngineeringSopSnapshot,
  submitEngSopForReview,
} from "@/lib/engineering-sop-store";
import { buildOnwardAirNavSections } from "@/lib/internal-role-views";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.ok(ENG_SOP_STATUSES.includes("Approved"));
assert.ok(engSopStatusClass("Draft").includes("amber"));

const seeds = createSeedEngineeringSops();
assert.ok(seeds.length >= 2, "seed SOPs required");
assert.ok(seeds[0]!.sections.every((s) => s.steps.length >= 1), "sections must have steps");

const demoNav = injectDemoNavSections(internalSurveyNavSections);
const demoEng = demoNav.find((s) => s.label === "Engineering");
assert.ok(demoEng, "demo Engineering section required");
assert.ok(
  demoEng.items.some((item) => item.view === "engineering-sops"),
  "demo Engineering nav must include SOPs",
);

const oaNav = buildOnwardAirNavSections(internalSurveyNavSections);
const oaEng = oaNav.find((s) => s.label === "Engineering");
assert.ok(oaEng, "OnwardAir Engineering section required");
assert.ok(
  oaEng.items.some((item) => item.view === "engineering-sops"),
  "OnwardAir Engineering nav must include SOPs",
);

assert.equal(ENGINEERING_SOPS_NAV_ITEM.view, "engineering-sops");

const before = getEngineeringSopSnapshot().sops.length;
const created = createEngSop({
  number: "SOP-ENG-TEST",
  title: "Test SOP",
  version: "0.1",
  owner: "Test Owner",
  reviewDate: "2027-01-01",
  sections: [],
});
assert.ok(created.id);
assert.equal(getEngineeringSopSnapshot().sops.length, before + 1);

submitEngSopForReview(created.id);
assert.equal(
  getEngineeringSopSnapshot().sops.find((s) => s.id === created.id)?.status,
  "In Review",
);

approveEngSop(created.id, "Reviewer");
const approved = getEngineeringSopSnapshot().sops.find((s) => s.id === created.id);
assert.equal(approved?.status, "Approved");
assert.ok(approved?.effectiveDate);

console.log("ok  engineering-sop checks passed\n");
