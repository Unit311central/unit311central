import { CompanyPortalShell } from "@/components/talanton/portal/CompanyPortalShell";
import { requireCompanyPortalAccess } from "@/lib/talanton/company-portal-auth";

export default async function CompanyPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const { route, session } = await requireCompanyPortalAccess(company);

  return (
    <CompanyPortalShell
      companyPath={route.path}
      companyName={route.displayName}
      displayName={session.displayName || session.username}
      isStaffPreview={session.isStaffPreview}
    >
      {children}
    </CompanyPortalShell>
  );
}
