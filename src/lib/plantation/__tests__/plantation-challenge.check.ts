/**
 * Plantation challenge public form and ranked responses.
 *
 * Run: npx tsx src/lib/plantation/__tests__/plantation-challenge.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { migrationsMissingSatisfactionProbes } from "@/lib/migration-satisfaction-probes";
import {
  classifyPlantationInsertError,
  parsePlantationSubmission,
  plantationBarPercent,
  rankPlantationSubmissions,
  type PlantationSubmissionRecord,
} from "@/lib/plantation/plantation-challenge";
import { isPlantationChallengePath } from "@/lib/plantation/plantation-challenge-public-path";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";
import { isViewAllowedForWorkspaceGrants } from "@/lib/workspace-enabled-views";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

const parsed = parsePlantationSubmission({
  participantName: "  Aisha Rahman ",
  section1Hectares: "5.3",
  section2Hectares: 4.2,
  section1Trees: "720",
  section2Trees: 530,
});
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.equal(parsed.value.participantName, "Aisha Rahman");
  assert.equal(parsed.value.normalizedName, "aisha rahman");
  assert.equal(parsed.value.section1Hectares, 5.3);
  assert.equal(parsed.value.section2Hectares, 4.2);
  assert.equal(parsed.value.section1Trees, 720);
  assert.equal(parsed.value.section2Trees, 530);
}

assert.equal(parsePlantationSubmission({ participantName: " " }).ok, false);
assert.equal(
  parsePlantationSubmission({
    participantName: "Ben",
    section1Hectares: "5",
    section2Hectares: "4",
    section1Trees: "12.5",
    section2Trees: "10",
  }).ok,
  false,
);

assert.equal(classifyPlantationInsertError({ code: "23505" }), "duplicate");
assert.equal(classifyPlantationInsertError({ code: "42P01" }), "unavailable");

const rows: PlantationSubmissionRecord[] = [
  {
    id: "1",
    participantName: "Ada",
    normalizedName: "ada",
    section1Hectares: 5.3,
    section2Hectares: 3,
    section1Trees: 400,
    section2Trees: 900,
    submittedAt: "2026-11-08T02:00:00.000Z",
  },
  {
    id: "2",
    participantName: "Bo",
    normalizedName: "bo",
    section1Hectares: 8,
    section2Hectares: 4.2,
    section1Trees: 720,
    section2Trees: 100,
    submittedAt: "2026-11-08T02:01:00.000Z",
  },
];

assert.deepEqual(
  rankPlantationSubmissions(rows, "section1Hectares").map((row) => row.participantName),
  ["Bo", "Ada"],
);
assert.deepEqual(
  rankPlantationSubmissions(rows, "section2Trees").map((row) => row.participantName),
  ["Ada", "Bo"],
);
assert.equal(plantationBarPercent(8, 8), 100);
assert.equal(plantationBarPercent(4, 8), 50);
assert.equal(plantationBarPercent(0, 8), 0);
assert.equal(plantationBarPercent(1, 0), 0);
assert.ok(Math.abs(plantationBarPercent(5.3, 8) - 66.25) < 0.001);

assert.equal(isPlantationChallengePath("/plantation"), true);
assert.equal(isPlantationChallengePath("/plantation/"), true);
assert.equal(isPlantationChallengePath("/plantations"), false);
assert.equal(isPlantationChallengePath("/course"), false);

const migration = "supabase/migrations/223_plantation_challenge_responses.sql";
assert.ok(UNIT311_PENDING_MIGRATIONS.includes(migration));
assert.equal(migrationsMissingSatisfactionProbes(UNIT311_PENDING_MIGRATIONS).includes(migration), false);
const sql = readFileSync(migration, "utf8");
assert.match(sql, /grant select, insert, delete on table public\.plantation_challenge_responses to service_role/);
assert.match(sql, /using \(false\)/);
assert.match(sql, /plantation challenge submissions cannot be changed/);

assert.equal(
  isViewAllowedForWorkspaceGrants("wolf-plantation-overview", ["home"], {
    workspaceSlug: WOLF_CENTRAL_SLUG,
  }),
  true,
);

const workspace = readFileSync("src/components/wolf/WolfPlantationChallengeWorkspace.tsx", "utf8");
const overviewSource = workspace.slice(workspace.indexOf("function Overview"), workspace.indexOf("function Details"));
assert.match(overviewSource, /<th className="px-2 py-2 font-medium">Name<\/th>/);
assert.match(overviewSource, /metric\.label/);
assert.match(overviewSource, /submission\.participantName/);
assert.match(overviewSource, /<MetricChart/);
assert.doesNotMatch(overviewSource, /rows\[index\]/);
assert.match(readFileSync("src/lib/plantation/plantation-challenge.ts", "utf8"), /Hectare section 1/);
assert.match(readFileSync("src/lib/plantation/plantation-challenge.ts", "utf8"), /Hectare section 2/);
assert.match(readFileSync("src/lib/plantation/plantation-challenge.ts", "utf8"), /Tree section 1/);
assert.match(readFileSync("src/lib/plantation/plantation-challenge.ts", "utf8"), /Tree section 2/);

const middleware = readFileSync("src/middleware.ts", "utf8");
assert.match(middleware, /isPlantationChallengePath\(pathname\)/);
assert.match(middleware, /WOLF_CENTRAL_ORIGIN\}\/plantation/);
const publicRoute = readFileSync("src/app/api/plantation/route.ts", "utf8");
assert.doesNotMatch(publicRoute, /requireWolfCentralWorkspace/);
assert.doesNotMatch(publicRoute, /export async function GET/);
const adminRoute = readFileSync("src/app/api/wolf/plantation/route.ts", "utf8");
assert.match(adminRoute, /requireWolfCentralWorkspace/);
assert.match(adminRoute, /export async function DELETE/);

console.log("plantation-challenge.check.ts — all assertions passed.");
