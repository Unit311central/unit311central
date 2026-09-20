/**
 * Business Central → Client Management → Client Directory is a distinct surface from
 * ABHI Member Directory (same `view=clients` route, different nav label and UX).
 */
export type ClientDirectorySurfaceVariant = "client-directory" | "legacy";

export function isBusinessCentralClientDirectorySurface(
  variant: ClientDirectorySurfaceVariant,
): boolean {
  return variant === "client-directory";
}
