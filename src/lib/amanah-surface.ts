/**
 * Amanah Surgical customer workspace surface.
 * Slug derived from workspace display name (Amanah Surgical → amanahsurgical).
 */

export const AMANAH_SLUG = "amanahsurgical";

export function isAmanahSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "").trim().toLowerCase();
  return normalized === AMANAH_SLUG || normalized.includes("amanah");
}
