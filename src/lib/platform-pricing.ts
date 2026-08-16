/** Canonical Professional plan pricing for Unit311 Central (checkout / billing). */

export const PROFESSIONAL_MONTHLY_USD = 1300;
export const PROFESSIONAL_QUARTERLY_USD = PROFESSIONAL_MONTHLY_USD * 3;
export const PROFESSIONAL_ANNUAL_USD = PROFESSIONAL_MONTHLY_USD * 12;

export function formatProfessionalUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export const PROFESSIONAL_MONTHLY_LABEL = formatProfessionalUsd(PROFESSIONAL_MONTHLY_USD);
export const PROFESSIONAL_QUARTERLY_LABEL = formatProfessionalUsd(PROFESSIONAL_QUARTERLY_USD);

/** Checkout / invoice display string used across payment emails and UI. */
export const PROFESSIONAL_QUARTERLY_PAYMENT_LABEL = `US$${PROFESSIONAL_QUARTERLY_USD.toLocaleString("en-US")}`;

/** Public marketing tiers (website proposals — confirmed in writing per client). */
export const MARKETING_CORE_MONTHLY_FROM_USD = 1400;
export const MARKETING_OPERATOR_MONTHLY_FROM_USD = 2500;
export const MARKETING_ENTERPRISE_MONTHLY_FROM_USD = 4000;

export const MARKETING_IMPLEMENTATION_LOW_USD = 1500;
export const MARKETING_IMPLEMENTATION_HIGH_USD = 25000;

/** Annual prepay discount shown on marketing site (e.g. 0.12 = 12% off). */
export const MARKETING_ANNUAL_PREPAY_DISCOUNT = 0.12;

export const MARKETING_CORE_MONTHLY_LABEL = formatProfessionalUsd(MARKETING_CORE_MONTHLY_FROM_USD);
export const MARKETING_OPERATOR_MONTHLY_LABEL = formatProfessionalUsd(
  MARKETING_OPERATOR_MONTHLY_FROM_USD,
);
export const MARKETING_ENTERPRISE_MONTHLY_LABEL = formatProfessionalUsd(
  MARKETING_ENTERPRISE_MONTHLY_FROM_USD,
);
