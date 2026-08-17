import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { NorthstarBoardPortalShell } from "@/components/demo/board/NorthstarBoardPortalShell";
import { getRequestHost, isDemoDomainHost } from "@/lib/app-domains";
import { requireNorthstarBoardPortalAccess } from "@/lib/demo/northstar-board-portal-auth";

export const dynamic = "force-dynamic";

export default async function NorthstarBoardPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = getRequestHost({ headers: await headers() });
  if (!isDemoDomainHost(host)) {
    redirect("/dashboard?view=board-dashboard");
  }

  const { session } = await requireNorthstarBoardPortalAccess();
  const displayName = session.displayName || session.username;

  return (
    <NorthstarBoardPortalShell displayName={displayName}>{children}</NorthstarBoardPortalShell>
  );
}
