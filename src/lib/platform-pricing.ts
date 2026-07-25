/** Canonical Professional plan pricing for Unit311 Central. */

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
