import type { Metadata } from "next";

import MamAboutContent from "@/components/mam-website/MamAboutContent";
import { MAM_WEBSITE_CANONICAL_ORIGIN } from "@/lib/mam/mam-website";

export const metadata: Metadata = {
  title: "About MAM",
  description:
    "Building advanced manufacturing capability in Morocco — engineering-focused additive production from Casablanca.",
  alternates: {
    canonical: `${MAM_WEBSITE_CANONICAL_ORIGIN}/about`,
  },
};

export default function MamAboutPage() {
  return <MamAboutContent />;
}
