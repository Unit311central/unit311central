/**
 * LMS course code generation (workspace-unique codes, readable ABHI-style prefix).
 */

/** Default auto code from final slug — same formula as legacy createCourseTree. */
export function buildAutoCourseCodeFromSlug(slug: string): string {
  return `ABHI-${slug.replace(/[^a-z0-9]+/g, "-").toUpperCase().slice(0, 24)}`;
}

/** Initial code before workspace uniqueness loop. */
export function buildInitialCourseCode(slug: string, explicitCode?: string): string {
  const trimmed = explicitCode?.trim();
  if (trimmed) return trimmed;
  return buildAutoCourseCodeFromSlug(slug);
}

/**
 * Next code candidate after a collision on `baseCode`.
 * Matches slug suffix pattern: -2, -3, … (conflictPass 1 → -2).
 */
export function courseCodeAfterCollision(baseCode: string, conflictPass: number): string {
  if (conflictPass <= 0) return baseCode;
  const suffix = `-${conflictPass + 1}`;
  const maxBaseLen = Math.max(8, 64 - suffix.length);
  const trimmedBase = baseCode.slice(0, maxBaseLen).replace(/-+$/g, "");
  return `${trimmedBase}${suffix}`;
}
