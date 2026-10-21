import type { InternalOperationsView } from "@/lib/internal-operations-data";

/** Talanton Training sidebar surfaces (not in core Training catalogue taxonomy). */
export const TALANTON_TRAINING_NAV_VIEWS = [
  "training-dashboard",
  "portfolio-courses",
  "portfolio-course-management",
  "learning-library",
  "training-certifications",
  "company-progress",
] as const satisfies readonly InternalOperationsView[];

export function isTalantonTrainingNavView(
  view: InternalOperationsView,
): view is (typeof TALANTON_TRAINING_NAV_VIEWS)[number] {
  return (TALANTON_TRAINING_NAV_VIEWS as readonly string[]).includes(view);
}
