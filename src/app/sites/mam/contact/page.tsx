import type { Metadata } from "next";

import MamContactContent from "@/components/mam-website/MamContactContent";
import { MAM_WEBSITE_CANONICAL_ORIGIN } from "@/lib/mam/mam-website";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a manufacturing project with MAM — send drawings, CAD or specifications for a quote.",
  alternates: {
    canonical: `${MAM_WEBSITE_CANONICAL_ORIGIN}/contact`,
  },
};

export default function MamContactPage() {
  return <MamContactContent />;
}
