import type { Metadata } from "next";

import MamManufacturingContent from "@/components/mam-website/MamManufacturingContent";
import { MAM_WEBSITE_CANONICAL_ORIGIN } from "@/lib/mam/mam-website";

export const metadata: Metadata = {
  title: "Advanced Additive Manufacturing",
  description:
    "MAM delivers additive manufacturing for prototyping, functional components, custom parts, low-volume production and complex geometries from Casablanca.",
  alternates: {
    canonical: `${MAM_WEBSITE_CANONICAL_ORIGIN}/manufacturing`,
  },
};

export default function MamManufacturingPage() {
  return <MamManufacturingContent />;
}
