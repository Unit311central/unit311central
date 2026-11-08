import { isInternalDomainHost } from "@/lib/app-domains";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

/**
 * Person an expense can be assigned to.
 * On the Unit311 internal workspace this is an internal user (Tools → Users).
 * On customer workspaces this is an HR employee of that workspace.
 */
export type ExpenseAssignee = {
  id: string;
  fullName: string;
  email: string;
  username?: string;
};

export type ExpenseAssigneeSession = {
  userId?: string | null;
  displayName?: string | null;
  email?: string | null;
  username?: string | null;
};

type InternalUserLike = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  username?: string | null;
  status?: string | null;
  operatorLabel?: string | null;
};

type HrEmployeeLike = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  employmentStatus?: string | null;
};

function normalized(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function byFullName(left: ExpenseAssignee, right: ExpenseAssignee) {
  return left.fullName.localeCompare(right.fullName, undefined, { sensitivity: "base" });
}

/**
 * Unit311 internal expenses are assigned to Unit311 people (internal users).
 * Customer hosts keep that workspace's HR directory — OnwardAir staff belong
 * on OnwardAir, not on internal.unit311central.com.
 */
export function expenseAssigneesUseInternalUsers(input: {
  host?: string | null;
  workspaceSlug?: string | null;
}): boolean {
  if (isInternalDomainHost(input.host)) return true;
  const slug = normalized(input.workspaceSlug);
  return slug === INTERNAL_WORKSPACE_SLUG || slug === "internal";
}

export function expenseAssigneesFromInternalUsers(
  users: readonly InternalUserLike[],
): ExpenseAssignee[] {
  return users
    .filter((user) => {
      const status = normalized(user.status || "active");
      return status === "active";
    })
    .map((user) => {
      const fullName =
        String(user.fullName ?? "").trim() ||
        String(user.operatorLabel ?? "").trim() ||
        String(user.username ?? "").trim() ||
        "Unnamed user";
      return {
        id: String(user.id),
        fullName,
        email: String(user.email ?? user.username ?? "").trim(),
        username: String(user.username ?? "").trim(),
      };
    })
    .filter((user) => user.id.length > 0)
    .sort(byFullName);
}

export function expenseAssigneesFromHrEmployees(
  employees: readonly HrEmployeeLike[],
): ExpenseAssignee[] {
  return employees
    .filter((employee) => employee.employmentStatus !== "archived")
    .map((employee) => ({
      id: String(employee.id),
      fullName: String(employee.fullName ?? "").trim() || "Unnamed employee",
      email: String(employee.email ?? "").trim(),
    }))
    .filter((employee) => employee.id.length > 0)
    .sort(byFullName);
}

/** Internal users win when an id appears in both lists (legacy HR lookup is the fallback). */
export function mergeExpenseAssignees(
  primary: readonly ExpenseAssignee[],
  fallback: readonly ExpenseAssignee[],
): ExpenseAssignee[] {
  const byId = new Map<string, ExpenseAssignee>();
  for (const assignee of primary) byId.set(assignee.id, assignee);
  for (const assignee of fallback) {
    if (!byId.has(assignee.id)) byId.set(assignee.id, assignee);
  }
  return [...byId.values()].sort(byFullName);
}

/**
 * Pick the signed-in person. Never fall back to the first row — that was
 * selecting the alphabetical HR name (Alec Gibson) for a Unit311 user (Jordi).
 */
export function resolveDefaultExpenseAssigneeId(
  assignees: readonly ExpenseAssignee[],
  session: ExpenseAssigneeSession,
): string {
  const userId = normalized(session.userId);
  const email = normalized(session.email);
  const username = normalized(session.username);
  const name = normalized(session.displayName);

  const match = assignees.find((assignee) => {
    const assigneeEmail = normalized(assignee.email);
    const assigneeUsername = normalized(assignee.username);
    const assigneeName = normalized(assignee.fullName);
    if (userId && normalized(assignee.id) === userId) return true;
    if (email && (assigneeEmail === email || assigneeUsername === email)) return true;
    if (username && (assigneeUsername === username || assigneeEmail === username)) return true;
    if (!name) return false;
    if (assigneeName === name) return true;
    const firstName = assigneeName.split(/\s+/)[0] ?? "";
    return firstName === name;
  });

  return match?.id ?? "";
}
