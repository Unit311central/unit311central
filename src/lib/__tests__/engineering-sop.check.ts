/**
 * Engineering SOP Phase 2 — controlled procedure runs.
 */
import assert from "node:assert/strict";

import {
  ENG_SOP_AUDIENCES,
  canRunEngSop,
  countSopSteps,
  createSeedEngineeringSops,
} from "@/lib/engineering-sop-data";
import { ENGINEERING_SOPS_NAV_ITEM, ENGINEERING_SOP_CHILD_VIEWS } from "@/lib/engineering-nav";
import {
  approveEngSop,
  completeEngSopRunStep,
  createDraftFromApproved,
  createEngSop,
  getEngSopById,
  getEngineeringSopSnapshot,
  getLatestCompletedRun,
  resetEngineeringSopStoreForTests,
  signOffEngSopRun,
  startEngSopRun,
  submitEngSopForReview,
  updateEngSop,
} from "@/lib/engineering-sop-store";
import { buildOnwardAirNavSections } from "@/lib/internal-role-views";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";

resetEngineeringSopStoreForTests();

const seeds = createSeedEngineeringSops();
assert.ok(seeds[0]!.approver);
assert.ok(ENG_SOP_AUDIENCES.includes("internal"));

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "demo",
  workspaceType: "Demo",
});
const demoNav = resolveWorkspaceNavBaseSections({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enablement: demoEnablement,
});
assert.ok(
  demoNav.some(
    (s) =>
      s.label === "Engineering" &&
      s.items.some(
        (i) => i.children?.some((c) => c.view === "engineering-sops-library") ?? i.view === "engineering-sops-library",
      ),
  ),
);

const oaNav = buildOnwardAirNavSections(internalSurveyNavSections);
assert.ok(
  oaNav.some(
    (s) =>
      s.label === "Engineering" &&
      s.items.some(
        (i) => i.children?.some((c) => c.view === "engineering-sops-library") ?? i.view === "engineering-sops-library",
      ),
  ),
);
assert.ok(ENGINEERING_SOPS_NAV_ITEM.children?.some((c) => c.view === "engineering-sops-library"));
assert.equal(ENGINEERING_SOP_CHILD_VIEWS.length, 7);

const approved = getEngSopById("eng-sop-001")!;
assert.ok(canRunEngSop(approved));
assert.equal(approved.audience, "internal");

const draft = getEngSopById("eng-sop-003")!;
assert.ok(!canRunEngSop(draft));
const obsolete = updateEngSop("eng-sop-003", { status: "Obsolete" });
assert.ok(obsolete);
assert.ok(!canRunEngSop(obsolete!));

const run = startEngSopRun(approved.id, "Test Runner");
assert.ok(run);
assert.equal(run!.status, "in_progress");
assert.equal(run!.stepStates.length, countSopSteps(approved));

assert.equal(startEngSopRun(draft.id, "Test Runner"), null);

const flat = approved.sections.flatMap((s) => s.steps);
const first = flat[0]!;
const skip = completeEngSopRunStep(run!.runId, flat[1]!.id, {
  completedBy: "Test Runner",
  outcome: "pass",
});
assert.equal(skip.ok, false);

const step1 = completeEngSopRunStep(run!.runId, first.id, {
  completedBy: "Test Runner",
  outcome: "pass",
  notes: "CI green",
});
assert.equal(step1.ok, true);
assert.ok(step1.ok && step1.run.stepStates.find((s) => s.stepId === first.id)?.completedBy === "Test Runner");
assert.ok(step1.ok && step1.run.stepStates.find((s) => s.stepId === first.id)?.completedAt);

let activeRun = getEngineeringSopSnapshot().runs.find((r) => r.runId === run!.runId)!;
for (const step of flat.slice(1)) {
  const evidence = step.requiresEvidence ? { evidenceRefs: ["ref-001"] } : {};
  const res = completeEngSopRunStep(activeRun.runId, step.id, {
    completedBy: "Test Runner",
    outcome: "pass",
    ...evidence,
  });
  assert.equal(res.ok, true);
  activeRun = getEngineeringSopSnapshot().runs.find((r) => r.runId === run!.runId)!;
}

const signed = signOffEngSopRun(activeRun.runId, { signedBy: "Test Runner", comment: "All good" });
assert.equal(signed.ok, true);
if (signed.ok) {
  assert.equal(signed.run.status, "completed");
  assert.ok(signed.run.signOff?.signedAt);
  assert.ok(signed.run.completedAt);
}

const latest = getLatestCompletedRun(approved.id);
assert.ok(latest);
assert.equal(latest!.runId, run!.runId);

const blocked = updateEngSop(approved.id, { title: "Changed in place" });
assert.equal(blocked, null);

const revision = createDraftFromApproved(approved.id);
assert.ok(revision);
assert.equal(revision!.status, "Draft");
assert.equal(revision!.supersedesId, approved.id);
assert.notEqual(revision!.id, approved.id);

const sameDraft = createDraftFromApproved(approved.id);
assert.equal(sameDraft!.id, revision!.id);

const edited = updateEngSop(revision!.id, { title: "Release checklist v2 draft" });
assert.ok(edited);

submitEngSopForReview(revision!.id);
approveEngSop(revision!.id, "Paul Fotheringham");
const oldApproved = getEngSopById(approved.id);
assert.equal(oldApproved?.status, "Obsolete");

const created = createEngSop({
  number: "SOP-ENG-TEST",
  title: "Test procedure",
  version: "0.1",
  owner: "Owner",
  approver: "Approver",
  audience: "client",
  reviewDate: "2027-01-01",
  sections: [],
});
assert.equal(created.audience, "client");

console.log("ok  engineering-sop checks passed\n");
