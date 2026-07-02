import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Internal Operations Dashboard | Unit311",
  description:
    "Unit311 internal operations workspace — clients, projects, finance, files, logistics, and more.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function InternalDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
