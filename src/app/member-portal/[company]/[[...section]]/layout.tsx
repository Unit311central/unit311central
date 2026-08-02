import { AbhiBoardPortalShell } from "@/components/abhi/board/AbhiBoardPortalShell";
import { AbhiMemberPortalShell } from "@/components/abhi/portal/AbhiMemberPortalShell";
import { requireAbhiMemberPortalAccess } from "@/lib/abhi/member-portal-auth";

export default async function AbhiMemberPortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const { route, session } = await requireAbhiMemberPortalAccess(company);
  const displayName = session.displayName || session.username;

  if (route.portalKind === "board") {
    return <AbhiBoardPortalShell displayName={displayName}>{children}</AbhiBoardPortalShell>;
  }

  return (
    <AbhiMemberPortalShell
      companyPath={route.path}
      companyName={route.displayName}
      displayName={displayName}
      isStaffPreview={session.isStaffPreview}
    >
      {children}
    </AbhiMemberPortalShell>
  );
}
