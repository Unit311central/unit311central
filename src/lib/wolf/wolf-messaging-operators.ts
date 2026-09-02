import { normalizePlatformUsername } from "@/lib/platform-auth";
import type { ManagedUser } from "@/lib/user-management-data";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";

/** Exact admin account allowed in WOLF Messaging join / participant pickers. */
export const WOLF_MESSAGING_ALLOWED_ADMIN_EMAIL = "admin@wolf.unit311central.com";

/** Email/username prefixes allowed in WOLF Messaging (any domain). */
export const WOLF_MESSAGING_ALLOWED_EMAIL_PREFIXES = [
  "alex@",
  "jordi@",
  "bcn@",
  "bcnengineer@",
] as const;

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
  for (const address of addresses) {
    if (address === WOLF_MESSAGING_ALLOWED_ADMIN_EMAIL) return true;
    for (const prefix of WOLF_MESSAGING_ALLOWED_EMAIL_PREFIXES) {
      if (address.startsWith(prefix)) return true;
    }
  }
  return false;
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
