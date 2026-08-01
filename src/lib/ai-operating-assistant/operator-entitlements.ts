import { isViewAllowedForGrants, type InternalRoleView } from "@/lib/internal-role-views";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import {
  primaryUserRole,
  type ManagedUser,
  type UserDepartment,
  type UserRole,
} from "@/lib/user-management-data";

const FINANCIAL_VIEWS = new Set<InternalOperationsView>([
  "financials",
  "general-ledger",
  "accounts-receivable",
  "accounts-payable",
  "expenses",
  "wise",
  "financial-reports",
  "debtors",
  "creditors",
  "opex",
  "board-pack",
]);

const HR_VIEWS = new Set<InternalOperationsView>([
  "hr",
  "hr-dashboard",
  "hr-org-chart",
  "hr-recruitment",
  "hr-leave",
  "hr-payroll",
  "hr-performance",
  "hr-reports",
]);

const USER_VIEWS = new Set<InternalOperationsView>([
  "users",
  "users-external",
  "external-client-access",
]);

const STRATEGY_VIEWS = new Set<InternalOperationsView>(["strategy", "competitors", "whiteboard"]);

export type EaOperatorEntitlements = {
  roleView: InternalRoleView;
  roles: UserRole[];
  departments: UserDepartment[];
  allowedViews: InternalOperationsView[] | null;
  canAccessFinancials: boolean;
  canAccessUsers: boolean;
  canAccessStrategy: boolean;
  canAccessHr: boolean;
};

export function mapUserRoleToInternalRoleView(role: UserRole): InternalRoleView {
  switch (role) {
    case "Admin":
      return "admin";
    case "Board":
    case "Exec":
      return "c-suite";
    case "Manager":
      return "manager";
    case "Associate":
    default:
      return "staff";
  }
}

function canAccessAnyView(
  allowedViews: InternalOperationsView[] | null,
  candidates: Set<InternalOperationsView>,
): boolean {
  if (allowedViews == null) return true;
  return [...candidates].some((view) => isViewAllowedForGrants(view, allowedViews));
}

export function entitlementsFromOperator(
  operator: Pick<ManagedUser, "role" | "roles" | "department" | "departments" | "allowedViews"> | null,
  fallbackRoleView: InternalRoleView = "c-suite",
): EaOperatorEntitlements {
  if (!operator) {
    return {
      roleView: fallbackRoleView,
      roles: [],
      departments: [],
      allowedViews: null,
      canAccessFinancials: fallbackRoleView !== "staff",
      canAccessUsers: fallbackRoleView === "admin" || fallbackRoleView === "c-suite",
      canAccessStrategy: fallbackRoleView !== "staff",
      canAccessHr: fallbackRoleView !== "staff",
    };
  }

  const roles = operator.roles?.length ? operator.roles : [operator.role];
  const departments = operator.departments?.length
    ? operator.departments
    : [operator.department];
  const roleView = mapUserRoleToInternalRoleView(primaryUserRole(roles));
  const allowedViews = operator.allowedViews;

  return {
    roleView,
    roles,
    departments,
    allowedViews,
    canAccessFinancials: canAccessAnyView(allowedViews, FINANCIAL_VIEWS),
    canAccessUsers: canAccessAnyView(allowedViews, USER_VIEWS),
    canAccessStrategy: canAccessAnyView(allowedViews, STRATEGY_VIEWS),
    canAccessHr: canAccessAnyView(allowedViews, HR_VIEWS),
  };
}

export function clampActiveViewToGrants(
  activeView: string,
  allowedViews: InternalOperationsView[] | null,
): string {
  // Always allow the shell surfaces the assistant itself runs on.
  if (activeView === "home" || activeView === "executive-assistant") {
    return activeView;
  }
  if (!isViewAllowedForGrants(activeView as InternalOperationsView, allowedViews)) {
    return "home";
  }
  return activeView;
}
