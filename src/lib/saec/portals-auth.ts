/** OmniTransit external portal credential login — username allow-list. */

export const OMNITRANSIT_PORTALS_DEMO_USERNAME = "demo@omnitransit.com";

export function isOmnitransitPortalsAllowedUsername(username: string | null | undefined): boolean {
  const normalized = String(username ?? "")
    .trim()
    .toLowerCase();
  return normalized === OMNITRANSIT_PORTALS_DEMO_USERNAME;
}
