/**
 * Engineering SOP central product capability checks.
 */
import assert from "node:assert/strict";

import { buildRunStepRows } from "@/lib/engineering-sop/mappers";
import { buildNorthstarEngineeringSopCatalogue } from "@/lib/engineering-sop/northstar-seed";
import { canRunEngSop, countSopSteps, createSeedEngineeringSops } from "@/lib/engineering-sop-data";
import {
  resetEngineeringSopStoreForTests,
  startEngSopRun,
} from "@/lib/engineering-sop-store";

resetEngineeringSopStoreForTests();

const approved = createSeedEngineeringSops().find((s) => s.id === "eng-sop-001")!;
assert.ok(canRunEngSop(approved));

const run = startEngSopRun(approved.id, "Regression Tester");
assert.ok(run, "Run SOP must create a persisted in-memory run for approved SOPs");
assert.equal(run!.stepStates.length, countSopSteps(approved));
assert.equal(run!.status, "in_progress");

const stepRows = buildRunStepRows("workspace-test", "run-test", approved, "Jordan Blake");
assert.equal(stepRows.length, countSopSteps(approved));
assert.ok(stepRows.every((row) => row.run_id === "run-test"));
assert.ok(stepRows.every((row) => row.workspace_id === "workspace-test"));

const northstar = buildNorthstarEngineeringSopCatalogue();
assert.ok(northstar.length >= 12, "Northstar catalogue should include demo SOPs and templates");
assert.ok(northstar.some((s) => s.isTemplate), "Northstar must include templates");
assert.ok(northstar.some((s) => s.status === "Retired" || s.status === "Obsolete"));
assert.ok(northstar.some((s) => s.status === "In Review"));
assert.ok(northstar.some((s) => s.title.includes("Production Release")));
assert.ok(northstar.some((s) => s.title.includes("Incident")));
assert.ok(northstar.filter((s) => !s.isTemplate).length >= 5);

console.log("ok  engineering-sop-central checks passed\n");
