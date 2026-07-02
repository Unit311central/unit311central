import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import FooterGate from "@/components/layout/FooterGate";
import Navbar from "@/components/layout/Navbar";
import JsonLd from "@/components/JsonLd";
import { homeMetadata } from "@/lib/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  ...homeMetadata,
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <FooterGate />
      </body>
    </html>
  );
}
