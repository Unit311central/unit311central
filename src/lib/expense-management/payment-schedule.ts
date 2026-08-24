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

const DEFAULT_SCHEDULE: Omit<ExpensePaymentSchedule, "workspaceId"> = {
  frequency: "monthly",
  cutoffDay: 25,
  approvalDeadlineDay: 27,
  paymentDay: 31,
};

export function defaultExpensePaymentSchedule(workspaceId: string): ExpensePaymentSchedule {
  return { workspaceId, ...DEFAULT_SCHEDULE };
}

/**
 * Resolve the payment date for the current or next expense run from workspace schedule.
 */
export function calculateExpectedPaymentDate(
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

export function buildExpenseRunLabel(paymentDateIso: string) {
  const date = new Date(`${paymentDateIso}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
}

export function periodBoundsForPaymentMonth(paymentDateIso: string) {
  const payment = new Date(`${paymentDateIso}T12:00:00`);
  const start = new Date(payment.getFullYear(), payment.getMonth(), 1);
  const end = new Date(payment.getFullYear(), payment.getMonth() + 1, 0);
  return { periodStart: toIsoDate(start), periodEnd: toIsoDate(end) };
}
