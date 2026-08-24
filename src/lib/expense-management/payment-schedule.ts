import type { ExpensePaymentSchedule } from "@/lib/expense-management/types";

function clampDay(day: number) {
  return Math.min(31, Math.max(1, Math.floor(day)));
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function dateWithClampedDay(year: number, monthIndex: number, day: number) {
  const max = daysInMonth(year, monthIndex);
  const d = Math.min(clampDay(day), max);
  return new Date(year, monthIndex, d);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBeforeCutoff(schedule: ExpensePaymentSchedule) {
  const delta = schedule.paymentDay - schedule.cutoffDay;
  return Math.min(13, Math.max(1, delta > 0 ? delta : 3));
}

const DEFAULT_SCHEDULE: Omit<ExpensePaymentSchedule, "workspaceId"> = {
  frequency: "monthly",
  cutoffDay: 25,
  approvalDeadlineDay: 27,
  paymentDay: 31,
};

export function defaultExpensePaymentSchedule(workspaceId: string): ExpensePaymentSchedule {
  return { workspaceId, ...DEFAULT_SCHEDULE };
}

function upcomingFortnightlyPaymentDates(
  schedule: ExpensePaymentSchedule,
  referenceDate: Date,
  monthsAhead = 3,
): Date[] {
  const ref = new Date(referenceDate);
  const dates: Date[] = [];
  const startMonth = ref.getMonth();
  const startYear = ref.getFullYear();

  for (let offset = 0; offset < monthsAhead; offset += 1) {
    const absoluteMonth = startMonth + offset;
    const year = startYear + Math.floor(absoluteMonth / 12);
    const monthIndex = absoluteMonth % 12;
    const maxDay = daysInMonth(year, monthIndex);

    dates.push(dateWithClampedDay(year, monthIndex, schedule.paymentDay));

    const secondDay = schedule.paymentDay + 14;
    if (secondDay <= maxDay) {
      dates.push(dateWithClampedDay(year, monthIndex, secondDay));
    } else {
      const spill = secondDay - maxDay;
      const nextMonthIndex = (monthIndex + 1) % 12;
      const nextYear = year + (monthIndex === 11 ? 1 : 0);
      dates.push(dateWithClampedDay(nextYear, nextMonthIndex, spill));
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function calculateFortnightlyExpectedPaymentDate(
  schedule: ExpensePaymentSchedule,
  referenceDate = new Date(),
): string {
  const ref = new Date(referenceDate);
  const candidates = upcomingFortnightlyPaymentDates(schedule, ref, 4);
  const daysBefore = daysBeforeCutoff(schedule);

  for (const payDate of candidates) {
    const cutoff = new Date(payDate);
    cutoff.setDate(cutoff.getDate() - daysBefore);
    if (ref <= cutoff || ref <= payDate) {
      return toIsoDate(payDate);
    }
  }

  const last = candidates[candidates.length - 1] ?? ref;
  const fallback = new Date(last);
  fallback.setDate(fallback.getDate() + 14);
  return toIsoDate(fallback);
}

function calculateMonthlyExpectedPaymentDate(
  schedule: ExpensePaymentSchedule,
  referenceDate = new Date(),
): string {
  const ref = new Date(referenceDate);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const cutoff = dateWithClampedDay(year, month, schedule.cutoffDay);

  let paymentMonth = month;
  let paymentYear = year;
  if (ref > cutoff) {
    paymentMonth += 1;
    if (paymentMonth > 11) {
      paymentMonth = 0;
      paymentYear += 1;
    }
  }

  return toIsoDate(dateWithClampedDay(paymentYear, paymentMonth, schedule.paymentDay));
}

/**
 * Resolve the payment date for the current or next expense run from workspace schedule.
 */
export function calculateExpectedPaymentDate(
  schedule: ExpensePaymentSchedule,
  referenceDate = new Date(),
): string {
  if (schedule.frequency === "fortnightly") {
    return calculateFortnightlyExpectedPaymentDate(schedule, referenceDate);
  }
  return calculateMonthlyExpectedPaymentDate(schedule, referenceDate);
}

export function buildExpenseRunLabel(paymentDateIso: string) {
  const date = new Date(`${paymentDateIso}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
}

export function periodBoundsForPaymentDate(paymentDateIso: string, frequency: ExpensePaymentSchedule["frequency"]) {
  const payment = new Date(`${paymentDateIso}T12:00:00`);
  if (frequency === "fortnightly") {
    const start = new Date(payment);
    start.setDate(start.getDate() - 13);
    return { periodStart: toIsoDate(start), periodEnd: paymentDateIso };
  }
  const start = new Date(payment.getFullYear(), payment.getMonth(), 1);
  const end = new Date(payment.getFullYear(), payment.getMonth() + 1, 0);
  return { periodStart: toIsoDate(start), periodEnd: toIsoDate(end) };
}

/** @deprecated use periodBoundsForPaymentDate */
export function periodBoundsForPaymentMonth(paymentDateIso: string) {
  return periodBoundsForPaymentDate(paymentDateIso, "monthly");
}

export function cutoffDateForPayment(paymentDateIso: string, schedule: ExpensePaymentSchedule): string {
  const payment = new Date(`${paymentDateIso}T12:00:00`);
  const cutoff = new Date(payment);
  cutoff.setDate(cutoff.getDate() - daysBeforeCutoff(schedule));
  return toIsoDate(cutoff);
}

export function scheduleFrequencyLabel(frequency: ExpensePaymentSchedule["frequency"]): string {
  switch (frequency) {
    case "fortnightly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    case "weekly":
      return "Weekly";
    default:
      return "Custom";
  }
}
