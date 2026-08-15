import type { ReactNode } from "react";

export type SocialPlatformLayout = "wide" | "square";

export type SocialPlatformDefinition = {
  id: "linkedin" | "instagram" | "twitter";
  name: string;
  handle: string;
  href?: string;
  displayName: string;
  layout: SocialPlatformLayout;
  avatarLabel: string;
  avatarClassName: string;
  accent: string;
  accentBorder: string;
  icon: ReactNode;
  lastPost: {
    date: string;
    preview: string;
    stats: Array<{ label: string; value: string; icon: ReactNode }>;
  };
};

export type SocialWorkspacePackConfig = {
  workspaceKey: string;
  label: string;
  platforms: SocialPlatformDefinition[];
  seoKeywords?: string[];
  ppcCampaigns?: Array<{ name: string; spend: string; clicks: string; conversions: string }>;
};
