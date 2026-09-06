import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GreenDesertClientPortalLogin } from "@/components/greendesert/portal/GreenDesertClientPortalLogin";
import { getGreenDesertClientPortalByPath } from "@/lib/greendesert/client-portal-routes";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Client Login Green Desert",
    robots: { index: false, follow: false },
  };
}

export default async function GreenDesertClientPortalLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getGreenDesertClientPortalByPath(company);
  if (!route) notFound();

  return (
    <GreenDesertClientPortalLogin
      companyPath={route.path}
      companyName={route.displayName}
      suggestedUsername={route.username}
    />
  );
}
