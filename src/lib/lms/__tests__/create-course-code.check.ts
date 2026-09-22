/**
 * LMS createCourseTree course-code uniquification.
 * Run: npx tsx src/lib/lms/__tests__/create-course-code.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildAutoCourseCodeFromSlug,
  buildInitialCourseCode,
  courseCodeAfterCollision,
} from "@/lib/lms/course-code";

// CASE A: two normal different titles → different auto codes
const codeA = buildAutoCourseCodeFromSlug("anti-bribery");
const codeB = buildAutoCourseCodeFromSlug("whistleblowing");
assert.notEqual(codeA, codeB);
assert.equal(codeA, "ABHI-ANTI-BRIBERY");
assert.equal(codeB, "ABHI-WHISTLEBLOWING");

// CASE B: long slugs whose uppercased prefix matches within 24 chars → same initial code, distinct after collision
const slugLong1 = "information-security-fundamentals";
const slugLong2 = "information-security-fundamentals-advanced-edition";
const initial1 = buildAutoCourseCodeFromSlug(slugLong1);
const initial2 = buildAutoCourseCodeFromSlug(slugLong2);
assert.equal(initial1, "ABHI-INFORMATION-SECURITY-FUN");
assert.equal(initial2, initial1);
const secondCreate = courseCodeAfterCollision(initial1, 1);
assert.notEqual(initial1, secondCreate);
assert.equal(secondCreate, "ABHI-INFORMATION-SECURITY-FUN-2");

// CASE C: same title twice — slug suffix + code suffix (simulated allocation)
const baseSlug = "information-security-fundamentals";
const firstSlug = baseSlug;
const secondSlug = `${baseSlug}-2`;
const firstCode = buildInitialCourseCode(firstSlug);
const secondCodeBase = buildInitialCourseCode(secondSlug);
assert.equal(firstCode, secondCodeBase);
assert.equal(firstCode, "ABHI-INFORMATION-SECURITY-FUN");
const taken = new Set<string>();
function allocateCode(slug: string, explicit?: string): string {
  const base = buildInitialCourseCode(slug, explicit);
  let code = base;
  for (let i = 0; i < 8; i += 1) {
    if (!taken.has(code)) break;
    code = courseCodeAfterCollision(base, i + 1);
  }
  if (taken.has(code)) {
    throw new Error("duplicate key value violates unique constraint");
  }
  taken.add(code);
  return code;
}
assert.equal(allocateCode(firstSlug), "ABHI-INFORMATION-SECURITY-FUN");
assert.equal(allocateCode(secondSlug), "ABHI-INFORMATION-SECURITY-FUN-2");
assert.equal(allocateCode(`${baseSlug}-3`), "ABHI-INFORMATION-SECURITY-FUN-3");

// CASE D: existing course rows are not deleted/updated by create path (insert-only for prior codes)
const serviceSrc = readFileSync(join(process.cwd(), "src/lib/lms/service.ts"), "utf8");
const createBlock = serviceSrc.slice(
  serviceSrc.indexOf("export async function createCourseTree"),
  serviceSrc.indexOf("export async function publishCourse"),
);
assert.doesNotMatch(createBlock, /getCourseByCode[\s\S]*?\.delete\(/);
assert.doesNotMatch(createBlock, /getCourseBySlug[\s\S]*?\.update\(/);
assert.match(createBlock, /getCourseByCode\(workspaceId, code\)/);
assert.match(createBlock, /\.insert\(/);

// CASE E: slug uniquification pattern unchanged
assert.match(createBlock, /slug = `\$\{baseSlug\}-\$\{i \+ 2\}`/);

// Explicit input.code uses same suffix mechanism when colliding
assert.equal(
  courseCodeAfterCollision("CUSTOM-CODE", 1),
  "CUSTOM-CODE-2",
);

// Information Security Fundamentals example sequence
assert.equal(
  buildAutoCourseCodeFromSlug("information-security-fundamentals"),
  "ABHI-INFORMATION-SECURITY-FUN",
);
assert.equal(
  courseCodeAfterCollision("ABHI-INFORMATION-SECURITY-FUN", 1),
  "ABHI-INFORMATION-SECURITY-FUN-2",
);
assert.equal(
  courseCodeAfterCollision("ABHI-INFORMATION-SECURITY-FUN", 2),
  "ABHI-INFORMATION-SECURITY-FUN-3",
);

console.log("create-course-code.check.ts — all assertions passed");
