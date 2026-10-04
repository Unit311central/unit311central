import type { Metadata, Viewport } from "next";

import MamWebsiteNav, { MamWebsiteFooter } from "@/components/mam-website/MamWebsiteChrome";
import {
  MAM_HERO_IMAGE,
  MAM_WEBSITE_CANONICAL_ORIGIN,
  MAM_WEBSITE_DESCRIPTION,
  MAM_WEBSITE_TITLE,
} from "@/lib/mam/mam-website";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0e11",
};

export const metadata: Metadata = {
  metadataBase: new URL(MAM_WEBSITE_CANONICAL_ORIGIN),
  title: {
    default: MAM_WEBSITE_TITLE,
    template: "%s | MAM",
  },
  description: MAM_WEBSITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: MAM_WEBSITE_CANONICAL_ORIGIN,
    siteName: "MAM",
    title: MAM_WEBSITE_TITLE,
    description: MAM_WEBSITE_DESCRIPTION,
    images: [
      {
        url: MAM_HERO_IMAGE,
        width: 2400,
        height: 1600,
        alt: "Advanced manufacturing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: MAM_WEBSITE_TITLE,
    description: MAM_WEBSITE_DESCRIPTION,
    images: [MAM_HERO_IMAGE],
  },
};

export default function MamWebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#0c0e11] text-white antialiased">
      <MamWebsiteNav />
      <main>{children}</main>
      <MamWebsiteFooter />
    </div>
  );
}
