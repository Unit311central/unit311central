import type { HrEmployee } from "@/lib/hr-data";

import { GREENDESERT_DEFAULT_HR_LOCATION } from "@/lib/greendesert/greendesert-hr-config";

/** Green Desert workforce — four employees, all Jeddah, $100k annual / monthly. */
export const GREENDESERT_HR_TEAM_EMPLOYEES: Array<
  Pick<
    HrEmployee,
    | "fullName"
    | "preferredName"
    | "email"
    | "phone"
    | "employmentStatus"
    | "employmentType"
    | "dateJoined"
    | "location"
    | "role"
    | "department"
    | "manager"
    | "currency"
    | "payFrequency"
    | "salaryCurrent"
    | "salaryPrevious"
    | "bonus"
    | "holidayCalendar"
    | "vacationDaysPerYear"
    | "vacationDaysTaken"
  >
> = [
  {
    fullName: "Layla Al-Harbi",
    preferredName: "Layla",
    email: "layla.alharbi@greendesert.unit311central.com",
    phone: "+966 12 555 0101",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2024-03-01",
    location: GREENDESERT_DEFAULT_HR_LOCATION,
    role: "Chief Executive Officer",
    department: "Executive",
    manager: "",
    currency: "USD",
    payFrequency: "monthly",
    salaryCurrent: 100_000,
    salaryPrevious: 100_000,
    bonus: 0,
    holidayCalendar: "Saudi Arabia",
    vacationDaysPerYear: 30,
    vacationDaysTaken: 4,
  },
  {
    fullName: "Omar Al-Qahtani",
    preferredName: "Omar",
    email: "omar.alqahtani@greendesert.unit311central.com",
    phone: "+966 12 555 0102",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2024-06-15",
    location: GREENDESERT_DEFAULT_HR_LOCATION,
    role: "Head of Reactor Engineering",
    department: "Engineering",
    manager: "",
    currency: "USD",
    payFrequency: "monthly",
    salaryCurrent: 100_000,
    salaryPrevious: 100_000,
    bonus: 0,
    holidayCalendar: "Saudi Arabia",
    vacationDaysPerYear: 30,
    vacationDaysTaken: 2,
  },
  {
    fullName: "Noura Al-Shehri",
    preferredName: "Noura",
    email: "noura.alshehri@greendesert.unit311central.com",
    phone: "+966 12 555 0103",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2025-01-10",
    location: GREENDESERT_DEFAULT_HR_LOCATION,
    role: "Operations Director",
    department: "Operations",
    manager: "",
    currency: "USD",
    payFrequency: "monthly",
    salaryCurrent: 100_000,
    salaryPrevious: 100_000,
    bonus: 0,
    holidayCalendar: "Saudi Arabia",
    vacationDaysPerYear: 30,
    vacationDaysTaken: 6,
  },
  {
    fullName: "Faisal Al-Dossary",
    preferredName: "Faisal",
    email: "faisal.aldossary@greendesert.unit311central.com",
    phone: "+966 12 555 0104",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2025-04-01",
    location: GREENDESERT_DEFAULT_HR_LOCATION,
    role: "Commercial Lead",
    department: "Sales",
    manager: "",
    currency: "USD",
    payFrequency: "monthly",
    salaryCurrent: 100_000,
    salaryPrevious: 100_000,
    bonus: 0,
    holidayCalendar: "Saudi Arabia",
    vacationDaysPerYear: 30,
    vacationDaysTaken: 1,
  },
];
