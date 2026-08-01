import type { Metadata } from "next";

import PartnerPortalApp from "@/components/partners/PartnerPortalApp";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Partners portal",
  description: "Unit311 Central partner portal for details and invoices.",
  path: "/partners/p",
});

export default async function PartnerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PartnerPortalApp token={token} />;
}
