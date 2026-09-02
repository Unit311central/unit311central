import { notFound } from "next/navigation";

import { WolfPailexPortalShell } from "@/components/wolf/pailex-portal/WolfPailexPortalShell";
import { requireWolfPailexPortalAccess } from "@/lib/wolf/wolf-pailex-portal-auth";
import { getWolfPailexPortalByPath } from "@/lib/wolf/wolf-pailex-portal-routes";

export const dynamic = "force-dynamic";

export default async function WolfPailexPortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getWolfPailexPortalByPath(company);
  if (!route) notFound();

  const { session } = await requireWolfPailexPortalAccess(company);
  const displayName = session.displayName || session.username;

  return (
    <WolfPailexPortalShell
      companyPath={route.path}
      companyName={route.displayName}
      displayName={displayName}
      companyLogoSrc={route.companyLogoSrc}
    >
      {children}
    </WolfPailexPortalShell>
  );
}
