/**
 * Edge-safe WOLF Central operator check.
 *
 * Middleware reaches this file through workspace-authorization.
 * Do not import Node built-ins or the password hasher from this file.
 */

export const WOLF_CENTRAL_OPERATOR_ALLOWLIST = [
  "admin@wolf.unit311central.com",
  "alex@wolf.unit311central.com",
  "jordi@wolf.unit311central.com",
  "bcn@wolf.unit311central.com",
  "bcnengineer@wolf.unit311central.com",
] as const;

const WOLF_CENTRAL_OPERATOR_ALLOWLIST_SET = new Set<string>(
  WOLF_CENTRAL_OPERATOR_ALLOWLIST.map((email) => email.toLowerCase()),
);

/** WOLF Central operators who may administer the workspace, including user creation. */
export function isWolfCentralOperatorUsername(username: string | null | undefined): boolean {
  const normalized = String(username ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  if (WOLF_CENTRAL_OPERATOR_ALLOWLIST_SET.has(normalized)) return true;
  const localPart = normalized.split("@")[0] ?? "";
  return localPart === "jordi" && (normalized === "jordi" || normalized.endsWith("@wolf.unit311central.com"));
}
