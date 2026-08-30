import type { Metadata } from "next";

import SaecDiscoveryApp from "@/components/saec-discovery/SaecDiscoveryApp";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "SAEC Discovery · Current Systems",
  description: "What software do you currently use for each business function?",
  path: "/saec-discovery",
  index: false,
  follow: false,
});

export default function SaecDiscoveryPage() {
  return <SaecDiscoveryApp />;
}
