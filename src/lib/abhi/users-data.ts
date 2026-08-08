import { defaultAllowedViewsForRoles } from "@/lib/access-presets";
import {
  primaryUserRole,
  type ManagedUser,
  type UserDepartment,
  type UserRole,
} from "@/lib/user-management-data";

type AbhiStaffRow = {
  id: string;
  fullName: string;
  role: string;
  department: string;
  emailLocal: string;
  city: string;
  country: string;
  userRole: UserRole;
  isExec: boolean;
};

const ABHI_STAFF: AbhiStaffRow[] = [
  {
    id: "abhi-emp-peter-ellingworth",
    fullName: "Peter Ellingworth",
    role: "Chief Executive Officer",
    department: "Leadership",
    emailLocal: "peter.ellingworth",
    city: "London",
    country: "United Kingdom",
    userRole: "Exec",
    isExec: true,
  },
  {
    id: "abhi-emp-jane-lewis",
    fullName: "Jane Lewis",
    role: "Chief Operating Officer and Chief Financial Officer",
    department: "Leadership",
    emailLocal: "jane.lewis",
    city: "London",
    country: "United Kingdom",
    userRole: "Exec",
    isExec: true,
  },
  {
    id: "abhi-emp-judith-mellis",
    fullName: "Judith Mellis",
    role: "Senior Manager, UK Market Affairs",
    department: "UK Market Affairs",
    emailLocal: "judith.mellis",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
  {
    id: "abhi-emp-andrew-davies",
    fullName: "Andrew Davies",
    role: "Executive Director, Digital Health",
    department: "Digital Health",
    emailLocal: "andrew.davies",
    city: "London",
    country: "United Kingdom",
    userRole: "Exec",
    isExec: true,
  },
  {
    id: "abhi-emp-rebecca-parkin",
    fullName: "Rebecca Parkin",
    role: "Associate Director, Digital Health",
    department: "Digital Health",
    emailLocal: "rebecca.parkin",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
  {
    id: "abhi-emp-phil-brown",
    fullName: "Phil Brown",
    role: "Director, Regulatory & Compliance",
    department: "Regulatory",
    emailLocal: "phil.brown",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
  {
    id: "abhi-emp-paul-benton",
    fullName: "Paul Benton",
    role: "Director, International",
    department: "International",
    emailLocal: "paul.benton",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
  {
    id: "abhi-emp-sophie-green",
    fullName: "Sophie Green",
    role: "International Accelerator Manager",
    department: "International",
    emailLocal: "sophie.green",
    city: "London",
    country: "United Kingdom",
    userRole: "Associate",
    isExec: false,
  },
  {
    id: "abhi-emp-bayode-adisa",
    fullName: "Bayode Adisa",
    role: "International Markets Manager",
    department: "International",
    emailLocal: "bayode.adisa",
    city: "London",
    country: "United Kingdom",
    userRole: "Associate",
    isExec: false,
  },
  {
    id: "abhi-emp-jonathan-evans",
    fullName: "Jonathan Evans",
    role: "Commercial Director",
    department: "Communications",
    emailLocal: "jonathan.evans",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
  {
    id: "abhi-emp-charlotte-hart",
    fullName: "Charlotte Hart",
    role: "Communications and Events Executive",
    department: "Communications",
    emailLocal: "charlotte.hart",
    city: "London",
    country: "United Kingdom",
    userRole: "Associate",
    isExec: false,
  },
  {
    id: "abhi-emp-luella-trickett",
    fullName: "Luella Trickett",
    role: "Head of Market Access",
    department: "Market Access",
    emailLocal: "luella.trickett",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
  {
    id: "abhi-emp-owain-prescott",
    fullName: "Owain Prescott",
    role: "Market Access Executive",
    department: "Market Access",
    emailLocal: "owain.prescott",
    city: "London",
    country: "United Kingdom",
    userRole: "Associate",
    isExec: false,
  },
  {
    id: "abhi-emp-michelle-michelucci",
    fullName: "Michelle Michelucci",
    role: "Head of International Events",
    department: "International Events",
    emailLocal: "michelle.michelucci",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
  {
    id: "abhi-emp-lauren-hayes",
    fullName: "Lauren Hayes",
    role: "Events Coordinator",
    department: "International Events",
    emailLocal: "lauren.hayes",
    city: "London",
    country: "United Kingdom",
    userRole: "Associate",
    isExec: false,
  },
  {
    id: "abhi-emp-addie-macgregor",
    fullName: "Addie Macgregor",
    role: "Sustainability & Ethics Manager",
    department: "Sustainability",
    emailLocal: "addie.macgregor",
    city: "London",
    country: "United Kingdom",
    userRole: "Manager",
    isExec: false,
  },
];

function mapDepartment(department: string): UserDepartment {
  const normalized = department.toLowerCase();
  if (normalized.includes("finance") || normalized.includes("leadership")) return "Corporate";
  if (normalized.includes("hr") || normalized.includes("people")) return "HR";
  if (normalized.includes("tech")) return "Technology";
  if (normalized.includes("event") || normalized.includes("communication") || normalized.includes("marketing")) {
    return "Operations";
  }
  return "Corporate";
}

/** ABHI Tools → Users list from staff roster (city + country). */
export function listAbhiTenantUsers(): ManagedUser[] {
  return ABHI_STAFF.map((member, index) => {
    const roles: UserRole[] = [member.userRole];
    const department = mapDepartment(member.department);
    const departments: UserDepartment[] = [department];
    const email = `${member.emailLocal}@abhi.org.uk`;

    return {
      id: `abhi-user-${String(index + 1).padStart(2, "0")}`,
      operatorLabel: member.fullName.split(/\s+/)[0] ?? "User",
      fullName: member.fullName,
      username: email,
      email,
      phone: "",
      role: primaryUserRole(roles),
      roles,
      department,
      departments,
      status: "Active",
      region: "Multi-site",
      city: member.city,
      country: member.country,
      licenseId: "",
      notes: member.role,
      allowedViews: defaultAllowedViewsForRoles(roles, departments),
      dashboardPrefs: null,
    } satisfies ManagedUser;
  });
}
