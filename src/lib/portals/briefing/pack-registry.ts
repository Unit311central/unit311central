import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  defaultNorthstarDemoPortalsContent,
  sanitizeNorthstarDemoPortalsContent,
} from "@/lib/demo/portals-demo";
import {
  isDemoPortalsAdminUsername,
  isDemoPortalsAllowedUsername,
} from "@/lib/demo/portals-auth";
import { getPortalPackBySlug } from "@/lib/portals/registry";
import type {
  PortalsBriefingAuthConfig,
  PortalsBriefingContentConfig,
} from "@/lib/portals/types";

export type PortalsBriefingPack = {
  slug: string;
  briefing: PortalsBriefingAuthConfig & PortalsBriefingContentConfig;
};

const DEMO_BRIEFING_PACK: PortalsBriefingPack = {
  slug: DEMO_WORKSPACE_SLUG,
  briefing: {
    isAllowedUsername: isDemoPortalsAllowedUsername,
    isAdminUsername: isDemoPortalsAdminUsername,
    loginPath: "/login?next=/portals",
    usesDedicatedPortalsLogin: false,
    contentTable: "demo_portals_page_content",
    defaultContent: defaultNorthstarDemoPortalsContent,
    sanitizeContent: sanitizeNorthstarDemoPortalsContent,
  },
};

const STANDALONE_BRIEFING_PACKS = new Map<string, PortalsBriefingPack>([
  [DEMO_WORKSPACE_SLUG, DEMO_BRIEFING_PACK],
]);

export function getPortalsBriefingPackBySlug(
  workspaceSlug: string | null | undefined,
): PortalsBriefingPack | null {
  const normalized = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;

  const standalone = STANDALONE_BRIEFING_PACKS.get(normalized);
  if (standalone) return standalone;

  const pack = getPortalPackBySlug(normalized);
  if (!pack?.briefing) return null;
  return { slug: pack.slug, briefing: pack.briefing };
}
