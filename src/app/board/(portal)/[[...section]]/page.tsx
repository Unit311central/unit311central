import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { NorthstarBoardPortalApp } from "@/components/demo/board/NorthstarBoardPortalApp";
import { getRequestHost, isDemoDomainHost } from "@/lib/app-domains";
import { parseNorthstarBoardPortalSection } from "@/lib/demo/northstar-board-portal-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Board | Northstar Demo",
  robots: { index: false, follow: false },
};

export default async function NorthstarBoardPortalPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const host = getRequestHost({ headers: await headers() });
  if (!isDemoDomainHost(host)) {
    redirect("/dashboard?view=board-dashboard");
  }

  const { section = [] } = await params;
  const boardSection = parseNorthstarBoardPortalSection(section);
  if (!boardSection) notFound();

  return <NorthstarBoardPortalApp section={boardSection} />;
}
