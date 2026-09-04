import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { NorthstarBoardPortalApp } from "@/components/demo/board/NorthstarBoardPortalApp";
import { GreenDesertBoardPortalApp } from "@/components/greendesert/board/GreenDesertBoardPortalApp";
import { getRequestHost, isDemoDomainHost } from "@/lib/app-domains";
import { parseNorthstarBoardPortalSection } from "@/lib/demo/northstar-board-portal-data";
import { parseGreenDesertBoardPortalSection } from "@/lib/greendesert/greendesert-board-portal-data";
import { isGreenDesertHost } from "@/lib/greendesert-surface";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const host = getRequestHost({ headers: await headers() });
  if (isGreenDesertHost(host)) {
    return {
      title: "Board | Green Desert",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: "Board | Northstar Demo",
    robots: { index: false, follow: false },
  };
}

export default async function BoardPortalPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const host = getRequestHost({ headers: await headers() });
  const { section = [] } = await params;

  if (isGreenDesertHost(host)) {
    const boardSection = parseGreenDesertBoardPortalSection(section);
    if (!boardSection) notFound();
    return <GreenDesertBoardPortalApp section={boardSection} />;
  }

  if (!isDemoDomainHost(host)) {
    redirect("/dashboard?view=board-dashboard");
  }

  const boardSection = parseNorthstarBoardPortalSection(section);
  if (!boardSection) notFound();

  return <NorthstarBoardPortalApp section={boardSection} />;
}
