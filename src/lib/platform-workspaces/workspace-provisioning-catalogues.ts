/**
 * Authoritative dropdown catalogues for the Internal Workspaces provisioning wizard.
 * Reuses Sales / Onboarding / Discovery timezone options — do not duplicate lists.
 */

import {
  DEFAULT_FOUNDER_BOOKING_TIMEZONE,
  FOUNDER_BOOKING_TIMEZONES,
  type FounderBookingTimezone,
} from "@/lib/founder-booking/timezones";
import { ISO3166_ALPHA2_REGION_CODES } from "@/lib/platform-workspaces/iso3166-alpha2-regions";

/** Same catalogue as Sales / Onboarding Discovery meetings and calendar booking. */
export const WORKSPACE_PROVISIONING_TIMEZONES: readonly FounderBookingTimezone[] =
  FOUNDER_BOOKING_TIMEZONES;

export const WORKSPACE_PROVISIONING_DEFAULT_TIMEZONE = DEFAULT_FOUNDER_BOOKING_TIMEZONE;

const WORKSPACE_PROVISIONING_CURRENCY_PRIORITY = ["USD", "GBP"] as const;

/** ISO 4217 currencies — USD and GBP first, then remaining codes alphabetically. */
export function getWorkspaceProvisioningCurrencies(): string[] {
  const supported = Intl.supportedValuesOf("currency");
  const priority = WORKSPACE_PROVISIONING_CURRENCY_PRIORITY.filter((code) =>
    supported.includes(code),
  );
  const remainder = supported
    .filter((code) => !priority.includes(code as (typeof priority)[number]))
    .sort((a, b) => a.localeCompare(b));
  return [...priority, ...remainder];
}

function isoRegionCodes(): string[] {
  try {
    return Intl.supportedValuesOf("region").filter((code) => /^[A-Z]{2}$/.test(code));
  } catch {
    return [...ISO3166_ALPHA2_REGION_CODES];
  }
}

/** Worldwide country names via Intl — complete ISO 3166-1 alpha-2 set. */
export function getWorkspaceProvisioningCountries(): string[] {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return isoRegionCodes()
    .map((code) => regionNames.of(code))
    .filter((name): name is string => Boolean(name && name.trim()))
    .sort((a, b) => a.localeCompare(b));
}
