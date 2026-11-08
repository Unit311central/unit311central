/** Public plantation challenge path. Exact match so nearby routes stay untouched. */
export function isPlantationChallengePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/plantation";
}
