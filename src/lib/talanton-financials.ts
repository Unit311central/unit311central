/**
 * Talanton Impact financial fixtures — USD figures for Home / Financials.
 */

import { monthlySalaryFromEmployee } from "@/lib/accounting/operating-obligations";
import { isBoardPackPayrollEligible, type HrEmploymentStatus } from "@/lib/hr-data";
import { TALANTON_HR_TEAM_EMPLOYEES } from "@/lib/talanton/hr-team-data";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

/** Operating cash for the fund management company (USD). */
export const TALANTON_CASH_BALANCE_USD = 4_250_000;

export const TALANTON_CASH_PRIOR_MONTH_USD = 4_180_000;

export function isTalantonWorkspaceSlug(slug: string | null | undefined): boolean {
  return isTalantonImpactSlug(slug);
}

export function getTalantonFixturePayrollObligation() {
  const eligible = TALANTON_HR_TEAM_EMPLOYEES.filter((employee) =>
    isBoardPackPayrollEligible(employee.employmentStatus as HrEmploymentStatus),
  );
  const monthly = Math.round(
    eligible.reduce(
      (sum, employee) =>
        sum +
        monthlySalaryFromEmployee({
          salaryCurrent: employee.salaryCurrent ?? 0,
          bonus: employee.bonus ?? 0,
          payFrequency: employee.payFrequency ?? "monthly",
        }),
      0,
    ) * 100,
  ) / 100;

  return {
    monthly,
    employees: eligible.length,
    currency: "USD" as const,
  };
}

export function getTalantonMonthlyCashSeries(): Array<{ month: string; amount: number }> {
  return [
    { month: "2026-03", amount: 3_920_000 },
    { month: "2026-04", amount: 4_010_000 },
    { month: "2026-05", amount: 4_080_000 },
    { month: "2026-06", amount: 4_140_000 },
    { month: "2026-07", amount: TALANTON_CASH_PRIOR_MONTH_USD },
    { month: "2026-08", amount: TALANTON_CASH_BALANCE_USD },
  ];
}
