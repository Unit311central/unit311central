import type { Metadata } from "next";

import InterfaceWorxContactContent from "@/components/interface-worx-website/InterfaceWorxContactContent";
import { INTERFACE_WORX_WEBSITE_URL } from "@/lib/interface-worx-surface";

export const metadata: Metadata = {
  title: "Interface Worx | Contact",
  description: "Contact Interface Worx by email or LinkedIn.",
  alternates: {
    canonical: `${INTERFACE_WORX_WEBSITE_URL}/contact`,
  },
};

export default function InterfaceWorxContactPage() {
  return <InterfaceWorxContactContent />;
}
