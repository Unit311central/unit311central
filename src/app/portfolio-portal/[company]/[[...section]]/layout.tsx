import { CompanyPortalShell } from "@/components/talanton/portal/CompanyPortalShell";
import { TalantonBoardPortalShell } from "@/components/talanton/board/TalantonBoardPortalShell";
import { requireCompanyPortalAccess } from "@/lib/talanton/company-portal-auth";

export default async function CompanyPortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const { route, session } = await requireCompanyPortalAccess(company);
  const displayName = session.displayName || session.username;

  if (route.portalKind === "board") {
    return <TalantonBoardPortalShell displayName={displayName}>{children}</TalantonBoardPortalShell>;
  }

  return (
    <CompanyPortalShell
      companyPath={route.path}
      companyName={route.displayName}
      displayName={displayName}
      isStaffPreview={session.isStaffPreview}
    >
      {children}
    </CompanyPortalShell>
  );
}
