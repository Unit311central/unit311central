import type { Metadata } from "next";

import MamIndustriesContent from "@/components/mam-website/MamIndustriesContent";
import { MAM_WEBSITE_CANONICAL_ORIGIN } from "@/lib/mam/mam-website";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Additive manufacturing support for aerospace, automotive, medical, industrial, robotics, energy and more — MAM Morocco.",
  alternates: {
    canonical: `${MAM_WEBSITE_CANONICAL_ORIGIN}/industries`,
  },
};

export default function MamIndustriesPage() {
  return <MamIndustriesContent />;
}
