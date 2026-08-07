/**
 * Per–portfolio-company login backdrops on talantonimpact.unit311central.com/{path}/login.
 * Falls back to a solid dark shell when a company has no branded image yet.
 */

export type CompanyPortalLoginBrand = {
  backgroundImage: string;
  backgroundImageClassName: string;
  overlayClassName: string;
  backgroundImageQuality: number;
};

/** Subtle full-bleed — photo stays readable but never fights the login card. */
const SUBTLE_COVER =
  "object-cover object-center opacity-[0.38] sm:opacity-[0.42]";

const DARK_GREEN_OVERLAY =
  "absolute inset-0 bg-gradient-to-b from-[#041410]/55 via-[#061a14]/68 to-[#020617]/88";

const COMPANY_PORTAL_LOGIN_BRANDS: Record<string, CompanyPortalLoginBrand> = {
  arcrideglobal: {
    backgroundImage: "/images/workspaces/arc-ride-portal-login-bg.jpg",
    backgroundImageClassName: SUBTLE_COVER,
    overlayClassName: DARK_GREEN_OVERLAY,
    backgroundImageQuality: 92,
  },
};

export function getCompanyPortalLoginBrand(
  companyPath: string,
): CompanyPortalLoginBrand | null {
  const key = String(companyPath ?? "")
    .trim()
    .toLowerCase();
  return COMPANY_PORTAL_LOGIN_BRANDS[key] ?? null;
}
