import type { TaxProvider } from "@/lib/payroll/providers/tax-provider";
import { usTaxProvider } from "@/lib/payroll/providers/us-tax-provider";
import { ukTaxProvider } from "@/lib/payroll/providers/uk-tax-provider";

export type CountryPayrollRules = {
  countryCode: string;
  label: string;
  taxProvider: TaxProvider;
  defaultCurrency: string;
  defaultFrequency: "monthly";
};

export const US_COUNTRY_RULES: CountryPayrollRules = {
  countryCode: "US",
  label: "United States",
  taxProvider: usTaxProvider,
  defaultCurrency: "USD",
  defaultFrequency: "monthly",
};

export const GB_COUNTRY_RULES: CountryPayrollRules = {
  countryCode: "GB",
  label: "United Kingdom",
  taxProvider: ukTaxProvider,
  defaultCurrency: "GBP",
  defaultFrequency: "monthly",
};

const REGISTRY: Record<string, CountryPayrollRules> = {
  US: US_COUNTRY_RULES,
  GB: GB_COUNTRY_RULES,
  UK: GB_COUNTRY_RULES,
};

export function getCountryRules(countryCode = "US"): CountryPayrollRules {
  return REGISTRY[countryCode.toUpperCase()] ?? US_COUNTRY_RULES;
}
