/**
 * Malaysian land surveying course questionnaire.
 *
 * Run: npx tsx src/lib/course/__tests__/malaysian-land-survey.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  COURSE_DUPLICATE_MESSAGE,
  COURSE_QUESTION_1_OPTIONS,
  classifyCourseInsertError,
  formatCourseSubmittedAt,
  normalizeParticipantName,
  parseCourseSubmission,
  summarizeCourseResponses,
  trimParticipantName,
} from "@/lib/course/malaysian-land-survey";
import { isMalaysianLandSurveyCoursePath } from "@/lib/course/malaysian-land-survey-public-path";
import { migrationsMissingSatisfactionProbes } from "@/lib/migration-satisfaction-probes";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";
import {
  applyWolfWorkspaceAllowedViews,
  isViewAllowedForWorkspaceGrants,
} from "@/lib/workspace-enabled-views";
import { WOLF_COURSE_RESPONSE_VIEWS } from "@/lib/wolf/course-response-views";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

assert.equal(trimParticipantName("  Aisha Rahman  "), "Aisha Rahman");
assert.equal(normalizeParticipantName("  Aisha Rahman  "), "aisha rahman");
assert.equal(normalizeParticipantName("AISHA RAHMAN"), normalizeParticipantName("aisha rahman"));
assert.notEqual(normalizeParticipantName("Aisha Rahman"), normalizeParticipantName("Aisha  Rahman"));

const full = parseCourseSubmission({
  participantName: "  Aisha Rahman ",
  question1: ["Urban development", "Other"],
  question2: ["Drones / UAVs"],
  question3: ["GIS / mapping software", "GIS / mapping software"],
  question4: [],
  question5: "  Please include a coastal example.  ",
});
assert.equal(full.ok, true);
if (full.ok) {
  assert.equal(full.value.participantName, "Aisha Rahman");
  assert.equal(full.value.normalizedName, "aisha rahman");
  assert.deepEqual(full.value.question1, ["Urban development", "Other"]);
  assert.deepEqual(full.value.question3, ["GIS / mapping software"]);
  assert.equal(full.value.question4, null);
  assert.equal(full.value.question5, "Please include a coastal example.");
}

const nameOnly = parseCourseSubmission({ participantName: "Ben" });
assert.equal(nameOnly.ok, true);
if (nameOnly.ok) {
  assert.equal(nameOnly.value.question1, null);
  assert.equal(nameOnly.value.question5, null);
}

const missingName = parseCourseSubmission({ participantName: "   " });
assert.equal(missingName.ok, false);

const unknownOption = parseCourseSubmission({
  participantName: "Ben",
  question1: ["Not a real site"],
});
assert.equal(unknownOption.ok, false);

const longComment = parseCourseSubmission({
  participantName: "Ben",
  question5: "x".repeat(1001),
});
assert.equal(longComment.ok, false);

assert.equal(classifyCourseInsertError({ code: "23505" }), "duplicate");
assert.equal(
  classifyCourseInsertError({ message: "duplicate key value violates unique constraint" }),
  "duplicate",
);
assert.equal(classifyCourseInsertError({ code: "PGRST205", message: "schema cache" }), "unavailable");
assert.equal(
  COURSE_DUPLICATE_MESSAGE,
  "This name has already been used to submit a questionnaire. Please contact the course organizer if you need assistance.",
);

const summary = summarizeCourseResponses([
  {
    question1: ["Urban development", "Other"],
    question2: ["Drones / UAVs"],
    question3: null,
    question4: [COURSE_QUESTION_1_OPTIONS[0] ? "Something else." : "Something else."],
    question5: "Coastal work.",
  },
  {
    question1: ["Urban development"],
    question2: null,
    question3: null,
    question4: null,
    question5: null,
  },
  {
    question1: null,
    question2: null,
    question3: null,
    question4: null,
    question5: "   ",
  },
]);

assert.equal(summary.total, 3);
const sites = summary.questions.find((question) => question.id === "question1");
assert.ok(sites);
assert.equal(sites.answered, 2);
assert.equal(sites.unanswered, 1);
const urban = sites.options.find((option) => option.label === "Urban development");
const other = sites.options.find((option) => option.label === "Other");
const rural = sites.options.find((option) => option.label === "Rural land and property");
assert.equal(urban?.count, 2);
assert.equal(urban?.percent, 100);
assert.equal(other?.count, 1);
assert.equal(other?.percent, 50);
assert.equal(rural?.count, 0);
assert.equal(rural?.percent, 0);

const equipment = summary.questions.find((question) => question.id === "question2");
assert.equal(equipment?.answered, 1);
assert.equal(equipment?.unanswered, 2);
assert.equal(
  equipment?.options.find((option) => option.label === "Drones / UAVs")?.percent,
  100,
);

const software = summary.questions.find((question) => question.id === "question3");
assert.equal(software?.answered, 0);
assert.equal(software?.unanswered, 3);
assert.ok(software?.options.every((option) => option.count === 0 && option.percent === 0));

assert.equal(summary.commentsProvided, 1);
assert.equal(summary.commentsUnanswered, 2);

assert.equal(
  formatCourseSubmittedAt("2026-11-05T08:30:00.000Z", "Asia/Kuala_Lumpur"),
  "5 Nov 2026, 16:30 GMT+8",
);

assert.equal(isMalaysianLandSurveyCoursePath("/course"), true);
assert.equal(isMalaysianLandSurveyCoursePath("/course/"), true);
assert.equal(isMalaysianLandSurveyCoursePath("/courses"), false);
assert.equal(isMalaysianLandSurveyCoursePath("/course-builder"), false);

const migration = "supabase/migrations/222_malaysian_land_survey_course_responses.sql";
assert.ok(UNIT311_PENDING_MIGRATIONS.includes(migration));
assert.equal(migrationsMissingSatisfactionProbes(UNIT311_PENDING_MIGRATIONS).includes(migration), false);
const sql = readFileSync(migration, "utf8");
assert.match(sql, /normalized_name text not null/);
assert.match(sql, /malaysian_land_survey_course_responses_normalized_name_key unique/);
assert.match(sql, /enable row level security/);
assert.match(sql, /force row level security/);
assert.match(sql, /using \(false\)/);
assert.match(sql, /with check \(false\)/);
assert.match(sql, /revoke all on table public\.malaysian_land_survey_course_responses from anon/);
assert.match(sql, /revoke all on table public\.malaysian_land_survey_course_responses from authenticated/);
assert.match(sql, /course questionnaire submissions cannot be changed/);
assert.match(sql, /malaysian_land_survey_course_responses_prepare/);
assert.match(sql, /malaysian_land_survey_course_responses_block_update/);
assert.match(sql, /grant select, insert on table public\.malaysian_land_survey_course_responses to service_role/);
assert.match(sql, /notify pgrst, 'reload schema'/);
assert.doesNotMatch(sql, /create policy[^;]+to anon/i);

assert.deepEqual(applyWolfWorkspaceAllowedViews(["home"], WOLF_CENTRAL_SLUG, [], []), [
  "home",
  ...WOLF_COURSE_RESPONSE_VIEWS,
]);
assert.equal(applyWolfWorkspaceAllowedViews(null, WOLF_CENTRAL_SLUG, [], []), null);
assert.equal(applyWolfWorkspaceAllowedViews(["home"], "unit311", [], [])?.[0], "home");
assert.equal(
  isViewAllowedForWorkspaceGrants("wolf-course-overview", ["home"], {
    workspaceSlug: WOLF_CENTRAL_SLUG,
  }),
  true,
);
assert.equal(
  isViewAllowedForWorkspaceGrants("wolf-course-details", ["home"], {
    workspaceSlug: "unit311",
  }),
  false,
);

const middleware = readFileSync("src/middleware.ts", "utf8");
assert.match(middleware, /isMalaysianLandSurveyCoursePath\(pathname\)/);
assert.match(middleware, /WOLF_CENTRAL_ORIGIN\}\/course/);
const publicForm = readFileSync("src/components/course/MalaysianLandSurveyForm.tsx", "utf8");
assert.doesNotMatch(publicForm, /SERVICE_ROLE|createSupabaseServiceRoleClient/);
const publicRoute = readFileSync("src/app/api/course/malaysian-land-survey/route.ts", "utf8");
assert.doesNotMatch(publicRoute, /export async function GET/);

console.log("malaysian-land-survey.check.ts — all assertions passed.");
