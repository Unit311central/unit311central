/**
 * Per-member portal login backdrops on abhi.unit311central.com/{path}/login.
 */

export type AbhiMemberPortalLoginBrand = {
  backgroundImage: string;
  backgroundImageClassName: string;
  overlayClassName: string;
  backgroundImageQuality: number;
};

const SUBTLE_COVER =
  "object-cover object-[center_38%] opacity-[0.44] sm:object-[center_36%] sm:opacity-[0.5]";

const ABHI_PORTAL_OVERLAY =
  "absolute inset-0 bg-gradient-to-b from-[#1a0a12]/58 via-[#07111f]/72 to-[#020617]/88";

const MEMBER_PORTAL_LOGIN_BRANDS: Record<string, AbhiMemberPortalLoginBrand> = {
  abbotdiagnostics: {
    backgroundImage: "/images/portals/abbotdiagnostics-login-bg.jpg",
    backgroundImageClassName: SUBTLE_COVER,
    overlayClassName: ABHI_PORTAL_OVERLAY,
    backgroundImageQuality: 95,
  },
};

export function getAbhiMemberPortalLoginBrand(
  companyPath: string,
): AbhiMemberPortalLoginBrand | null {
  const key = String(companyPath ?? "")
    .trim()
    .toLowerCase();
  return MEMBER_PORTAL_LOGIN_BRANDS[key] ?? null;
}
