import type { Metadata } from "next";

import SaecDiscoveryShell from "@/components/saec-discovery/SaecDiscoveryShell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "SAEC Discovery · Current Systems",
  description:
    "SAEC Current Systems Discovery — tell us what software you use and where the frustrations are. All questions are optional.",
  path: "/saec-discovery",
  index: false,
  follow: false,
});

export default function SaecDiscoveryPage() {
  return <SaecDiscoveryShell />;
}
