import { PARTNER_COUNTRY_NAMES } from "@/lib/partners/countries";

/** Full world country list for Green Desert Client Directory. */
export const GREENDESERT_CLIENT_COUNTRY_OPTIONS = [...PARTNER_COUNTRY_NAMES].sort((a, b) =>
  a.localeCompare(b),
);
