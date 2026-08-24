import type { Metadata } from "next";

import InterfaceWorxHomeContent from "@/components/interface-worx-website/InterfaceWorxHomeContent";
import { INTERFACE_WORX_MISSION, INTERFACE_WORX_WEBSITE_URL } from "@/lib/interface-worx-surface";

export const metadata: Metadata = {
  title: "Interface Worx | Prosthetic Interface Technology",
  description: INTERFACE_WORX_MISSION,
  alternates: {
    canonical: INTERFACE_WORX_WEBSITE_URL,
  },
};

export default function InterfaceWorxHomePage() {
  return <InterfaceWorxHomeContent />;
}
