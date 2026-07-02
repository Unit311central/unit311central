const DEFAULT_SITE_URL = "https://unit311.vercel.app";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : DEFAULT_SITE_URL);

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Unit311";
export const LOGO_PATH = "/images/dronecatalyst-logo-final.svg";
export const SITE_TAGLINE =
  "Official UAS training, certification, and test site operations in Catalonia.";
export const SITE_DESCRIPTION =
  "Unit311 delivers UAS pilot training, regulatory courses, certification support, and hands-on test site operations from an official European UAS test site.";

export const CONTACT = {
  email: "info@barcelonadronecenter.com",
  infoEmail: "info@barcelonadronecenter.com",
  linkedin: "https://www.linkedin.com/company/bcn-drone-center",
  phone: "+34 938 000 000",
  whatsapp: "34938000000",
  location: "Catalonia, Spain · Official UAS Test Site",
} as const;

export const NAV_LINKS = [
  { href: "/inspection", label: "Inspection" },
  { href: "/surveying", label: "Surveying" },
  { href: "/commercial-imaging", label: "Commercial Imaging" },
  { href: "/contact", label: "Contact" },
] as const;

export const SEO_KEYWORDS = [
  "UAS Training Europe",
  "Drone Certification Spain",
  "SORA Training",
  "Unit311",
  "Drone Pilot Course",
  "UAS Test Site",
] as const;
