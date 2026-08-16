import type { Metadata } from "next";

import DemoClientPortal from "@/components/demo/DemoClientPortal";

export const metadata: Metadata = {
  title: "Client Portal | Northstar Demo",
  robots: { index: false, follow: false },
};

export default function DemoClientPortalPage() {
  return <DemoClientPortal />;
}
