import type { Metadata } from "next";

import PartnersSignupChat from "@/components/partners/PartnersSignupChat";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Partners signup",
  description: "Signup for Unit311 Central distributors and representatives.",
  path: "/partners",
});

export default function PartnersPage() {
  return <PartnersSignupChat />;
}
