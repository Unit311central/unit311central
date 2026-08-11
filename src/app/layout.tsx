import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import ClarityProvider from "@/components/analytics/ClarityProvider";
import MarketingAnalyticsBeacon from "@/components/analytics/MarketingAnalyticsBeacon";
import FooterGate from "@/components/layout/FooterGate";
import MobileStickyBookCta from "@/components/layout/MobileStickyBookCta";
import Navbar from "@/components/layout/Navbar";
import JsonLd from "@/components/JsonLd";
import {
  getRequestHost,
  isInternalOpsShellHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { homeMetadata } from "@/lib/metadata";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

export const metadata: Metadata = {
  ...homeMetadata,
  metadataBase: new URL(SITE_URL),
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Unit311 Central",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const host = getRequestHost({ headers: requestHeaders });
  // Customer workspace + Internal/Demo app hosts must not show marketing chrome
  // (bare /login links would drop return_to before hydrate hides the nav).
  // Partners signup/portal is also a bare surface (see middleware x-unit311-bare-chrome).
  const hideMarketingChrome =
    Boolean(parseClientPlatformSubdomainSafe(host)) ||
    isInternalOpsShellHost(host) ||
    requestHeaders.get("x-unit311-bare-chrome") === "1";

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body
        className={`flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground antialiased${
          hideMarketingChrome ? "" : " marketing-mobile-shell"
        }`}
      >
        <ClarityProvider />
        {hideMarketingChrome ? null : <MarketingAnalyticsBeacon />}
        <JsonLd
          data={[organizationJsonLd(), webSiteJsonLd(), softwareApplicationJsonLd()]}
        />
        {hideMarketingChrome ? null : <Navbar />}
        <main className="flex-1">{children}</main>
        {hideMarketingChrome ? null : <FooterGate />}
        {hideMarketingChrome ? null : <MobileStickyBookCta />}
      </body>
    </html>
  );
}
