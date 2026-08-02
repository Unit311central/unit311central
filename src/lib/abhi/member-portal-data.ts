/**
 * ABHI member portal — navigation + section routing.
 */

export type AbhiMemberPortalSection =
  | "dashboard"
  | "membership"
  | "events"
  | "working-groups"
  | "funding"
  | "assistant";

export type AbhiMemberNavItem = {
  id: AbhiMemberPortalSection;
  label: string;
  hrefSuffix: string;
};

export type AbhiMemberNavGroup = {
  id: string;
  label: string | null;
  items: AbhiMemberNavItem[];
};

export const ABHI_MEMBER_NAV: readonly AbhiMemberNavGroup[] = [
  {
    id: "home",
    label: null,
    items: [{ id: "dashboard", label: "Dashboard", hrefSuffix: "" }],
  },
  {
    id: "membership",
    label: "Membership",
    items: [
      { id: "membership", label: "Membership Overview", hrefSuffix: "/membership" },
      { id: "events", label: "Events & Programmes", hrefSuffix: "/membership/events" },
      {
        id: "working-groups",
        label: "Working Groups",
        hrefSuffix: "/membership/working-groups",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth & Funding",
    items: [
      { id: "funding", label: "Funding & Opportunities", hrefSuffix: "/funding" },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [{ id: "assistant", label: "Member Assistant", hrefSuffix: "/assistant" }],
  },
] as const;

export function memberPortalHref(companyPath: string, hrefSuffix: string) {
  return `/${companyPath}${hrefSuffix}`;
}

export function parseMemberPortalSection(
  section: string[] | undefined,
): AbhiMemberPortalSection | null {
  const parts = (section ?? []).map((p) => p.toLowerCase()).filter(Boolean);
  if (parts.length === 0) return "dashboard";
  if (parts[0] === "funding") return "funding";
  if (parts[0] === "assistant") return "assistant";
  if (parts[0] === "membership") {
    if (parts[1] === "events") return "events";
    if (parts[1] === "working-groups" || parts[1] === "workinggroups") {
      return "working-groups";
    }
    return "membership";
  }
  return null;
}

export type AbhiMemberEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
};

export const ABHI_MEMBER_EVENTS: AbhiMemberEvent[] = [
  {
    id: "evt-1",
    title: "ABHI Digital Health Conference 2026",
    date: "2026-09-16",
    location: "London, UK",
  },
  {
    id: "evt-2",
    title: "WHX Dubai 2027 — UK Pavilion",
    date: "2027-02-09",
    location: "Dubai World Trade Centre",
  },
  {
    id: "evt-3",
    title: "ABHI Member Group Meetings — Q4 briefing",
    date: "2026-10-08",
    location: "Virtual",
  },
];

export function formatMemberPortalDate(iso: string) {
  const date = new Date(`${iso}T09:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
