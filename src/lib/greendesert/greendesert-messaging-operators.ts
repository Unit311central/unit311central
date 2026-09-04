import { normalizePlatformUsername } from "@/lib/platform-auth";
import type { ManagedUser } from "@/lib/user-management-data";
import { GREENDESERT_HR_TEAM_EMPLOYEES } from "@/lib/greendesert/greendesert-hr-team-data";
import { isGreenDesertSlug } from "@/lib/greendesert-surface";

/** Green Desert operators allowed in Messaging and Whiteboard collaborator pickers. */
export const GREENDESERT_MESSAGING_OPERATOR_ALLOWLIST = [
  "admin@greendesert.unit311central.com",
  "board@greendesert.unit311central.com",
  "ashley.pursglove@greendesert.unit311central.com",
  "abdulmajeed@greendesert.unit311central.com",
  "yusuf@greendesert.unit311central.com",
  "omar@greendesert.unit311central.com",
  "jeddahtechnologies@greendesert.unit311central.com",
] as const;

const GREENDESERT_MESSAGING_OPERATOR_ALLOWLIST_SET = new Set<string>(
  GREENDESERT_MESSAGING_OPERATOR_ALLOWLIST.map((email) => email.toLowerCase()),
);

export function greendesertMessagingOperatorAddresses(
  user: Pick<ManagedUser, "username" | "email">,
): string[] {
  return [user.username, user.email]
    .map((value) => normalizePlatformUsername(value).toLowerCase())
    .filter(Boolean);
}

export function isGreenDesertMessagingAllowedOperator(
  user: Pick<ManagedUser, "username" | "email">,
): boolean {
  const addresses = greendesertMessagingOperatorAddresses(user);
  return addresses.some((address) => GREENDESERT_MESSAGING_OPERATOR_ALLOWLIST_SET.has(address));
}

export function filterGreenDesertMessagingOperators(users: readonly ManagedUser[]): ManagedUser[] {
  const filtered = users.filter(isGreenDesertMessagingAllowedOperator);
  if (filtered.length > 0) return filtered;
  return buildGreenDesertMessagingOperatorFallbacks();
}

export function buildGreenDesertMessagingOperatorFallbacks(): ManagedUser[] {
  const rows = [
    ...GREENDESERT_MESSAGING_OPERATOR_ALLOWLIST.map((email) => ({
      email,
      fullName: email.split("@")[0]?.replace(/\./g, " ") ?? email,
      role: "Admin" as const,
      department: "Corporate" as const,
    })),
    ...GREENDESERT_HR_TEAM_EMPLOYEES.map((employee) => ({
      email: employee.email,
      fullName: employee.fullName,
      role: "Exec" as const,
      department:
        employee.department === "Technology"
          ? ("Technology" as const)
          : employee.department === "Finance"
            ? ("Finance" as const)
            : employee.department === "Operations"
              ? ("Operations" as const)
              : ("Exec" as const),
    })),
  ];

  const seen = new Set<string>();
  return rows
    .filter((row) => {
      const key = row.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row, index) => ({
      id: `gd-msg-${index + 1}`,
      operatorLabel: row.fullName,
      fullName: row.fullName,
      username: row.email,
      email: row.email,
      phone: "",
      role: row.role,
      roles: [row.role],
      department: row.department,
      departments: [row.department],
      status: "Active" as const,
      region: "Middle East",
      licenseId: "",
      notes: "Green Desert workspace operator",
      allowedViews: null,
      dashboardPrefs: null,
    }));
}

export function applyGreenDesertMessagingOperatorPolicy(
  workspaceSlug: string | null | undefined,
  users: readonly ManagedUser[],
): ManagedUser[] {
  if (!isGreenDesertSlug(workspaceSlug)) return [...users];
  return filterGreenDesertMessagingOperators(users);
}
