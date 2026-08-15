"use client";

import type { ReactNode } from "react";
import { Eye, Heart, MessageCircle, Repeat2, Share2, ThumbsUp } from "lucide-react";

import { ABHI_LINKEDIN_URL, ABHI_X_URL } from "@/lib/abhi-surface";
import { resolveSocialWorkspacePackId } from "@/lib/marketing/social/resolve-workspace-pack";
import type { SocialWorkspacePackId } from "@/lib/marketing/permissions";
type PostStat = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

type LastPost = {
  date: string;
  preview: string;
  stats: PostStat[];
};

export type SocialPlatformConfig = {
  id: "linkedin" | "instagram" | "twitter";
  name: string;
  handle: string;
  /** External profile URL ÔÇö when set, the handle links out instead of being static text. */
  href?: string;
  /** Display name shown on the mocked post preview card. */
  displayName: string;
  /** "wide" mimics a LinkedIn/X feed post; "square" mimics an Instagram grid post. */
  layout: "wide" | "square";
  avatarLabel: string;
  avatarClassName: string;
  accent: string;
  accentBorder: string;
  icon: React.ReactNode;
  lastPost: LastPost;
};

const INTERNAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "@bcndrone",
    displayName: "BCN Drone",
    layout: "wide",
    avatarLabel: "BC",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "12 Mar 2026 ┬À 09:15",
      preview:
        "Precision aerial surveying across Catalonia ÔÇö Matrice 4T fleet delivering orthomosaics and DSM layers for infrastructure clients.",
      stats: [
        { label: "Impressions", value: "4.2K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "86", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "14", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "9", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@bcndrone",
    displayName: "@bcndrone",
    layout: "square",
    avatarLabel: "IG",
    avatarClassName: "rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold",
    accent: "from-fuchsia-500/20 via-pink-500/15 to-amber-500/10",
    accentBorder: "border-pink-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    lastPost: {
      date: "10 Mar 2026 ┬À 18:40",
      preview:
        "Golden hour over the port ÔÇö FPV reel from this week's coastal inspection mission. Full case study on the blog.",
      stats: [
        { label: "Reach", value: "6.8K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "312", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "28", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Saves", value: "47", icon: <Share2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const DEMO_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "@meridianatlas",
    displayName: "Meridian Atlas",
    layout: "wide",
    avatarLabel: "MA",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "18 Jul 2026 ┬À 10:05",
      preview:
        "How Meridian Atlas helps global enterprises modernise cloud estates and operating models ÔÇö new case study from our London practice.",
      stats: [
        { label: "Impressions", value: "9.1K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "214", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "31", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "22", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@meridianatlas",
    displayName: "@meridianatlas",
    layout: "square",
    avatarLabel: "IG",
    avatarClassName: "rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold",
    accent: "from-fuchsia-500/20 via-pink-500/15 to-amber-500/10",
    accentBorder: "border-pink-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    lastPost: {
      date: "14 Jul 2026 ┬À 16:20",
      preview:
        "Behind the scenes at Bishopsgate ÔÇö strategy workshop with our APAC leadership cohort.",
      stats: [
        { label: "Reach", value: "5.4K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "268", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "19", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Saves", value: "41", icon: <Share2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const ABHI_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "ABHI",
    href: ABHI_LINKEDIN_URL,
    displayName: "ABHI",
    layout: "wide",
    avatarLabel: "AB",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "22 Jul 2026 ┬À 11:00",
      preview:
        "ABHI members are heading to WHX Dubai 2027 ÔÇö early bird registration is now open for the UK pavilion.",
      stats: [
        { label: "Impressions", value: "7.6K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "164", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "21", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "18", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    handle: "@UK_ABHI",
    href: ABHI_X_URL,
    displayName: "ABHI",
    layout: "wide",
    avatarLabel: "X",
    avatarClassName: "rounded-full border border-white/15 bg-black text-sm font-bold",
    accent: "from-white/15 to-white/5",
    accentBorder: "border-white/25",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-black text-[10px] font-bold text-white">
        X
      </span>
    ),
    lastPost: {
      date: "19 Jul 2026 ┬À 09:30",
      preview:
        "350 member companies and counting ÔÇö thank you to everyone driving UK HealthTech growth this year. ­ƒÜÇ",
      stats: [
        { label: "Impressions", value: "5.2K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "98", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Replies", value: "12", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "27", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const TALANTON_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "Talanton Impact",
    href: "https://www.linkedin.com/company/talantonimpact",
    displayName: "Talanton Impact",
    layout: "wide",
    avatarLabel: "TI",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "28 Jul 2026 ┬À 09:40",
      preview:
        "Across our African portfolio, jobs created and people served remain the north star ÔÇö Impact Health holds steady as we prepare the August board pack.",
      stats: [
        { label: "Impressions", value: "5.1K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "128", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "19", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "11", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const ONWARDAIR_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "OnwardAir",
    href: "https://www.linkedin.com/company/onwardair",
    displayName: "OnwardAir",
    layout: "wide",
    avatarLabel: "OA",
    avatarClassName: "rounded-full border border-sky-400/40 bg-sky-500/30 text-xs font-bold",
    accent: "from-sky-500/20 to-cyan-500/5",
    accentBorder: "border-sky-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "29 Jul 2026 ┬À 14:10",
      preview:
        "Another FAA interaction cycle complete ÔÇö next stop: investor day in Austin and dual-source battery pack acceptance tests.",
      stats: [
        { label: "Impressions", value: "11.2K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "326", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "41", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "28", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@onwardair",
    displayName: "@onwardair",
    layout: "square",
    avatarLabel: "OA",
    avatarClassName:
      "rounded-full bg-gradient-to-br from-sky-400 via-cyan-500 to-indigo-500 text-[10px] font-bold",
    accent: "from-sky-500/20 via-cyan-500/15 to-indigo-500/10",
    accentBorder: "border-cyan-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 via-cyan-500 to-indigo-500 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    lastPost: {
      date: "26 Jul 2026 ┬À 17:45",
      preview:
        "Golden-hour taxi tests on the flight campus ÔÇö certification cameras rolling. Full reel in stories.",
      stats: [
        { label: "Reach", value: "18.6K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "1.1K", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "64", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Saves", value: "89", icon: <Share2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "twitter",
    name: "X",
    handle: "@OnwardAir",
    displayName: "OnwardAir",
    layout: "wide",
    avatarLabel: "X",
    avatarClassName: "rounded-full border border-white/20 bg-black text-xs font-bold",
    accent: "from-white/10 to-white/5",
    accentBorder: "border-white/20",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-black text-[10px] font-bold text-white">
        ­ØòÅ
      </span>
    ),
    lastPost: {
      date: "30 Jul 2026 ┬À 09:05",
      preview:
        "Vertiport partnership talks advancing in Dallas & Phoenix. Quiet skies, dense networks ÔÇö city-first design.",
      stats: [
        { label: "Impressions", value: "7.8K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "194", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Replies", value: "22", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "37", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const PACK_PLATFORMS: Record<SocialWorkspacePackId, SocialPlatformConfig[]> = {
  internal: INTERNAL_PLATFORMS,
  demo: DEMO_PLATFORMS,
  onwardair: ONWARDAIR_PLATFORMS,
  talanton: TALANTON_PLATFORMS,
  abhi: ABHI_PLATFORMS,
};

export function resolveSocialPlatforms(): SocialPlatformConfig[] {
  const packId = typeof window === "undefined" ? "internal" : resolveSocialWorkspacePackId();
  return PACK_PLATFORMS[packId] ?? INTERNAL_PLATFORMS;
}
