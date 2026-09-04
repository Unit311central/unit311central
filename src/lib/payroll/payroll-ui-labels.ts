/**
 * Country-aware payroll UI copy. Storage columns stay US-shaped
 * (federal / social_security / …); labels remap for GB/AU/etc.
 */
import { getCountryRules } from "@/lib/payroll/country-rules/us";

export type PayrollTaxFieldKey =
  | "federalTaxPct"
  | "stateTaxPct"
  | "socialSecurityPct"
  | "medicarePct"
  | "employerPayrollPct";

export type PayrollUiLabels = {
  countryCode: string;
  countryLabel: string;
  currencyHint: string;
  settingsBlurb: string;
  taxRegionLabel: string;
  employeeTaxRegionLabel: string;
  employeeTaxTotal: string;
  employerTaxTotal: string;
  calculation: {
    federalTax: string;
    stateTax: string;
    socialSecurity: string;
    medicare: string;
    employerTax: string;
  };
  /** Settings / override fields; omit keys the country does not surface. */
  rateFields: Array<{ key: PayrollTaxFieldKey; label: string }>;
  bankSecondaryLabel: string;
};

const US_LABELS: PayrollUiLabels = {
  countryCode: "US",
  countryLabel: "United States",
  currencyHint: "USD",
  settingsBlurb:
    "Applies to all employees unless overridden on the employee Payroll tab. V1: United States, monthly, USD.",
  taxRegionLabel: "Default tax state",
  employeeTaxRegionLabel: "Tax state",
  employeeTaxTotal: "Employee tax",
  employerTaxTotal: "Employer tax",
  calculation: {
    federalTax: "Federal tax",
    stateTax: "State tax",
    socialSecurity: "Social Security",
    medicare: "Medicare",
    employerTax: "Employer tax",
  },
  rateFields: [
    { key: "federalTaxPct", label: "Federal tax %" },
    { key: "stateTaxPct", label: "State tax %" },
    { key: "socialSecurityPct", label: "Social Security %" },
    { key: "medicarePct", label: "Medicare %" },
    { key: "employerPayrollPct", label: "Employer payroll %" },
  ],
  bankSecondaryLabel: "Routing number",
};

const GB_LABELS: PayrollUiLabels = {
  countryCode: "GB",
  countryLabel: "United Kingdom",
  currencyHint: "GBP",
  settingsBlurb:
    "Applies to all employees unless overridden on the employee Payroll tab. V1: United Kingdom — income tax (PAYE), National Insurance, monthly, GBP.",
  taxRegionLabel: "Tax region (ENG / SCT / WLS / NIR)",
  employeeTaxRegionLabel: "Tax region",
  employeeTaxTotal: "PAYE & employee NI",
  employerTaxTotal: "Employer NI",
  calculation: {
    federalTax: "Income tax (PAYE)",
    stateTax: "Regional / additional",
    socialSecurity: "Employee NI",
    medicare: "Other deduction",
    employerTax: "Employer NI",
  },
  rateFields: [
    { key: "federalTaxPct", label: "Income tax / PAYE %" },
    { key: "socialSecurityPct", label: "Employee National Insurance %" },
    { key: "employerPayrollPct", label: "Employer National Insurance %" },
  ],
  bankSecondaryLabel: "Sort code",
};

const AU_LABELS: PayrollUiLabels = {
  ...US_LABELS,
  countryCode: "AU",
  countryLabel: "Australia",
  currencyHint: "AUD",
  settingsBlurb:
    "Applies to all employees unless overridden on the employee Payroll tab. V1: Australia — PAYG / super mapping, monthly, AUD.",
  taxRegionLabel: "Default tax state",
  employeeTaxRegionLabel: "Tax state",
  employeeTaxTotal: "Employee tax",
  employerTaxTotal: "Employer on-cost",
  calculation: {
    federalTax: "PAYG tax",
    stateTax: "State / payroll tax share",
    socialSecurity: "Employee contribution",
    medicare: "Medicare levy",
    employerTax: "Super / employer on-cost",
  },
  rateFields: [
    { key: "federalTaxPct", label: "PAYG tax %" },
    { key: "stateTaxPct", label: "State / payroll tax %" },
    { key: "socialSecurityPct", label: "Employee contribution %" },
    { key: "medicarePct", label: "Medicare levy %" },
    { key: "employerPayrollPct", label: "Employer on-cost %" },
  ],
  bankSecondaryLabel: "BSB",
};

const SA_LABELS: PayrollUiLabels = {
  countryCode: "SA",
  countryLabel: "Saudi Arabia",
  currencyHint: "USD",
  settingsBlurb:
    "Applies to all employees unless overridden on the employee Payroll tab. V1: Saudi Arabia — GOSI contributions, monthly, USD salaries.",
  taxRegionLabel: "GOSI region",
  employeeTaxRegionLabel: "GOSI region",
  employeeTaxTotal: "Employee GOSI",
  employerTaxTotal: "Employer GOSI",
  calculation: {
    federalTax: "Income tax (Zakat / withholding)",
    stateTax: "Regional levy",
    socialSecurity: "Employee GOSI",
    medicare: "Other deduction",
    employerTax: "Employer GOSI",
  },
  rateFields: [
    { key: "socialSecurityPct", label: "Employee GOSI %" },
    { key: "employerPayrollPct", label: "Employer GOSI %" },
  ],
  bankSecondaryLabel: "IBAN",
};

const BY_COUNTRY: Record<string, PayrollUiLabels> = {
  US: US_LABELS,
  GB: GB_LABELS,
  UK: GB_LABELS,
  AU: AU_LABELS,
  SA: SA_LABELS,
};

/** Resolve UI country from settings — also infer GB from GBP / ENG / UK tax regions. */
export function resolvePayrollUiCountry(input?: {
  countryCode?: string | null;
  defaultCurrency?: string | null;
  defaultTaxState?: string | null;
} | null): string {
  const code = String(input?.countryCode ?? "")
    .trim()
    .toUpperCase();
  if (code && BY_COUNTRY[code]) return code === "UK" ? "GB" : code;

  const currency = String(input?.defaultCurrency ?? "")
    .trim()
    .toUpperCase();
  if (currency === "GBP") return "GB";

  const region = String(input?.defaultTaxState ?? "")
    .trim()
    .toUpperCase();
  if (["ENG", "SCT", "WLS", "NIR", "UK", "GB"].includes(region)) return "GB";

  if (currency === "AUD") return "AU";
  if (currency === "USD" && ["SA", "KSA", "SAU"].includes(region)) return "SA";
  if (["SA", "KSA", "SAU"].includes(code)) return "SA";
  return code || "US";
}

export function getPayrollUiLabels(
  countryCodeOrSettings?:
    | string
    | null
    | {
        countryCode?: string | null;
        defaultCurrency?: string | null;
        defaultTaxState?: string | null;
      },
): PayrollUiLabels {
  const code =
    typeof countryCodeOrSettings === "object" && countryCodeOrSettings !== null
      ? resolvePayrollUiCountry(countryCodeOrSettings)
      : resolvePayrollUiCountry({ countryCode: countryCodeOrSettings });

  if (BY_COUNTRY[code]) return BY_COUNTRY[code];
  const rules = getCountryRules(code);
  return {
    ...US_LABELS,
    countryCode: rules.countryCode,
    countryLabel: rules.label,
    currencyHint: rules.defaultCurrency,
    settingsBlurb: `Applies to all employees unless overridden on the employee Payroll tab. V1: ${rules.label}, monthly, ${rules.defaultCurrency}.`,
  };
}

export function overrideRateLabel(baseLabel: string): string {
  return `${baseLabel} (override)`;
}
