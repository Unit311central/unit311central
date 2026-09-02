import { notFound } from "next/navigation";

import { WolfPailexPortalLogin } from "@/components/wolf/pailex-portal/WolfPailexPortalLogin";
import { getWolfPailexPortalByPath } from "@/lib/wolf/wolf-pailex-portal-routes";

export default async function WolfPailexPortalLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getWolfPailexPortalByPath(company);
  if (!route) notFound();

  return (
    <WolfPailexPortalLogin
      companyPath={route.path}
      companyName={route.displayName}
      suggestedUsername={route.username}
      companyLogoSrc={route.companyLogoSrc}
    />
  );
}
