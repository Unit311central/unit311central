import AbhiLogoMark from "@/components/layout/AbhiLogoMark";
import OnwardAirLogoMark from "@/components/layout/OnwardAirLogoMark";
import TalantonLogoMark from "@/components/layout/TalantonLogoMark";
import type { PortalsBriefingUiConfig } from "@/lib/portals/briefing/ui-config";
import { getPortalPackBySlug } from "@/lib/portals/registry";
import { defaultAbhiPortalsContent } from "@/lib/abhi/portals-demo";
import { defaultOnwardAirPortalsContent } from "@/lib/onwardair/portals-demo";
import { defaultTalantonPortalsContent } from "@/lib/talanton/portals-demo";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

const onwardAirBriefingUiConfig: PortalsBriefingUiConfig = {
  workspaceSlug: ONWARDAIR_SLUG,
  headerLayout: "onwardair",
  shellClassName: "bg-[#07111f]",
  eyebrow: "Pre-demo briefing",
  title: "OnwardAir on Unit311 Central",
  description: (
    <>
      Credential and capability overview for your demonstration. Sign in with{" "}
      <span className="text-white/90">demo@onwardair.tech</span> to view, or{" "}
      <span className="text-white/90">admin@onwardair.tech</span> to edit columns 2 and 3.
    </>
  ),
  customModulesTitle: "OnwardAir Customised Modules",
  footerLabel: "Confidential demonstration material for OnwardAir",
  showLogoutInHeader: true,
  showUsernameInHeader: true,
  showSwitchAccountFooter: true,
  loginRedirectOnAuthFailure: "/login?next=%2Fportals",
  loginRedirectOnLogout: "/login?next=%2Fportals",
  defaultContent: defaultOnwardAirPortalsContent,
  credentials: [
    {
      title: "OnwardAir Main Platform",
      url: "https://onwardair.unit311central.com/login",
      urlLabel: "onwardair.unit311central.com/login",
      username: "admin@onwardair.tech",
      password: "Houston1999$",
    },
    {
      title: "OnwardAir Board Portal",
      url: "https://onwardair.unit311central.com/board",
      urlLabel: "onwardair.unit311central.com/board",
      username: "board@onwardair.tech",
      password: "boardportal2040$",
    },
    {
      title: "Client Portal — Coastal Freight Partners",
      url: "https://onwardair.unit311central.com/coastalfreightpartners.com",
      urlLabel: "onwardair.unit311central.com/coastalfreightpartners.com",
      username: "demo@coastalfreightpartners.com",
      password: "Coastalfreight1$",
    },
    {
      title: "OnwardAir Portals Briefing",
      url: "https://onwardair.unit311central.com/portals",
      urlLabel: "onwardair.unit311central.com/portals",
      username: "demo@onwardair.tech",
      password: "Houston1999$",
    },
  ],
};

const talantonBriefingUiConfig: PortalsBriefingUiConfig = {
  workspaceSlug: TALANTON_IMPACT_SLUG,
  headerLayout: "talanton",
  shellClassName: "bg-[#07111f]",
  title: "Talantom Impact Overview Portal",
  titleClassName: "whitespace-nowrap",
  description:
    "A Overview portals page for Harry Turner for Unit311 Central customised Talanton Impact Platform.",
  customModulesTitle: "Talanton Customised Modules",
  footerLabel: "Confidential demonstration material for Talanton Impact",
  showSwitchAccountFooter: true,
  loginRedirectOnAuthFailure: "/portals/login",
  loginRedirectOnLogout: "/portals/login",
  defaultContent: defaultTalantonPortalsContent,
  credentials: [
    {
      title: "TALANTON IMPACT MAIN PLATFORM LOGIN",
      url: "https://talantonimpact.unit311central.com/login",
      urlLabel: "talantonimpact.unit311central.com/login",
      username: "demo@talantonimpact.com",
      password: "Africa1999$",
    },
    {
      title: "TALANTON IMPACT BOARD PORTAL LOGIN",
      url: "https://talantonimpact.unit311central.com/board",
      urlLabel: "talantonimpact.unit311central.com/board",
      username: "board@talantonimpact.com",
      password: "Africa1999$",
    },
    {
      title: "TALANTON IMPACT EXAMPLE CLIENT PORTAL LOGIN",
      url: "https://talantonimpact.unit311central.com/arcrideglobal",
      urlLabel: "talantonimpact.unit311central.com/arcrideglobal",
      username: "demo@arcrideglobal.com",
      password: "Africa1999$",
    },
  ],
};

const abhiBriefingUiConfig: PortalsBriefingUiConfig = {
  workspaceSlug: ABHI_SLUG,
  headerLayout: "abhi",
  shellClassName: "bg-[#07111f]",
  title: "ABHI Overview Portal",
  titleClassName: "whitespace-nowrap",
  description:
    "An overview portal page for Peter Ellingworth for Unit311 Central customised ABHI Platform.",
  customModulesTitle: "ABHI Customised Modules",
  footerLabel: "Confidential demonstration material for ABHI",
  loginRedirectOnAuthFailure: "/login?next=%2Fportals",
  loginRedirectOnLogout: "/login?next=%2Fportals",
  defaultContent: defaultAbhiPortalsContent,
  credentials: [
    {
      title: "ABHI Platform Login",
      url: "https://abhi.unit311central.com/login",
      urlLabel: "abhi.unit311central.com/login",
      username: "demo@abhi.org.uk",
      password: "London1999$",
    },
    {
      title: "Board Portal Login",
      url: "https://abhi.unit311central.com/board",
      urlLabel: "abhi.unit311central.com/board",
      username: "board@abhi.org.uk",
      password: "London1999$",
    },
    {
      title: "Member Portal Access — Demo Centrak",
      url: "https://abhi.unit311central.com/centrak",
      urlLabel: "abhi.unit311central.com/centrak",
      username: "demo@centrak.com",
      password: "London1999$",
    },
    {
      title: "Member Portal Access — Abbott Diagnostics",
      url: "https://abhi.unit311central.com/abbotdiagnostics",
      urlLabel: "abhi.unit311central.com/abbotdiagnostics",
      username: "demo@abbotdiagnostics.com",
      password: "London1999$",
    },
  ],
};

const CONFIGS: Record<string, PortalsBriefingUiConfig> = {
  [ONWARDAIR_SLUG]: onwardAirBriefingUiConfig,
  [TALANTON_IMPACT_SLUG]: talantonBriefingUiConfig,
  [ABHI_SLUG]: abhiBriefingUiConfig,
};

export function getPortalsBriefingUiConfig(
  workspaceSlug: string | null | undefined,
): PortalsBriefingUiConfig | null {
  const pack = getPortalPackBySlug(workspaceSlug);
  if (!pack) return null;
  return CONFIGS[pack.slug] ?? null;
}

export {
  abhiBriefingUiConfig,
  onwardAirBriefingUiConfig,
  talantonBriefingUiConfig,
  AbhiLogoMark,
  OnwardAirLogoMark,
  TalantonLogoMark,
};
