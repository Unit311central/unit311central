/**
 * SAEC payroll API fixtures (ZAR) — used when live payroll tables are empty.
 */

import { SAEC_MONTHLY_OUTGOINGS_SERIES } from "@/lib/saec/saec-financials";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";
import type {
  PayrollDashboardSnapshot,
  PayrollEmployeeProfile,
  PayrollRun,
  PayrollSettings,
} from "@/lib/payroll/types";
import { DEFAULT_PAYROLL_SETTINGS } from "@/lib/payroll/types";

const CURRENCY = SAEC_REPORTING_CURRENCY;
const WORKSPACE_ID = "saec-demo";

function monthlyPayrollGross(): number {
  const augustOpex =
    SAEC_MONTHLY_OUTGOINGS_SERIES.find((row) => row.month === "2026-08")?.amount ?? 5_100_000;
  return Math.round(augustOpex * 0.42);
}

export function getSaecPayrollSettings(): PayrollSettings {
  return {
    workspaceId: WORKSPACE_ID,
    ...DEFAULT_PAYROLL_SETTINGS,
    defaultCurrency: CURRENCY,
    countryCode: "ZA",
    defaultTaxState: "GP",
    federalTaxPct: 26,
    stateTaxPct: 0,
    socialSecurityPct: 1,
    medicarePct: 0,
    employerPayrollPct: 1,
    payrollFrequency: "monthly",
    payDay: 28,
    bonusPayMonth: 3,
    bonusPayDay: 28,
    updatedAt: "2026-08-16T10:00:00.000Z",
  };
}

export function getSaecPayrollDashboard(): PayrollDashboardSnapshot {
  const monthlyGross = monthlyPayrollGross();
  const settings = getSaecPayrollSettings();
  const employerTax = Math.round(monthlyGross * (settings.employerPayrollPct / 100));
  const employeeTax = Math.round(monthlyGross * 0.26);
  const net = monthlyGross - employeeTax;
  const employeeCount = 58;

  const recentRuns: PayrollRun[] = [
    {
      id: "saec-run-jul",
      workspaceId: WORKSPACE_ID,
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      payDate: "2026-07-28",
      status: "paid",
      employeeCount,
      grossPayroll: monthlyGross,
      employeeTax,
      employerTax,
      netPayroll: net,
      currency: CURRENCY,
      journalEntryId: "saec-je-pay-2026-07",
      paymentJournalEntryId: "saec-je-pay-2026-07-paid",
      wiseBatchId: null,
      wisePaymentStatus: "paid",
      notes: "July payroll — national engineering & field teams",
      createdAt: "2026-07-25T09:00:00.000Z",
      updatedAt: "2026-07-28T08:30:00.000Z",
      approvedAt: "2026-07-26T11:00:00.000Z",
      paidAt: "2026-07-28T08:30:00.000Z",
    },
    {
      id: "saec-run-aug",
      workspaceId: WORKSPACE_ID,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      payDate: "2026-08-28",
      status: "processing",
      employeeCount,
      grossPayroll: monthlyGross,
      employeeTax,
      employerTax,
      netPayroll: net,
      currency: CURRENCY,
      journalEntryId: null,
      paymentJournalEntryId: null,
      wiseBatchId: null,
      wisePaymentStatus: "pending",
      notes: "August payroll — approvals in progress",
      createdAt: "2026-08-20T09:00:00.000Z",
      updatedAt: "2026-08-20T09:00:00.000Z",
      approvedAt: null,
      paidAt: null,
    },
  ];

  return {
    monthlyGrossPayroll: monthlyGross,
    estimatedEmployerTaxes: employerTax,
    estimatedEmployeeTaxWithheld: employeeTax,
    estimatedNetPayroll: net,
    nextPayrollDate: "2026-08-28",
    nextBonusPayDate: "2027-03-28",
    totalBonusDueThisYear: 4_850_000,
    payrollRunStatus: "processing",
    employeesPaid: employeeCount - 2,
    pendingPayroll: 2,
    averageSalary: 720_000,
    currency: CURRENCY,
    employeeCount,
    trend: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((month, index) => {
      const gross = Math.round(monthlyGross * (0.96 + index * 0.01));
      const employer = Math.round(gross * 0.01);
      return {
        month,
        gross,
        net: Math.round(gross * (0.72 + index * 0.008)),
        employerTax: employer,
      };
    }),
    departmentBreakdown: [
      { department: "Engineering", gross: Math.round(monthlyGross * 0.38), net: Math.round(monthlyGross * 0.28), employees: 22 },
      { department: "Installation", gross: Math.round(monthlyGross * 0.24), net: Math.round(monthlyGross * 0.18), employees: 14 },
      { department: "Sales", gross: Math.round(monthlyGross * 0.12), net: Math.round(monthlyGross * 0.09), employees: 8 },
      { department: "Operations", gross: Math.round(monthlyGross * 0.16), net: Math.round(monthlyGross * 0.12), employees: 10 },
      { department: "Management", gross: Math.round(monthlyGross * 0.1), net: Math.round(monthlyGross * 0.07), employees: 8 },
    ],
    upcomingCalendar: [
      { date: "2026-08-28", label: "August payroll run", amount: monthlyGross },
      { date: "2027-03-28", label: "Annual bonus payout", amount: 4_850_000 },
    ],
    recentRuns,
  };
}

export function getSaecEmployeePayrollProfile(employeeId: string): {
  profile: PayrollEmployeeProfile;
  calculation: {
    grossMonthly: number;
    netMonthly: number;
    employeeTax: number;
    employerTax: number;
  };
} | null {
  const dashboard = getSaecPayrollDashboard();
  const monthlyGross = dashboard.monthlyGrossPayroll / dashboard.employeeCount;
  const employeeTax = Math.round(monthlyGross * 0.26);
  const employerTax = Math.round(monthlyGross * 0.01);
  const profile: PayrollEmployeeProfile = {
    id: `saec-pay-${employeeId}`,
    workspaceId: WORKSPACE_ID,
    employeeId,
    annualSalary: Math.round(monthlyGross * 12),
    monthlySalary: Math.round(monthlyGross),
    hourlyRate: null,
    bonus: 45_000,
    commission: 0,
    payrollFrequency: "monthly",
    currency: CURRENCY,
    taxState: "GP",
    federalTaxPct: null,
    stateTaxPct: null,
    socialSecurityPct: null,
    medicarePct: null,
    employerPayrollPct: null,
    payrollStatus: "active",
    bankAccount: "****7421",
    routingNumber: "****",
    payrollEmployeeId: employeeId.slice(0, 8),
    taxId: "****",
    hireDate: "2018-06-01",
    terminationDate: null,
    manager: "Dewald Lassen",
    department: "Engineering",
    costCentre: "Engineering",
    updatedAt: "2026-08-16T10:00:00.000Z",
  };
  return {
    profile,
    calculation: {
      grossMonthly: Math.round(monthlyGross),
      netMonthly: Math.round(monthlyGross - employeeTax),
      employeeTax,
      employerTax,
    },
  };
}
