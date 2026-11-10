/**
 * Public Malaysian Land Surveying Courses folder.
 *
 * Run: npx tsx src/lib/course/__tests__/malaysian-land-survey-courses-share.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  choosePublicCourseFolder,
  isMalaysianLandSurveyCoursesSharePath,
  MALAYSIAN_LAND_SURVEY_COURSES_FOLDER_NAME,
  MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH,
  publicCourseFileDownloadPath,
} from "@/lib/course/malaysian-land-survey-courses-share-path";

const fileId = "11111111-2222-4333-8444-555555555555";

assert.equal(
  isMalaysianLandSurveyCoursesSharePath(MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH),
  true,
);
assert.equal(
  isMalaysianLandSurveyCoursesSharePath(`${MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH}/`),
  true,
);
assert.equal(
  isMalaysianLandSurveyCoursesSharePath(publicCourseFileDownloadPath(fileId)),
  true,
);
assert.equal(isMalaysianLandSurveyCoursesSharePath("/share"), false);
assert.equal(isMalaysianLandSurveyCoursesSharePath("/share/other-folder"), false);
assert.equal(
  isMalaysianLandSurveyCoursesSharePath(`${MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH}/files/not-a-uuid`),
  false,
);
assert.equal(isMalaysianLandSurveyCoursesSharePath("/course"), false);

assert.equal(
  choosePublicCourseFolder([
    { id: "empty", updatedAt: "2026-11-10T18:00:00.000Z", fileCount: 0, hasCourseTwo: false },
    { id: "course-two", updatedAt: "2026-11-10T16:00:00.000Z", fileCount: 3, hasCourseTwo: true },
    { id: "fuller", updatedAt: "2026-11-10T17:00:00.000Z", fileCount: 8, hasCourseTwo: false },
  ]),
  "course-two",
);
assert.equal(choosePublicCourseFolder([]), null);

const middleware = readFileSync("src/middleware.ts", "utf8");
assert.match(middleware, /isMalaysianLandSurveyCoursesSharePath\(pathname\)/);
assert.match(middleware, /malaysian-land-survey-courses-share-path/);
assert.doesNotMatch(middleware, /malaysian-land-survey-courses-share"/);
assert.match(middleware, /WOLF_CENTRAL_ORIGIN\}\$\{pathname\}\$\{search\}/);

const page = readFileSync("src/app/share/malaysian-land-surveying-courses/page.tsx", "utf8");
assert.match(page, /No sign-in is required/);
assert.doesNotMatch(page, /requireInternalFilesAccess/);
assert.match(page, new RegExp(MALAYSIAN_LAND_SURVEY_COURSES_FOLDER_NAME));

const route = readFileSync(
  "src/app/share/malaysian-land-surveying-courses/files/[id]/route.ts",
  "utf8",
);
assert.match(route, /createMalaysianLandSurveyCourseDownload/);
assert.doesNotMatch(route, /requireInternalFilesAccess/);

const share = readFileSync("src/lib/course/malaysian-land-survey-courses-share.ts", "utf8");
assert.match(share, /eq\("workspace_id", workspace\.id\)/);
assert.match(share, /eq\("name", MALAYSIAN_LAND_SURVEY_COURSES_FOLDER_NAME\)/);
assert.doesNotMatch(page, /storage_path/);

console.log("malaysian-land-survey-courses-share.check.ts — all assertions passed.");
