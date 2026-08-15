import type { ReactNode } from "react";

import type { PortalsBriefingCredentialBlock } from "@/components/portals/briefing-ui";
import type { PortalsEditableContent } from "@/lib/portals/types";

export type PortalsBriefingHeaderLayout = "onwardair" | "talanton" | "abhi";

export type PortalsBriefingUiConfig = {
  workspaceSlug: string;
  headerLayout: PortalsBriefingHeaderLayout;
  shellClassName?: string;
  eyebrow?: string;
  title: string;
  titleClassName?: string;
  description: ReactNode;
  customModulesTitle: string;
  footerLabel: string;
  credentials: PortalsBriefingCredentialBlock[];
  loginRedirectOnAuthFailure: string;
  loginRedirectOnLogout: string;
  defaultContent: () => PortalsEditableContent;
  showLogoutInHeader?: boolean;
  showUsernameInHeader?: boolean;
  showSwitchAccountFooter?: boolean;
};
