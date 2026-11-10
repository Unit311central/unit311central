export const MALAYSIAN_LAND_SURVEY_COURSES_FOLDER_NAME = "Malaysian Land Surveying Courses";

export const MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH =
  "/share/malaysian-land-surveying-courses";

export type PublicCourseFolderCandidate = {
  id: string;
  updatedAt: string;
  fileCount: number;
  hasCourseTwo: boolean;
};

/** Public page plus the per-file download route. Nothing else under /share. */
export function isMalaysianLandSurveyCoursesSharePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH) return true;
  return /^\/share\/malaysian-land-surveying-courses\/files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    normalized,
  );
}

export function publicCourseFileDownloadPath(fileId: string): string {
  return `${MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH}/files/${fileId}`;
}

/** Prefer the folder that holds Course 2, then the fullest, then the newest. */
export function choosePublicCourseFolder(
  candidates: PublicCourseFolderCandidate[],
): string | null {
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort((left, right) => {
    if (left.hasCourseTwo !== right.hasCourseTwo) return left.hasCourseTwo ? -1 : 1;
    if (left.fileCount !== right.fileCount) return right.fileCount - left.fileCount;
    return right.updatedAt.localeCompare(left.updatedAt);
  });
  return ranked[0]?.id ?? null;
}
