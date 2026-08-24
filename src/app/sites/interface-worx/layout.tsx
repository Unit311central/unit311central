import type { Metadata, Viewport } from "next";

import InterfaceWorxWebsiteNav, {
  InterfaceWorxWebsiteFooter,
} from "@/components/interface-worx-website/InterfaceWorxWebsiteChrome";
import {
  INTERFACE_WORX_HERO_IMAGE_SRC,
  INTERFACE_WORX_MISSION,
  INTERFACE_WORX_WEBSITE_LOGO_SRC,
  INTERFACE_WORX_WEBSITE_URL,
} from "@/lib/interface-worx-surface";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(INTERFACE_WORX_WEBSITE_URL),
  title: {
    default: "Interface Worx | Prosthetic Interface Technology",
    template: "%s | Interface Worx",
  },
  description: INTERFACE_WORX_MISSION,
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: INTERFACE_WORX_WEBSITE_URL,
    siteName: "Interface Worx",
    title: "Interface Worx | Prosthetic Interface Technology",
    description: INTERFACE_WORX_MISSION,
    images: [
      {
        url: INTERFACE_WORX_HERO_IMAGE_SRC,
        width: 1920,
        height: 1280,
        alt: "Interface Worx",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interface Worx | Prosthetic Interface Technology",
    description: INTERFACE_WORX_MISSION,
    images: [INTERFACE_WORX_HERO_IMAGE_SRC],
  },
  icons: {
    icon: INTERFACE_WORX_WEBSITE_LOGO_SRC,
  },
};

export default function InterfaceWorxWebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <InterfaceWorxWebsiteNav />
      <main>{children}</main>
      <InterfaceWorxWebsiteFooter />
    </div>
  );
}
