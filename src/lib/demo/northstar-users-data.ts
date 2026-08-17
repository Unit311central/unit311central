import { buildNorthstarLeaveRequests, getNorthstarHrEmployees } from "@/lib/demo/northstar-hr-data";
import {
  defaultAllowedViewsForRoles,
  defaultHomeTilesForRoles,
} from "@/lib/access-presets";
import {
  normalizeUserDepartments,
  normalizeUserRoles,
  primaryUserDepartment,
  primaryUserRole,
  type ManagedUser,
  type UserDepartment,
  type UserRegion,
  type UserRole,
} from "@/lib/user-management-data";

const TODAY = "2026-08-17";

function mapDepartment(department: string): UserDepartment {
  const value = department.toLowerCase();
  if (value.includes("human") || value === "hr") return "HR";
  if (value.includes("engineer")) return "Engineering";
  if (value.includes("financ")) return "Finance";
  if (value.includes("operation")) return "Operations";
  if (value.includes("sales") || value.includes("commercial")) return "Sales";
  if (value.includes("technolog")) return "Technology";
  if (value.includes("board")) return "Board";
  return "Corporate";
}

function mapRole(jobTitle: string, employeeId: string): UserRole {
  const title = jobTitle.toLowerCase();
  if (employeeId === "mag-dir-1" || title.includes("chief executive")) return "Admin";
  if (title.includes("chief") || title.includes("cfo") || title.includes("coo")) return "Exec";
  if (title.includes("director") && title.includes("board")) return "Board";
  if (title.includes("head of") || title.includes("vp ")) return "Exec";
  if (title.includes("manager") || title.includes("lead")) return "Manager";
  return "Associate";
}

function mapRegion(location: string): UserRegion {
  if (location === "Austin") return "Barcelona";
  if (location === "Bristol") return "Porto";
  return "Oxford";
}

function isOnLeaveToday(employeeId: string): boolean {
  const today = new Date(`${TODAY}T12:00:00`);
  return buildNorthstarLeaveRequests().some((request) => {
    if (request.employeeId !== employeeId || request.status !== "approved") return false;
    const start = new Date(`${request.startDate}T00:00:00`);
    const end = new Date(`${request.endDate}T23:59:59`);
    return today >= start && today <= end;
  });
}

/** All 25 Northstar employees as internal platform users. */
export function buildNorthstarDemoUsers(): ManagedUser[] {
  return getNorthstarHrEmployees().map((employee) => {
    const departments = normalizeUserDepartments([mapDepartment(employee.department)]);
    const department = primaryUserDepartment(departments);
    const roles = normalizeUserRoles([mapRole(employee.role, employee.id)]);
    const role = primaryUserRole(roles);

    return {
      id: `nst-user-${employee.id}`,
      operatorLabel: employee.preferredName || employee.fullName.split(" ")[0] || employee.fullName,
      fullName: employee.fullName,
      username: employee.email,
      email: employee.email,
      phone: employee.phone,
      role,
      roles,
      department,
      departments,
      status: isOnLeaveToday(employee.id) ? "On Leave" : "Active",
      region: mapRegion(employee.location),
      city: employee.location,
      country: employee.location === "Austin" ? "United States" : "United Kingdom",
      licenseId: employee.employeeNumber,
      notes: `${employee.role} · ${employee.location}`,
      allowedViews: defaultAllowedViewsForRoles(roles, departments),
      dashboardPrefs: { homeTiles: defaultHomeTilesForRoles(roles, departments) },
    };
  });
}
