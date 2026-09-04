import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { getGreenDesertClientPortalByPath } from "@/lib/greendesert/client-portal-routes";
import { requirePortalAccess } from "@/lib/portals/require-portal-access";

import { GreenDesertClientPortalShell } from "@/components/greendesert/portal/GreenDesertClientPortalShell";

export default async function GreenDesertClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const { route, session } = await requirePortalAccess(GREENDESERT_SLUG, company);
  const clientRoute = getGreenDesertClientPortalByPath(route.path);
  if (!clientRoute) throw new Error("Portal route missing");

  return (
    <GreenDesertClientPortalShell
      companyPath={clientRoute.path}
      companyName={clientRoute.displayName}
      displayName={session.displayName || session.username}
    >
      {children}
    </GreenDesertClientPortalShell>
  );
}
