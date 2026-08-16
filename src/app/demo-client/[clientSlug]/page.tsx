import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DemoClientPortal from "@/components/demo/DemoClientPortal";
import { getDemoClientPortal } from "@/lib/demo/demo-client-portal-routes";

type Props = {
  params: Promise<{ clientSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clientSlug } = await params;
  const portal = getDemoClientPortal(clientSlug);
  if (!portal) {
    return { title: "Client Portal | Northstar Demo", robots: { index: false, follow: false } };
  }
  return {
    title: `${portal.companyName} | Client Portal`,
    robots: { index: false, follow: false },
  };
}

export default async function DemoClientPortalBySlugPage({ params }: Props) {
  const { clientSlug } = await params;
  const portal = getDemoClientPortal(clientSlug);
  if (!portal) notFound();
  return <DemoClientPortal portal={portal} />;
}
