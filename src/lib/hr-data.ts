export type HrDocumentKey = "resume" | "contract" | "shareOptions";

export type HrDocumentSlot = {
  fileName: string | null;
  uploadedAt: string | null;
};

export type HrDocuments = Record<HrDocumentKey, HrDocumentSlot>;

export type HrEmployee = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateJoined: string;
  location: string;
  role: string;
  department: string;
  manager: string;
  salaryCurrent: number;
  salaryPrevious: number;
  salaryIncreaseDate: string | null;
  salaryIncreaseAmount: number;
  bonus: number;
  holidayCalendar: string;
  vacationDaysPerYear: number;
  vacationDaysTaken: number;
  documents: HrDocuments;
};

export const HR_LOCATIONS = ["Barcelona", "Madrid", "Remote", "Hybrid"] as const;
export const HR_DEPARTMENTS = [
  "Executive",
  "Operations",
  "Training",
  "Flight Operations",
  "Sales",
  "Marketing",
  "People",
  "Technical",
  "Customer Success",
  "Finance",
  "Administration",
] as const;
export const HR_HOLIDAY_CALENDARS = [
  "Spain (Catalonia)",
  "Spain (National)",
  "United Kingdom",
  "Portugal",
] as const;

export const HR_DOCUMENT_KEYS: HrDocumentKey[] = ["resume", "contract", "shareOptions"];

export const HR_DOCUMENT_LABELS: Record<HrDocumentKey, string> = {
  resume: "Resume",
  contract: "Contract",
  shareOptions: "Share Options",
};

export const emptyHrDocuments = (): HrDocuments => ({
  resume: { fileName: null, uploadedAt: null },
  contract: { fileName: null, uploadedAt: null },
  shareOptions: { fileName: null, uploadedAt: null },
});

type DbEmployee = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_joined: string;
  location?: string;
  role?: string;
  department?: string;
  manager?: string;
  salary_current: number | string;
  salary_previous: number | string;
  salary_increase_date: string | null;
  salary_increase_amount?: number | string;
  bonus?: number | string;
  holiday_calendar?: string;
  vacation_days_per_year?: number | string;
  vacation_days_taken?: number | string;
  documents: HrDocuments | null;
  created_at: string;
  updated_at: string;
};

export function vacationDaysRemaining(employee: Pick<HrEmployee, "vacationDaysPerYear" | "vacationDaysTaken">) {
  return Math.max(employee.vacationDaysPerYear - employee.vacationDaysTaken, 0);
}

export function mapHrEmployee(row: DbEmployee): HrEmployee {
  const docs = row.documents ?? emptyHrDocuments();
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    dateJoined: row.date_joined.slice(0, 10),
    location: row.location ?? "Barcelona",
    role: row.role ?? "",
    department: row.department ?? "",
    manager: row.manager ?? "",
    salaryCurrent: Number(row.salary_current),
    salaryPrevious: Number(row.salary_previous),
    salaryIncreaseDate: row.salary_increase_date?.slice(0, 10) ?? null,
    salaryIncreaseAmount: Number(row.salary_increase_amount ?? 0),
    bonus: Number(row.bonus ?? 0),
    holidayCalendar: row.holiday_calendar ?? "Spain (Catalonia)",
    vacationDaysPerYear: Number(row.vacation_days_per_year ?? 22),
    vacationDaysTaken: Number(row.vacation_days_taken ?? 0),
    documents: {
      resume: docs.resume ?? { fileName: null, uploadedAt: null },
      contract: docs.contract ?? { fileName: null, uploadedAt: null },
      shareOptions: docs.shareOptions ?? { fileName: null, uploadedAt: null },
    },
  };
}

export function createBlankEmployeeInput(): Omit<HrEmployee, "id"> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    fullName: "",
    email: "",
    phone: "",
    dateJoined: today,
    location: "Barcelona",
    role: "",
    department: "",
    manager: "",
    salaryCurrent: 32000,
    salaryPrevious: 32000,
    salaryIncreaseDate: null,
    salaryIncreaseAmount: 0,
    bonus: 0,
    holidayCalendar: "Spain (Catalonia)",
    vacationDaysPerYear: 22,
    vacationDaysTaken: 0,
    documents: emptyHrDocuments(),
  };
}

export function employeeFieldsEqual(a: HrEmployee, b: HrEmployee) {
  return (
    a.fullName === b.fullName &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.dateJoined === b.dateJoined &&
    a.location === b.location &&
    a.role === b.role &&
    a.department === b.department &&
    a.manager === b.manager &&
    a.salaryCurrent === b.salaryCurrent &&
    a.salaryPrevious === b.salaryPrevious &&
    a.salaryIncreaseDate === b.salaryIncreaseDate &&
    a.salaryIncreaseAmount === b.salaryIncreaseAmount &&
    a.bonus === b.bonus &&
    a.holidayCalendar === b.holidayCalendar &&
    a.vacationDaysPerYear === b.vacationDaysPerYear &&
    a.vacationDaysTaken === b.vacationDaysTaken &&
    JSON.stringify(a.documents) === JSON.stringify(b.documents)
  );
}

export function formatSalary(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHrDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

