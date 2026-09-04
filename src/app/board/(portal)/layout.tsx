import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { NorthstarBoardPortalShell } from "@/components/demo/board/NorthstarBoardPortalShell";
import { GreenDesertBoardPortalShell } from "@/components/greendesert/board/GreenDesertBoardPortalShell";
import { getRequestHost, isDemoDomainHost } from "@/lib/app-domains";
import { requireNorthstarBoardPortalAccess } from "@/lib/demo/northstar-board-portal-auth";
import { requireGreenDesertBoardPortalAccess } from "@/lib/greendesert/greendesert-board-portal-auth";
import { isGreenDesertHost } from "@/lib/greendesert-surface";

export const dynamic = "force-dynamic";

export default async function BoardPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = getRequestHost({ headers: await headers() });

  if (isGreenDesertHost(host)) {
    const { session } = await requireGreenDesertBoardPortalAccess();
    const displayName = session.displayName || session.username;
    return (
      <GreenDesertBoardPortalShell displayName={displayName}>{children}</GreenDesertBoardPortalShell>
    );
  }

  if (!isDemoDomainHost(host)) {
    redirect("/dashboard?view=board-dashboard");
  }

  const { session } = await requireNorthstarBoardPortalAccess();
  const displayName = session.displayName || session.username;

  return (
    <NorthstarBoardPortalShell displayName={displayName}>{children}</NorthstarBoardPortalShell>
  );
}
