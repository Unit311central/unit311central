/** Green Desert HR location options (Employment tab). */
export const GREENDESERT_HR_LOCATIONS = ["Jeddah", "Riyadh"] as const;

export type GreenDesertHrLocation = (typeof GREENDESERT_HR_LOCATIONS)[number];

export const GREENDESERT_DEFAULT_HR_LOCATION: GreenDesertHrLocation = "Jeddah";
