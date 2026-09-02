import type { InternalRoleView } from "@/lib/internal-role-views";
import type { UserDepartment, UserRole } from "@/lib/user-management-data";

import { isWolfCentralSlug, isBrowserWolfCentralSurface } from "@/lib/wolf/wolf-surface";
import { filterWolfContentStudioFunctions } from "@/lib/wolf/wolf-content-studio";
import type {
  CentralCapabilityAccessContext,
  ContentStudioFunctionId,
  ManagementFunctionPackPlaceholder,
} from "./types";
import { MANAGEMENT_FUNCTION_PACKS } from "./management-placeholder";
import { CONTENT_STUDIO_FUNCTIONS } from "./content-studio-placeholder";

function isExecutive(access: CentralCapabilityAccessContext): boolean {
  return (
    access.roleView === "c-suite" ||
    access.roles.includes("Exec") ||
    access.roles.includes("Board")
  );
}

function isPlatformAdmin(access: CentralCapabilityAccessContext): boolean {
  return access.roleView === "admin" || hasRole(access, "Admin");
}

function hasDepartment(access: CentralCapabilityAccessContext, ...names: string[]): boolean {
  const normalized = new Set(
    access.departments.map((department) => department.toLowerCase()),
  );
  return names.some((name) => normalized.has(name.toLowerCase()));
}

function hasRole(access: CentralCapabilityAccessContext, ...roles: UserRole[]): boolean {
  const set = new Set(access.roles);
  return roles.some((role) => set.has(role));
}

const CONTENT_STUDIO_ACCESS: Record<
  ContentStudioFunctionId,
  (access: CentralCapabilityAccessContext) => boolean
> = {
  corporate: (access) => isExecutive(access) || hasDepartment(access, "Operations", "Marketing"),
  management: (access) =>
    isExecutive(access) ||
    hasDepartment(access, "Finance", "Operations", "Technology", "Sales", "Engineering"),
  fundraising: (access) =>
    isExecutive(access) || hasDepartment(access, "Finance", "Sales", "Operations"),
  sales: (access) => isExecutive(access) || hasDepartment(access, "Sales", "Marketing"),
  marketing: (access) => isExecutive(access) || hasDepartment(access, "Marketing", "Sales"),
  projects: (access) =>
    isExecutive(access) ||
    hasDepartment(access, "Engineering", "Operations", "Project Management"),
  operations: (access) =>
    isExecutive(access) || hasDepartment(access, "Operations", "Engineering"),
  finance: (access) => isExecutive(access) || hasDepartment(access, "Finance"),
  hr: (access) =>
    isExecutive(access) || hasDepartment(access, "Human Resources", "HR"),
  engineering: (access) =>
    isExecutive(access) || hasDepartment(access, "Engineering", "Technology"),
  qms: (access) =>
    isExecutive(access) || hasDepartment(access, "Quality", "Operations", "Engineering"),
  regulatory: (access) =>
    isExecutive(access) || hasDepartment(access, "Regulatory", "Compliance", "Legal"),
  administration: (access) =>
    isExecutive(access) || hasRole(access, "Admin") || hasDepartment(access, "Operations"),
};

const PACK_ROLE_MATCH: Record<string, (access: CentralCapabilityAccessContext) => boolean> = {
  CEO: (access) => isExecutive(access),
  CFO: (access) => isExecutive(access) || hasDepartment(access, "Finance"),
  COO: (access) => isExecutive(access) || hasDepartment(access, "Operations"),
  CTO: (access) =>
    isExecutive(access) || hasDepartment(access, "Technology", "Engineering"),
  CRO: (access) => isExecutive(access) || hasDepartment(access, "Sales"),
  HR: (access) => isExecutive(access) || hasDepartment(access, "Human Resources", "HR"),
};

export function canAccessManagementWorkspace(access: CentralCapabilityAccessContext): boolean {
  if (isExecutive(access) || isPlatformAdmin(access)) return true;
  return hasDepartment(
    access,
    "Finance",
    "Operations",
    "Sales",
    "Human Resources",
    "HR",
    "Technology",
  );
}

export function getVisibleManagementFunctionPacks(
  access: CentralCapabilityAccessContext,
): ManagementFunctionPackPlaceholder[] {
  return filterVisibleManagementFunctionPacks(access, MANAGEMENT_FUNCTION_PACKS);
}

export function filterVisibleManagementFunctionPacks(
  access: CentralCapabilityAccessContext,
  packs: readonly ManagementFunctionPackPlaceholder[],
): ManagementFunctionPackPlaceholder[] {
  if (isExecutive(access) || isPlatformAdmin(access)) return [...packs];
  return packs.filter((pack) => {
    const matcher = PACK_ROLE_MATCH[pack.ownerRole];
    return matcher ? matcher(access) : false;
  });
}

export function getVisibleContentStudioFunctions(
  access: CentralCapabilityAccessContext,
  options?: { workspaceSlug?: string | null },
): ContentStudioFunctionId[] {
  let ids: ContentStudioFunctionId[];
  if (isExecutive(access) || isPlatformAdmin(access)) {
    ids = CONTENT_STUDIO_FUNCTIONS.map((node) => node.id);
  } else {
    ids = CONTENT_STUDIO_FUNCTIONS.filter((node) =>
      CONTENT_STUDIO_ACCESS[node.id](access),
    ).map((node) => node.id);
  }
  if (isWolfCentralSlug(options?.workspaceSlug) || isBrowserWolfCentralSurface()) {
    return filterWolfContentStudioFunctions(ids);
  }
  return ids;
}

export function canEditContentStudioTemplates(access: CentralCapabilityAccessContext): boolean {
  return isExecutive(access) || hasRole(access, "Admin", "Manager");
}

export function managementAccessFromEntitlements(input: {
  roleView: InternalRoleView | null;
  roles: string[];
  departments: string[];
}): CentralCapabilityAccessContext {
  return {
    roleView: input.roleView,
    roles: input.roles as UserRole[],
    departments: input.departments as UserDepartment[],
  };
}
