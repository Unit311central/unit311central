/**
 * OnwardAir OUR TEAM (onwardair.tech) — staff only, not Luminary Advisors.
 * Seeded into hr_employees for the onwardair workspace.
 */

import type { HrEmployee } from "@/lib/hr-data";

export type OnwardAirHrTeamSeed = Partial<HrEmployee> & {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
};

const OA_HR_COMMON = {
  location: "Houston",
  nationality: "American",
  currency: "USD",
  salaryCurrent: 100_000,
  salaryPrevious: 100_000,
  bonus: 1_000,
  payFrequency: "monthly",
  employmentStatus: "active" as const,
  employmentType: "full_time",
  holidayCalendar: "United States (Federal)",
  vacationDaysPerYear: 20,
  vacationDaysTaken: 0,
  phone: "",
  address: "Houston, TX, USA",
  preferredName: "",
  suburb: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  officeId: null,
  manager: "",
  managerEmployeeId: null,
  probationEndDate: null,
  endDate: null,
  salaryIncreaseDate: null,
  salaryIncreaseAmount: 0,
  archivedAt: null,
};

const OA_CEO_NAME = "Scott Parazynski, MD";
const OA_COO_NAME = "Brian Whiteside";

/** Stable seed rows — ids are labels only; DB inserts use generated ids. */
export const OA_HR_TEAM_EMPLOYEES: readonly OnwardAirHrTeamSeed[] = [
  {
    ...OA_HR_COMMON,
    id: "oa-hr-01",
    fullName: OA_CEO_NAME,
    preferredName: "Scott",
    email: "scott.parazynski@onwardair.tech",
    role: "Founder, CEO",
    department: "Leadership",
    dateJoined: "2019-01-15",
    manager: "",
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-02",
    fullName: OA_COO_NAME,
    preferredName: "Brian",
    email: "brian.whiteside@onwardair.tech",
    role: "COO",
    department: "Leadership",
    dateJoined: "2019-06-01",
    manager: OA_CEO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-03",
    fullName: "Monte Mann",
    preferredName: "Monte",
    email: "monte.mann@onwardair.tech",
    role: "Comptroller, Program Management",
    department: "Finance",
    dateJoined: "2020-03-01",
    manager: OA_CEO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-04",
    fullName: "Carolyn Scott",
    preferredName: "Carolyn",
    email: "carolyn.scott@onwardair.tech",
    role: "Senior Director of Marketing",
    department: "Marketing",
    dateJoined: "2020-08-15",
    manager: OA_CEO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-05",
    fullName: "Dan Wax",
    preferredName: "Dan",
    email: "dan.wax@onwardair.tech",
    role: "Director of Supply Chain",
    department: "Operations",
    dateJoined: "2021-02-01",
    manager: OA_CEO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-06",
    fullName: "Mike Teeter",
    preferredName: "Mike",
    email: "mike.teeter@onwardair.tech",
    role: "Senior Mechanical Engineer",
    department: "Engineering",
    dateJoined: "2021-05-01",
    manager: OA_COO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-07",
    fullName: "Keven Coates",
    preferredName: "Keven",
    email: "keven.coates@onwardair.tech",
    role: "Senior Electrical Engineer",
    department: "Engineering",
    dateJoined: "2021-07-01",
    manager: OA_COO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-08",
    fullName: "Jon Fenner",
    preferredName: "Jon",
    email: "jon.fenner@onwardair.tech",
    role: "Senior R&D Engineer",
    department: "Engineering",
    dateJoined: "2021-09-01",
    manager: OA_COO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-09",
    fullName: "David Colling",
    preferredName: "David",
    email: "david.colling@onwardair.tech",
    role: "Senior Aerospace Engineer",
    department: "Engineering",
    dateJoined: "2022-01-15",
    manager: OA_COO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-10",
    fullName: "Justin Dodrill",
    preferredName: "Justin",
    email: "justin.dodrill@onwardair.tech",
    role: "Senior Software Engineer",
    department: "Engineering",
    dateJoined: "2022-04-01",
    manager: OA_COO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-11",
    fullName: "Anuj Kumar",
    preferredName: "Anuj",
    email: "anuj.kumar@onwardair.tech",
    role: "CFD Analyst and Aerospace Engineer",
    department: "Engineering",
    dateJoined: "2022-08-01",
    manager: OA_COO_NAME,
  },
  {
    ...OA_HR_COMMON,
    id: "oa-hr-12",
    fullName: "Alec Gibson",
    preferredName: "Alec",
    email: "alec.gibson@onwardair.tech",
    role: "Associate Aerospace / Mechanical Engineer",
    department: "Engineering",
    dateJoined: "2023-02-01",
    manager: OA_COO_NAME,
  },
] as const;

export const OA_HR_FOUNDER_NAME = OA_CEO_NAME;
