/** ABHI pre-demo portals information page helpers. */

export const ABHI_DEMO_PLATFORM_USERNAME = "demo@abhi.org.uk";

export function isAbhiDemoPlatformUsername(username: string | null | undefined): boolean {
  return (
    String(username ?? "")
      .trim()
      .toLowerCase() === ABHI_DEMO_PLATFORM_USERNAME
  );
}
