import { HR_LOCATIONS, type HrEmployee } from "@/lib/hr-data";

export type HrUpcomingVacation = {
  employeeName: string;
  location: string;
  startDate: string;
  endDate: string;
  days: number;
};

/** Demo vacation schedule — illustrative until leave booking is wired up. */
export const HR_UPCOMING_VACATIONS: HrUpcomingVacation[] = [
  {
    employeeName: "María García",
    location: "Barcelona",
    startDate: "2026-06-23",
    endDate: "2026-06-27",
    days: 5,
  },
  {
    employeeName: "Carlos Mendoza",
    location: "Barcelona",
    startDate: "2026-07-07",
    endDate: "2026-07-18",
    days: 10,
  },
  {
    employeeName: "Elena Ruiz",
    location: "Madrid",
    startDate: "2026-06-30",
    endDate: "2026-07-04",
    days: 5,
  },
  {
    employeeName: "Ana Torres",
    location: "Hybrid",
    startDate: "2026-07-14",
    endDate: "2026-07-25",
    days: 10,
  },
  {
    employeeName: "Pablo Serrano",
    location: "Barcelona",
    startDate: "2026-08-04",
    endDate: "2026-08-08",
    days: 5,
  },
  {
    employeeName: "Lucía Fernández",
    location: "Remote",
    startDate: "2026-07-21",
    endDate: "2026-08-01",
    days: 10,
  },
  {
    employeeName: "David Llorens",
    location: "Barcelona",
    startDate: "2026-08-11",
    endDate: "2026-08-15",
    days: 5,
  },
];

export const HR_HEADCOUNT_PERIOD_DAYS = 90;

export type StaffByLocation = {
  location: string;
  count: number;
  share: number;
};

export type HeadcountGrowth = {
  periodDays: number;
  joinedInPeriod: number;
  total: number;
  previousTotal: number;
  percentChange: number;
};

export function countStaffByLocation(employees: HrEmployee[]): StaffByLocation[] {
  const counts = new Map<string, number>();

  for (const location of HR_LOCATIONS) {
    counts.set(location, 0);
  }

  for (const employee of employees) {
    const location = employee.location?.trim() || "Barcelona";
    counts.set(location, (counts.get(location) ?? 0) + 1);
  }

  const total = employees.length || 1;

  return [...counts.entries()]
    .map(([location, count]) => ({
      location,
      count,
      share: Math.round((count / total) * 100),
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function computeHeadcountGrowth(
  employees: HrEmployee[],
  periodDays = HR_HEADCOUNT_PERIOD_DAYS,
): HeadcountGrowth {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  cutoff.setHours(0, 0, 0, 0);

  const joinedInPeriod = employees.filter((employee) => {
    const joined = new Date(employee.dateJoined);
    return !Number.isNaN(joined.getTime()) && joined >= cutoff;
  }).length;

  const total = employees.length;
  const previousTotal = Math.max(total - joinedInPeriod, 0);
  const percentChange =
    previousTotal > 0
      ? Math.round((joinedInPeriod / previousTotal) * 100)
      : joinedInPeriod > 0
        ? 100
        : 0;

  return { periodDays, joinedInPeriod, total, previousTotal, percentChange };
}

export function formatVacationRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
  const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const fullFmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (startDate === endDate) return fullFmt.format(start);
  if (sameMonth) {
    return `${dayFmt.format(start)}–${dayFmt.format(end)} ${monthFmt.format(start)}`;
  }

  return `${fullFmt.format(start)} – ${fullFmt.format(end)}`;
}

export function daysUntilVacation(startDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function upcomingVacationsSorted(vacations = HR_UPCOMING_VACATIONS) {
  return [...vacations].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}
