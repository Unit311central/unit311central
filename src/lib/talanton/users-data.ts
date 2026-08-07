import {
  defaultAllowedViewsForRoles,
  defaultHomeTilesForRoles,
} from "@/lib/access-presets";
import {
  primaryUserRole,
  type ManagedUser,
  type UserDepartment,
  type UserRole,
} from "@/lib/user-management-data";
import { TALANTON_TEAM_MEMBERS } from "@/lib/talanton/portfolio-data";

function cityForCountry(country: string): string {
  return country === "Kenya" ? "Nairobi" : "Newtown Square, PA";
}

function mapDepartment(department: string): UserDepartment {
  const normalized = department.toLowerCase();
  if (normalized.includes("finance") || normalized.includes("fund")) return "Finance";
  if (normalized.includes("board")) return "Board";
  if (normalized.includes("marketing")) return "Operations";
  if (normalized.includes("invest")) return "Corporate";
  if (normalized.includes("hr") || normalized.includes("people")) return "HR";
  if (normalized.includes("tech")) return "Technology";
  return "Corporate";
}

function mapRole(title: string, isOwner: boolean): UserRole {
  if (isOwner) return "Exec";
  const normalized = title.toLowerCase();
  if (normalized.includes("board")) return "Board";
  if (normalized.includes("partner") || normalized.includes("vp") || normalized.includes("cfo")) {
    return "Exec";
  }
  if (normalized.includes("manager") || normalized.includes("senior")) return "Manager";
  return "Associate";
}

function slugEmail(fullName: string): string {
  const base = fullName
    .replace(/,\s*(CFA|MBA|PhD|MD)\.?/gi, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, ".");
  return `${base}@talantonimpact.com`;
}

/** Talanton Tools → Users list from OUR TEAM roster (city + country). */
export function listTalantonTenantUsers(): ManagedUser[] {
  return TALANTON_TEAM_MEMBERS.map((member, index) => {
    const role = mapRole(member.role, member.isOwner);
    const roles: UserRole[] = [role];
    const department = mapDepartment(member.department);
    const departments: UserDepartment[] = [department];
    const fullName = member.fullName;
    const email = slugEmail(fullName);

    return {
      id: `ti-user-${String(index + 1).padStart(2, "0")}`,
      operatorLabel: fullName.split(/\s+/)[0] ?? "User",
      fullName,
      username: email,
      email,
      phone: "",
      role: primaryUserRole(roles),
      roles,
      department,
      departments,
      status: member.employmentStatus === "active" ? "Active" : "Inactive",
      region: "Multi-site",
      city: cityForCountry(member.country),
      country: member.country,
      licenseId: "",
      notes: member.role,
      allowedViews: defaultAllowedViewsForRoles(roles, departments),
      dashboardPrefs: { homeTiles: defaultHomeTilesForRoles(roles, departments) },
    } satisfies ManagedUser;
  });
}
