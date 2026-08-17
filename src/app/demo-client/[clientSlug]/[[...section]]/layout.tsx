import { notFound } from "next/navigation";

import { NorthstarClientPortalShell } from "@/components/demo/NorthstarClientPortalShell";
import { getDemoClientPortal } from "@/lib/demo/demo-client-portal-routes";
import { requireNorthstarClientPortalAccess } from "@/lib/demo/northstar-client-portal-auth";
import { getNorthstarDemoClientPortalBySlug } from "@/lib/demo/northstar-client-portal-routes";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ clientSlug: string }>;
};

export default async function DemoClientPortalSectionLayout({ children, params }: Props) {
  const { clientSlug } = await params;
  const route = getNorthstarDemoClientPortalBySlug(clientSlug);
  if (!route) {
    if (!getDemoClientPortal(clientSlug)) notFound();
    return <>{children}</>;
  }

  const { session } = await requireNorthstarClientPortalAccess(clientSlug);
  const displayName = session.displayName || session.username;

  return (
    <NorthstarClientPortalShell
      companyPath={route.path}
      companyName={route.companyName}
      displayName={displayName}
      companyLogoSrc={route.companyLogoSrc}
    >
      {children}
    </NorthstarClientPortalShell>
  );
}
