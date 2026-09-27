import type { Metadata, Viewport } from "next";

import WolfRealtimeWebsiteNav, {
  WolfRealtimeWebsiteFooter,
} from "@/components/wolf-realtime-website/WolfRealtimeWebsiteChrome";
import { WOLF_TAGLINE } from "@/lib/wolf/wolf-surface";
import {
  WOLF_REALTIME_WEBSITE_URL,
} from "@/lib/wolf-realtime-website-surface";

const siteDescription =
  "Aerial operations, intelligence and command software built for wildlife reserves.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c0a",
};

export const metadata: Metadata = {
  metadataBase: new URL(WOLF_REALTIME_WEBSITE_URL),
  title: {
    default: "WOLF | Wildlife Operations Live Flight",
    template: "%s | WOLF",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: WOLF_REALTIME_WEBSITE_URL,
    siteName: "WOLF Realtime",
    title: "WOLF | Wildlife Operations Live Flight",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "WOLF | Wildlife Operations Live Flight",
    description: siteDescription,
  },
  other: {
    "wolf:tagline": WOLF_TAGLINE,
  },
};

export default function WolfRealtimeWebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#080c0a] text-white antialiased">
      <WolfRealtimeWebsiteNav />
      <main>{children}</main>
      <WolfRealtimeWebsiteFooter />
    </div>
  );
}
