import { notFound } from "next/navigation";

import { AbhiMemberPortalDashboard } from "@/components/abhi/portal/AbhiMemberPortalDashboard";
import { getMemberPortalByPath } from "@/lib/abhi/member-portal-routes";

export default async function AbhiMemberPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getMemberPortalByPath(company);
  if (!route) notFound();

  // Single-page member dashboard today — reserved for future sub-sections.
  if (section.length > 0) notFound();

  return <AbhiMemberPortalDashboard companyId={route.clientId} companyName={route.displayName} />;
}
