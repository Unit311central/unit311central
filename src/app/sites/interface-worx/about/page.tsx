import type { Metadata } from "next";

import InterfaceWorxAboutContent from "@/components/interface-worx-website/InterfaceWorxAboutContent";
import { INTERFACE_WORX_MISSION, INTERFACE_WORX_WEBSITE_URL } from "@/lib/interface-worx-surface";

export const metadata: Metadata = {
  title: "Interface Worx | About",
  description: INTERFACE_WORX_MISSION,
  alternates: {
    canonical: `${INTERFACE_WORX_WEBSITE_URL}/about`,
  },
};

export default function InterfaceWorxAboutPage() {
  return <InterfaceWorxAboutContent />;
}
