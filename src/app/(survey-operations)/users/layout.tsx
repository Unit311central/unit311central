import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Internal Users | DroneCatalyst",
  description: "Internal operator accounts for Drone Catalyst survey operations.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
