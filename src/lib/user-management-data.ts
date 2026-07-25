import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import {
  defaultAllowedViews,
  defaultHomeTiles,
  normalizeAllowedViews,
  normalizeHomeTiles,
} from "@/lib/access-presets";
import type { InternalOperationsView } from "@/lib/internal-operations-data";

export type UserRole = "Board" | "Exec" | "Manager" | "Associate" | "Admin";

export type UserDepartment =
  | "Board"
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
  role: UserRole;
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

export const USER_DEPARTMENT_OPTIONS: UserDepartment[] = [
  "Board",
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
  user: Omit<ManagedUser, "allowedViews" | "dashboardPrefs" | "department"> & {
    department?: UserDepartment;
    allowedViews?: InternalOperationsView[] | null;
    dashboardPrefs?: UserDashboardPrefs | null;
  },
): ManagedUser {
  const department = user.department ?? "Corporate";
  return {
    ...user,
    department,
    allowedViews:
      user.allowedViews !== undefined
        ? user.allowedViews
        : defaultAllowedViews(user.role, department),
    dashboardPrefs:
      user.dashboardPrefs !== undefined
        ? user.dashboardPrefs
        : { homeTiles: defaultHomeTiles(user.role, department) },
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
  const role = normalizeUserRole(row.role);
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
  const department: UserDepartment = "Corporate";
  return {
    operatorLabel: "New Operator",
    fullName: "New Operator",
    username: `user${Date.now().toString(36)}`,
    email: "",
    phone: "",
    role,
    department,
    status: "Active",
    region: "Barcelona",
    licenseId: "",
    notes: "",
    allowedViews: defaultAllowedViews(role, department),
    dashboardPrefs: { homeTiles: defaultHomeTiles(role, department) },
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
    a.department === b.department &&
    a.status === b.status &&
    a.region === b.region &&
    a.licenseId === b.licenseId &&
    a.notes === b.notes &&
    JSON.stringify(a.allowedViews) === JSON.stringify(b.allowedViews) &&
    JSON.stringify(a.dashboardPrefs) === JSON.stringify(b.dashboardPrefs)
  );
}
