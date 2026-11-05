/** WOLF Central Tools views for the Malaysian land surveying course questionnaire. */
export const WOLF_COURSE_RESPONSE_VIEWS = [
  "wolf-course-overview",
  "wolf-course-details",
] as const;

export type WolfCourseResponseView = (typeof WOLF_COURSE_RESPONSE_VIEWS)[number];

export function isWolfCourseResponseView(view: string): view is WolfCourseResponseView {
  return (WOLF_COURSE_RESPONSE_VIEWS as readonly string[]).includes(view);
}
