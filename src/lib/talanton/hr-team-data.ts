/**
 * Talanton Impact team — talantonimpact.com/about/our-team
 * Seeded into hr_employees for the talantonimpact workspace.
 */

import type { HrEmployee } from "@/lib/hr-data";
import { TALANTON_TEAM_MEMBERS } from "@/lib/talanton/portfolio-data";

export type TalantonHrTeamSeed = Partial<HrEmployee> & {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
};

const TI_HR_COMMON = {
  currency: "USD",
  salaryCurrent: 50_000,
  salaryPrevious: 50_000,
  bonus: 0,
  payFrequency: "monthly",
  holidayCalendar: "United States (Federal)",
  vacationDaysPerYear: 20,
  vacationDaysTaken: 0,
  phone: "",
  address: "",
  preferredName: "",
  suburb: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  officeId: null,
  managerEmployeeId: null,
  probationEndDate: null,
  endDate: null,
  salaryIncreaseDate: null,
  salaryIncreaseAmount: 0,
  archivedAt: null,
  nationality: "American",
};

function slugEmail(fullName: string): string {
  const base = fullName
    .replace(/,\s*(CFA|MBA|PhD|MD)\.?/gi, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, ".");
  return `${base}@talantonimpact.com`;
}

function locationForCountry(country: string): string {
  return country === "Kenya" ? "Nairobi" : "Newtown Square, PA";
}

function holidayCalendarForCountry(country: string): string {
  return country === "Kenya" ? "Kenya" : "United States (Federal)";
}

function nationalityForCountry(country: string): string {
  return country === "Kenya" ? "Kenyan" : "American";
}

function dateJoinedForIndex(index: number): string {
  const year = 2016 + (index % 8);
  const month = String(((index % 12) + 1)).padStart(2, "0");
  const day = String(((index % 27) + 1)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Stable seed rows — ids are labels only; DB inserts use generated ids. */
export const TALANTON_HR_TEAM_EMPLOYEES: readonly TalantonHrTeamSeed[] = TALANTON_TEAM_MEMBERS.map(
  (member, index) => ({
    ...TI_HR_COMMON,
    id: `ti-hr-${String(index + 1).padStart(2, "0")}`,
    fullName: member.fullName,
    preferredName: member.fullName.split(/\s+/)[0] ?? "",
    email: slugEmail(member.fullName),
    role: member.role,
    department: member.department,
    manager: member.manager,
    location: locationForCountry(member.country),
    address: locationForCountry(member.country),
    nationality: nationalityForCountry(member.country),
    employmentStatus: member.employmentStatus,
    employmentType: member.employmentType,
    dateJoined: dateJoinedForIndex(index),
    holidayCalendar: holidayCalendarForCountry(member.country),
    vacationDaysPerYear: member.country === "Kenya" ? 21 : 20,
    vacationDaysTaken: index % 5 === 0 ? 3 : index % 7 === 0 ? 5 : 0,
  }),
);
