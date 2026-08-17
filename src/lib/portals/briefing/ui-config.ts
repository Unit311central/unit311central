import type { ReactNode } from "react";

import type { PortalsBriefingCredentialBlock } from "@/components/portals/briefing-ui";
import type { PortalsEditableContent } from "@/lib/portals/types";

export type PortalsBriefingHeaderLayout = "onwardair" | "talanton" | "abhi" | "northstar";

export type PortalsBriefingUiConfig = {
  workspaceSlug: string;
  headerLayout: PortalsBriefingHeaderLayout;
  shellClassName?: string;
  eyebrow?: string;
  title: string;
  titleClassName?: string;
  description: ReactNode;
  customModulesTitle?: string;
  /** When false, hide the customised-modules column (Northstar demo uses two columns). */
  showCustomModulesColumn?: boolean;
  footerLabel: string;
  credentials: PortalsBriefingCredentialBlock[];
  loginRedirectOnAuthFailure: string;
  loginRedirectOnLogout: string;
  defaultContent: () => PortalsEditableContent;
  showLogoutInHeader?: boolean;
  showUsernameInHeader?: boolean;
  showSwitchAccountFooter?: boolean;
};
