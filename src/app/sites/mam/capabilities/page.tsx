import type { Metadata } from "next";

import MamCapabilitiesContent from "@/components/mam-website/MamCapabilitiesContent";
import { MAM_WEBSITE_CANONICAL_ORIGIN } from "@/lib/mam/mam-website";

export const metadata: Metadata = {
  title: "Manufacturing Capabilities",
  description:
    "Design review, additive manufacturing, finishing and quality aligned to your component requirements — MAM, Casablanca.",
  alternates: {
    canonical: `${MAM_WEBSITE_CANONICAL_ORIGIN}/capabilities`,
  },
};

export default function MamCapabilitiesPage() {
  return <MamCapabilitiesContent />;
}
