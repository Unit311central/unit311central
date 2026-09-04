import type { HrEmployee } from "@/lib/hr-data";

import { GREENDESERT_DEFAULT_HR_LOCATION } from "@/lib/greendesert/greendesert-hr-config";

/** Green Desert executive team — Jeddah, $100k annual / monthly (USD). */
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
    fullName: "Ashley Pursglove",
    preferredName: "Ashley",
    email: "ashley.pursglove@greendesert.unit311central.com",
    phone: "+966 12 555 0101",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2023-09-01",
    location: GREENDESERT_DEFAULT_HR_LOCATION,
    role: "Chief Technology Officer",
    department: "Technology",
    manager: "",
    currency: "USD",
    payFrequency: "monthly",
    salaryCurrent: 100_000,
    salaryPrevious: 100_000,
    bonus: 0,
    holidayCalendar: "Saudi Arabia",
    vacationDaysPerYear: 30,
    vacationDaysTaken: 3,
  },
  {
    fullName: "Abdulmajeed Hashem",
    preferredName: "Abdulmajeed",
    email: "abdulmajeed@greendesert.unit311central.com",
    phone: "+966 54 477 7775",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2023-01-15",
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
    vacationDaysTaken: 5,
  },
  {
    fullName: "Yusuf Hashem",
    preferredName: "Yusuf",
    email: "yusuf@greendesert.unit311central.com",
    phone: "+966 12 555 0103",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2023-04-01",
    location: GREENDESERT_DEFAULT_HR_LOCATION,
    role: "Chief Financial Officer",
    department: "Finance",
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
    fullName: "Omar Hashem",
    preferredName: "Omar",
    email: "omar@greendesert.unit311central.com",
    phone: "+966 12 555 0104",
    employmentStatus: "active",
    employmentType: "full_time",
    dateJoined: "2023-06-01",
    location: GREENDESERT_DEFAULT_HR_LOCATION,
    role: "Chief Operating Officer",
    department: "Operations",
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
];
