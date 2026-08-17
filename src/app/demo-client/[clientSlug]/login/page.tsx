import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NorthstarClientPortalLogin } from "@/components/demo/NorthstarClientPortalLogin";
import { getNorthstarDemoClientPortalBySlug } from "@/lib/demo/northstar-client-portal-routes";

type Props = {
  params: Promise<{ clientSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clientSlug } = await params;
  const route = getNorthstarDemoClientPortalBySlug(clientSlug);
  if (!route) {
    return { title: "Client Portal | Northstar Demo", robots: { index: false, follow: false } };
  }
  return {
    title: `${route.companyName} | Portal Login`,
    robots: { index: false, follow: false },
  };
}

/**
 * Public Northstar demo client portal login.
 * Middleware decides whether this page is served — do not cookie-redirect here.
 */
export default async function NorthstarDemoClientPortalLoginPage({ params }: Props) {
  const { clientSlug } = await params;
  const route = getNorthstarDemoClientPortalBySlug(clientSlug);
  if (!route) notFound();

  return <NorthstarClientPortalLogin route={route} />;
}
