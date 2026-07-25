import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import {
  defaultAllowedViewsForRoles,
  defaultHomeTilesForRoles,
  normalizeAllowedViews,
  normalizeHomeTiles,
} from "@/lib/access-presets";
import type { InternalOperationsView } from "@/lib/internal-operations-data";

export type UserRole = "Board" | "Exec" | "Manager" | "Associate" | "Admin";

export type UserDepartment =
  | "Board"
  | "Exec"
  | "Manager"
  | "Engineering"
  | "Sales"
  | "Finance"
  | "Operations"
  | "HR"
  | "Corporate"
  | "Technology";

export type UserStatus = "Active" | "On Leave" | "Inactive";

export type UserRegion = "Barcelona" | "Porto" | "Oxford" | "Multi-site";

export type UserDashboardPrefs = {
  homeTiles: CommandCentreHomeTileId[];
};

export type ManagedUser = {
  id: string;
  operatorLabel: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  /** Highest-privilege role — kept in sync with `roles` for legacy checks. */
  role: UserRole;
  /** All assigned access roles (multi-select). */
  roles: UserRole[];
  department: UserDepartment;
  status: UserStatus;
  region: UserRegion;
  licenseId: string;
  notes: string;
  /** null = unrestricted (legacy). Explicit list = enforced grants. */
  allowedViews: InternalOperationsView[] | null;
  dashboardPrefs: UserDashboardPrefs | null;
};

export const USER_ROLE_OPTIONS: UserRole[] = [
  "Board",
  "Exec",
  "Manager",
  "Associate",
  "Admin",
];

const ROLE_RANK: Record<UserRole, number> = {
  Associate: 1,
  Manager: 2,
  Exec: 3,
  Board: 4,
  Admin: 5,
};

export function primaryUserRole(roles: readonly UserRole[]): UserRole {
  if (roles.length === 0) return "Associate";
  return roles.reduce((best, role) => (ROLE_RANK[role] > ROLE_RANK[best] ? role : best));
}

export function normalizeUserRoles(
  value: unknown,
  fallbackRole?: string | null,
): UserRole[] {
  if (Array.isArray(value)) {
    const roles = [
      ...new Set(
        value
          .map((entry) => normalizeUserRole(String(entry)))
          .filter((role): role is UserRole => USER_ROLE_OPTIONS.includes(role)),
      ),
    ];
    if (roles.length > 0) return roles;
  }
  return [normalizeUserRole(fallbackRole ?? "Associate")];
}

export function userHasRole(
  user: Pick<ManagedUser, "role" | "roles">,
  role: UserRole,
): boolean {
  const roles = user.roles?.length ? user.roles : [user.role];
  return roles.includes(role);
}

export function formatUserRoles(user: Pick<ManagedUser, "role" | "roles">): string {
  const roles = user.roles?.length ? user.roles : [user.role];
  return roles.join(" · ");
}

export const USER_DEPARTMENT_OPTIONS: UserDepartment[] = [
  "Board",
  "Exec",
  "Manager",
  "Engineering",
  "Sales",
  "Finance",
  "Operations",
  "HR",
  "Corporate",
  "Technology",
];

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  Staff: "Associate",
  "Senior Drone Operator": "Manager",
  "Drone Operator": "Associate",
  "Mission Coordinator": "Admin",
  "Survey Lead": "Manager",
  "C-Suite": "Exec",
  "c-suite": "Exec",
};

export function normalizeUserRole(role: string): UserRole {
  if (USER_ROLE_OPTIONS.includes(role as UserRole)) {
    return role as UserRole;
  }
  return LEGACY_ROLE_MAP[role] ?? "Associate";
}

export function normalizeUserDepartment(value: string | null | undefined): UserDepartment {
  if (value && USER_DEPARTMENT_OPTIONS.includes(value as UserDepartment)) {
    return value as UserDepartment;
  }
  return "Corporate";
}

export const USER_STATUS_OPTIONS: UserStatus[] = ["Active", "On Leave", "Inactive"];

export const USER_REGION_OPTIONS: UserRegion[] = ["Barcelona", "Porto", "Oxford", "Multi-site"];

/** Regional site owners — one operator per base location. */
export const REGION_OWNER_USER_IDS = {
  Barcelona: "user-paul",
  Oxford: "user-info",
  Porto: "user-admin",
} as const satisfies Record<"Barcelona" | "Porto" | "Oxford", string>;

export function getOwnerUserIdForRegion(region: string): string | null {
  if (region in REGION_OWNER_USER_IDS) {
    return REGION_OWNER_USER_IDS[region as keyof typeof REGION_OWNER_USER_IDS];
  }
  return null;
}

function withDefaultEntitlements(
  user: Omit<ManagedUser, "allowedViews" | "dashboardPrefs" | "department" | "roles"> & {
    department?: UserDepartment;
    roles?: UserRole[];
    allowedViews?: InternalOperationsView[] | null;
    dashboardPrefs?: UserDashboardPrefs | null;
  },
): ManagedUser {
  const department = user.department ?? "Corporate";
  const roles = normalizeUserRoles(user.roles ?? [user.role], user.role);
  const role = primaryUserRole(roles);
  return {
    ...user,
    role,
    roles,
    department,
    allowedViews:
      user.allowedViews !== undefined
        ? user.allowedViews
        : defaultAllowedViewsForRoles(roles, department),
    dashboardPrefs:
      user.dashboardPrefs !== undefined
        ? user.dashboardPrefs
        : { homeTiles: defaultHomeTilesForRoles(roles, department) },
  };
}

export function createInitialUsers(): ManagedUser[] {
  return [
    withDefaultEntitlements({
      id: "user-admin",
      operatorLabel: "Admin",
      fullName: "Admin",
      username: "admin@unit311central.com",
      email: "admin@unit311central.com",
      phone: "",
      role: "Admin",
      department: "Corporate",
      status: "Active",
      region: "Multi-site",
      licenseId: "",
      notes: "Primary admin account for Unit311 Central.",
      allowedViews: null,
      dashboardPrefs: null,
    }),
    withDefaultEntitlements({
      id: "user-info",
      operatorLabel: "Info",
      fullName: "Info",
      username: "info@unit311central.com",
      email: "info@unit311central.com",
      phone: "",
      role: "Admin",
      department: "Corporate",
      status: "Active",
      region: "Multi-site",
      licenseId: "",
      notes: "Shared operations inbox for Unit311 Central.",
      allowedViews: null,
      dashboardPrefs: null,
    }),
    withDefaultEntitlements({
      id: "user-paul",
      operatorLabel: "Paul",
      fullName: "Paul",
      username: "paul@unit311central.com",
      email: "paul@unit311central.com",
      phone: "",
      role: "Admin",
      department: "Corporate",
      status: "Active",
      region: "Multi-site",
      licenseId: "",
      notes: "Executive account for Unit311 Central.",
      allowedViews: null,
      dashboardPrefs: null,
    }),
  ];
}

export function userStatusClass(status: UserStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "On Leave":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "Inactive":
      return "border-white/20 bg-white/10 text-white/60";
  }
}

type DbInternalOperator = {
  id: string;
  operator_label: string;
  full_name: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  roles?: unknown;
  status: string;
  region: string;
  license_id: string | null;
  notes: string | null;
  department?: string | null;
  allowed_views?: unknown;
  dashboard_prefs?: unknown;
  created_at: string;
  updated_at: string;
};

export function mapInternalOperator(row: DbInternalOperator): ManagedUser {
  const roles = normalizeUserRoles(row.roles, row.role);
  const role = primaryUserRole(roles);
  const department = normalizeUserDepartment(row.department);
  const allowedViews = normalizeAllowedViews(row.allowed_views);
  const homeTiles = normalizeHomeTiles(
    row.dashboard_prefs &&
      typeof row.dashboard_prefs === "object" &&
      row.dashboard_prefs !== null &&
      "homeTiles" in (row.dashboard_prefs as object)
      ? (row.dashboard_prefs as { homeTiles?: unknown }).homeTiles
      : null,
  );

  return {
    id: row.id,
    operatorLabel: row.operator_label,
    fullName: row.full_name,
    username: row.username,
    email: row.email ?? "",
    phone: row.phone ?? "",
    role,
    roles,
    department,
    status: row.status as UserStatus,
    region: row.region as UserRegion,
    licenseId: row.license_id ?? "",
    notes: row.notes ?? "",
    allowedViews,
    dashboardPrefs: homeTiles ? { homeTiles } : null,
  };
}

export function createBlankUserInput(): Omit<ManagedUser, "id"> {
  const role: UserRole = "Associate";
  const roles: UserRole[] = [role];
  const department: UserDepartment = "Corporate";
  return {
    operatorLabel: "New Operator",
    fullName: "New Operator",
    username: `user${Date.now().toString(36)}`,
    email: "",
    phone: "",
    role,
    roles,
    department,
    status: "Active",
    region: "Barcelona",
    licenseId: "",
    notes: "",
    allowedViews: defaultAllowedViewsForRoles(roles, department),
    dashboardPrefs: { homeTiles: defaultHomeTilesForRoles(roles, department) },
  };
}

export function userFieldsEqual(a: ManagedUser, b: ManagedUser) {
  return (
    a.operatorLabel === b.operatorLabel &&
    a.fullName === b.fullName &&
    a.username === b.username &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.role === b.role &&
    JSON.stringify(a.roles) === JSON.stringify(b.roles) &&
    a.department === b.department &&
    a.status === b.status &&
    a.region === b.region &&
    a.licenseId === b.licenseId &&
    a.notes === b.notes &&
    JSON.stringify(a.allowedViews) === JSON.stringify(b.allowedViews) &&
    JSON.stringify(a.dashboardPrefs) === JSON.stringify(b.dashboardPrefs)
  );
}
