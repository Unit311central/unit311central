import { getCountryRules } from "@/lib/payroll/country-rules/us";
import { noopBenefitsProvider } from "@/lib/payroll/providers/benefits-provider";
import { ratesFromSettings } from "@/lib/payroll/providers/tax-provider";
import type {
  PayrollCalculation,
  PayrollEmployeeProfile,
  PayrollFrequency,
  PayrollSettings,
} from "@/lib/payroll/types";
import { roundPayrollMoney } from "@/lib/payroll/types";

export type EmployeePayInput = {
  salaryCurrent?: number | null;
  bonus?: number | null;
  payFrequency?: string | null;
  currency?: string | null;
  profile?: Partial<PayrollEmployeeProfile> | null;
  /** HR dateJoined or payroll hireDate (YYYY-MM-DD). */
  joinedOn?: string | null;
};

export type PayrollCalcOptions = {
  /** When set, annual bonus is included only if this equals the site-wide bonus pay date. */
  payDate?: string | null;
};

/** HR salaryCurrent is always annual. Profile monthly/annual overrides win when set. */
export function resolveMonthlyGrossBase(input: EmployeePayInput): number {
  const profile = input.profile;
  if (profile?.monthlySalary != null && profile.monthlySalary > 0) {
    return roundPayrollMoney(profile.monthlySalary);
  }
  if (profile?.annualSalary != null && profile.annualSalary > 0) {
    return roundPayrollMoney(profile.annualSalary / 12);
  }
  if (profile?.hourlyRate != null && profile.hourlyRate > 0) {
    // V1 assumption: 160 hours / month
    return roundPayrollMoney(profile.hourlyRate * 160);
  }

  // salaryCurrent is annual regardless of payFrequency label
  const salary = Number(input.salaryCurrent || 0);
  return roundPayrollMoney(salary / 12);
}

/** Annual bonus entitlement from profile or HR (not yet pro-rated). */
export function resolveAnnualBonusEntitlement(input: EmployeePayInput): number {
  const profileBonus = input.profile?.bonus;
  const hrBonus = Number(input.bonus || 0);
  if (profileBonus != null && profileBonus > 0) return roundPayrollMoney(profileBonus);
  return roundPayrollMoney(hrBonus);
}

export function resolvePayAddOns(input: EmployeePayInput): { bonus: number; commission: number } {
  return {
    bonus: resolveAnnualBonusEntitlement(input),
    commission: roundPayrollMoney(Number(input.profile?.commission || 0)),
  };
}

export function bonusPayDateForYear(
  settings: Pick<PayrollSettings, "bonusPayMonth" | "bonusPayDay">,
  year: number,
): string {
  const month = Math.min(12, Math.max(1, Number(settings.bonusPayMonth || 12)));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Math.max(1, Number(settings.bonusPayDay || 31)), lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function nextBonusPayDate(
  settings: Pick<PayrollSettings, "bonusPayMonth" | "bonusPayDay">,
  from = new Date(),
): string {
  const year = from.getUTCFullYear();
  const thisYear = bonusPayDateForYear(settings, year);
  if (from.toISOString().slice(0, 10) <= thisYear) return thisYear;
  return bonusPayDateForYear(settings, year + 1);
}

export function isBonusPayDate(
  payDate: string | null | undefined,
  settings: Pick<PayrollSettings, "bonusPayMonth" | "bonusPayDay">,
): boolean {
  if (!payDate) return false;
  const year = Number(payDate.slice(0, 4));
  if (!Number.isFinite(year)) return false;
  return payDate === bonusPayDateForYear(settings, year);
}

/**
 * Months employed in `year` through `throughMonth` (1–12), inclusive of the join month.
 * Example: join 15 June, through Dec → 7 months (Jun–Dec).
 */
export function monthsEmployedInYearInclusive(
  joinedOn: string | null | undefined,
  year: number,
  throughMonth = 12,
): number {
  const endMonth = Math.min(12, Math.max(1, throughMonth));
  if (!joinedOn) return endMonth;

  const join = new Date(`${joinedOn.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(join.getTime())) return endMonth;

  const joinYear = join.getUTCFullYear();
  const joinMonth = join.getUTCMonth() + 1;
  if (joinYear > year) return 0;
  if (joinYear < year) return endMonth;
  return Math.max(0, endMonth - joinMonth + 1);
}

/** Pro-rate annual bonus by months including join month / 12. */
export function prorateAnnualBonus(input: {
  annualBonus: number;
  joinedOn?: string | null;
  year: number;
  throughMonth?: number;
}): number {
  const annual = Number(input.annualBonus || 0);
  if (annual <= 0) return 0;
  const months = monthsEmployedInYearInclusive(
    input.joinedOn,
    input.year,
    input.throughMonth ?? 12,
  );
  return roundPayrollMoney((annual * months) / 12);
}

export function bonusDueOnPayDate(
  input: EmployeePayInput,
  settings: PayrollSettings,
  payDate: string | null | undefined,
): number {
  if (!isBonusPayDate(payDate, settings)) return 0;
  const annual = resolveAnnualBonusEntitlement(input);
  const year = Number(String(payDate).slice(0, 4));
  const throughMonth = Number(String(payDate).slice(5, 7)) || settings.bonusPayMonth || 12;
  return prorateAnnualBonus({
    annualBonus: annual,
    joinedOn: input.joinedOn ?? input.profile?.hireDate ?? null,
    year,
    throughMonth,
  });
}

export function calculateEmployeePayroll(
  input: EmployeePayInput,
  settings: PayrollSettings,
  options?: PayrollCalcOptions,
): PayrollCalculation {
  const country = getCountryRules(settings.countryCode);
  const base = resolveMonthlyGrossBase(input);
  const { commission } = resolvePayAddOns(input);
  const bonus = bonusDueOnPayDate(input, settings, options?.payDate);
  const gross = roundPayrollMoney(base + bonus + commission);

  const rates = ratesFromSettings(settings, {
    federalTaxPct: input.profile?.federalTaxPct ?? undefined,
    stateTaxPct: input.profile?.stateTaxPct ?? undefined,
    socialSecurityPct: input.profile?.socialSecurityPct ?? undefined,
    medicarePct: input.profile?.medicarePct ?? undefined,
    employerPayrollPct: input.profile?.employerPayrollPct ?? undefined,
  });

  const taxes = country.taxProvider.calculateEmployeeTaxes(gross, rates);
  const benefits = noopBenefitsProvider.applyBenefits(gross);
  const net = roundPayrollMoney(gross - taxes.employeeTaxTotal - benefits.deduction);
  const totalEmploymentCost = roundPayrollMoney(
    gross + taxes.employerTax + benefits.employerContribution,
  );

  return {
    gross,
    bonus,
    commission,
    ...taxes,
    net: Math.max(0, net),
    totalEmploymentCost,
    currency:
      input.profile?.currency ||
      input.currency ||
      settings.defaultCurrency ||
      country.defaultCurrency,
  };
}

export function periodBoundsForPayDate(payDate: string, frequency: PayrollFrequency = "monthly") {
  const end = new Date(`${payDate}T12:00:00.000Z`);
  const start = new Date(end);
  if (frequency === "weekly") {
    start.setUTCDate(start.getUTCDate() - 6);
  } else if (frequency === "biweekly") {
    start.setUTCDate(start.getUTCDate() - 13);
  } else {
    start.setUTCDate(1);
  }
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

/** Next pay date from settings (0 = last day of month). */
export function nextPayDateFromSettings(settings: PayrollSettings, from = new Date()): string {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const targetDay = settings.payDay > 0 ? Math.min(settings.payDay, lastDay) : lastDay;
  const candidate = new Date(Date.UTC(year, month, targetDay));
  if (from.getUTCDate() < targetDay || (settings.payDay === 0 && from.getUTCDate() < lastDay)) {
    return candidate.toISOString().slice(0, 10);
  }
  const nextLast = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const nextDay = settings.payDay > 0 ? Math.min(settings.payDay, nextLast) : nextLast;
  return new Date(Date.UTC(year, month + 1, nextDay)).toISOString().slice(0, 10);
}
