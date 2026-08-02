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

  return (
    <AbhiMemberPortalShell
      companyPath={route.path}
      companyName={route.displayName}
      displayName={session.displayName || session.username}
      isStaffPreview={session.isStaffPreview}
    >
      {children}
    </AbhiMemberPortalShell>
  );
}
