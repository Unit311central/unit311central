/**
 * PAILEX client portal on WOLF Central — programme navigation and section routing.
 */

export type WolfPailexPortalSection =
  | "dashboard"
  | "work-packages"
  | "files"
  | "support"
  | "communications";

export type WolfPailexPortalNavItem = {
  id: WolfPailexPortalSection;
  label: string;
  hrefSuffix: string;
};

export const WOLF_PAILEX_PORTAL_NAV: readonly WolfPailexPortalNavItem[] = [
  { id: "dashboard", label: "Project Dashboard", hrefSuffix: "" },
  { id: "work-packages", label: "Work package items", hrefSuffix: "/work-packages" },
  { id: "files", label: "File Repository", hrefSuffix: "/files" },
  { id: "support", label: "Support", hrefSuffix: "/support" },
  { id: "communications", label: "Communications", hrefSuffix: "/communications" },
];

export function wolfPailexPortalHref(companyPath: string, hrefSuffix: string) {
  return `/${companyPath}${hrefSuffix}`;
}

export function parseWolfPailexPortalSection(section: string[] | undefined): WolfPailexPortalSection | null {
  const parts = (section ?? []).map((part) => part.toLowerCase()).filter(Boolean);
  if (parts.length === 0) return "dashboard";
  if (parts[0] === "work-packages") return "work-packages";
  if (parts[0] === "files") return "files";
  if (parts[0] === "support") return "support";
  if (parts[0] === "communications") return "communications";
  return null;
}

export const WOLF_PAILEX_PROPOSAL_FILE = {
  name: "Project Proposal.pdf",
  location: "File Explorer → External Files",
  status: "Pending upload",
  note: "The programme proposal will appear here once published to External Files.",
} as const;
