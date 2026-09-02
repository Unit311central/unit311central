import { normalizePlatformUsername } from "@/lib/platform-auth";
import type { ManagedUser } from "@/lib/user-management-data";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";

/** WOLF Central operators allowed in Messaging and Whiteboard collaborator pickers. */
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

/** @deprecated Use WOLF_CENTRAL_OPERATOR_ALLOWLIST */
export const WOLF_MESSAGING_ALLOWED_ADMIN_EMAIL = WOLF_CENTRAL_OPERATOR_ALLOWLIST[0];

export function wolfMessagingOperatorAddresses(
  user: Pick<ManagedUser, "username" | "email">,
): string[] {
  return [user.username, user.email]
    .map((value) => normalizePlatformUsername(value).toLowerCase())
    .filter(Boolean);
}

export function isWolfMessagingAllowedOperator(
  user: Pick<ManagedUser, "username" | "email">,
): boolean {
  const addresses = wolfMessagingOperatorAddresses(user);
  return addresses.some((address) => WOLF_CENTRAL_OPERATOR_ALLOWLIST_SET.has(address));
}

export function filterWolfMessagingOperators(users: readonly ManagedUser[]): ManagedUser[] {
  return users.filter(isWolfMessagingAllowedOperator);
}

export function filterWolfMessagingOperatorIds(
  users: readonly ManagedUser[],
  operatorIds: readonly string[],
): string[] {
  const allowedIds = new Set(filterWolfMessagingOperators(users).map((user) => user.id));
  return operatorIds.filter((id) => allowedIds.has(id));
}

export function applyWolfMessagingOperatorPolicy(
  workspaceSlug: string | null | undefined,
  users: readonly ManagedUser[],
): ManagedUser[] {
  if (!isWolfCentralSlug(workspaceSlug)) return [...users];
  return filterWolfMessagingOperators(users);
}

export function applyWolfMessagingOperatorIdPolicy(
  workspaceSlug: string | null | undefined,
  users: readonly ManagedUser[],
  operatorIds: readonly string[],
): string[] {
  if (!isWolfCentralSlug(workspaceSlug)) return [...operatorIds];
  return filterWolfMessagingOperatorIds(users, operatorIds);
}

export function assertWolfMessagingOperatorIdAllowed(
  workspaceSlug: string | null | undefined,
  users: readonly ManagedUser[],
  operatorId: string,
): void {
  if (!isWolfCentralSlug(workspaceSlug)) return;
  const allowed = filterWolfMessagingOperatorIds(users, [operatorId]);
  if (allowed.length === 0) {
    throw new Error("That operator is not available for Messaging in WOLF Central.");
  }
}
