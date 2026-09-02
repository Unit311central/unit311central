import type { ContentStudioFunctionId } from "@/lib/central-capabilities/types";

/** Content Studio categories hidden on WOLF Central only. */
export const WOLF_CONTENT_STUDIO_EXCLUDED_FUNCTIONS: readonly ContentStudioFunctionId[] = [
  "fundraising",
  "finance",
];

export function filterWolfContentStudioFunctions(
  functionIds: readonly ContentStudioFunctionId[],
): ContentStudioFunctionId[] {
  const excluded = new Set(WOLF_CONTENT_STUDIO_EXCLUDED_FUNCTIONS);
  return functionIds.filter((id) => !excluded.has(id));
}
