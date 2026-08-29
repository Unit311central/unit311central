/**
 * GreenDesert customer workspace surface.
 */

export const GREENDESERT_SLUG = "greendesert";

export function isGreenDesertSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === GREENDESERT_SLUG;
}
