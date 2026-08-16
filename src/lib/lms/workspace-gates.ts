import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

/** Workspaces that may create/publish LMS courses and use AI course generation. */
export function allowsLmsAiCourseGeneration(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "").trim().toLowerCase();
  return (
    isAbhiSlug(slug) ||
    isTalantonImpactSlug(slug) ||
    isOnwardAirSlug(slug) ||
    isDemoWorkspaceSlug(slug) ||
    normalized === "internal" ||
    normalized === "unit311"
  );
}
