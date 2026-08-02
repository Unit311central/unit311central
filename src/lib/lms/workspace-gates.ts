import { isAbhiSlug } from "@/lib/abhi-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

/** Workspaces that may create/publish LMS courses and use AI course generation. */
export function allowsLmsAiCourseGeneration(slug: string | null | undefined): boolean {
  return isAbhiSlug(slug) || isTalantonImpactSlug(slug);
}
