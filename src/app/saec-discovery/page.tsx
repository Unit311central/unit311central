import type { Metadata } from "next";

import SaecDiscoveryApp from "@/components/saec-discovery/SaecDiscoveryApp";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "SAEC Discovery · Current Systems",
  description:
    "Tell us what software you currently use across your business areas.",
  path: "/saec-discovery",
  index: false,
  follow: false,
});

export default function SaecDiscoveryPage() {
  return <SaecDiscoveryApp />;
}
