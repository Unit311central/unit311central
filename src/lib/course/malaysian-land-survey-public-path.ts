/** Public questionnaire path. Exact match so /course-builder and /courses stay untouched. */
export function isMalaysianLandSurveyCoursePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/course";
}
