import { SAEC_COMPANY_NAME, SAEC_COUNTRY, SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";

export const SAEC_LEGAL_NAME = "South African Elevator Company";
export const SAEC_ABBREVIATION = SAEC_COMPANY_NAME;
export const SAEC_PRIMARY_CURRENCY = SAEC_REPORTING_CURRENCY;

export const SAEC_HEAD_OFFICE = {
  id: "saec-office-pretoria-hq",
  name: "SAEC Head Office",
  addressLine: "Waterkloof Golf Club, Eclipse Road",
  city: "Pretoria",
  region: "Gauteng",
  country: SAEC_COUNTRY,
  phone: "+27 12 460 7500",
  timezone: "Africa/Johannesburg",
} as const;

/** Historical seed round — original USD; display in ZAR on SAEC surfaces. */
export const SAEC_HISTORICAL_SEED_ROUND = {
  label: "Seed round (closed)",
  closedYearsAgo: 5,
  originalUsd: 5_000_000,
  /** Approximate ZAR equivalent for demo display (label as converted). */
  displayZar: 92_500_000,
  displayLabel: "US$5.0M original · approx. R92.5M (demo conversion)",
} as const;

export const SAEC_DEMO_INVESTOR_COUNT = 5;
export const SAEC_DEMO_EMPLOYEE_TARGET = 50;
