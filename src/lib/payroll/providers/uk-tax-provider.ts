import type { TaxProvider } from "@/lib/payroll/providers/tax-provider";
import { applyPercentageTax } from "@/lib/payroll/providers/tax-provider";

/** V1 UK flat-percentage provider — PAYE + NI mapped onto shared tax columns. */
export const ukTaxProvider: TaxProvider = {
  id: "uk-default",
  label: "United Kingdom (PAYE / NI configurable %)",
  calculateEmployeeTaxes(gross, rates) {
    return applyPercentageTax(gross, rates);
  },
};
