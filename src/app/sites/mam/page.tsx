import type { Metadata } from "next";

import MamHomeContent from "@/components/mam-website/MamHomeContent";
import {
  MAM_WEBSITE_CANONICAL_ORIGIN,
  MAM_WEBSITE_DESCRIPTION,
  MAM_WEBSITE_TITLE,
} from "@/lib/mam/mam-website";

export const metadata: Metadata = {
  title: MAM_WEBSITE_TITLE,
  description: MAM_WEBSITE_DESCRIPTION,
  alternates: {
    canonical: MAM_WEBSITE_CANONICAL_ORIGIN,
  },
};

export default function MamHomePage() {
  return <MamHomeContent />;
}
