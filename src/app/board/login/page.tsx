import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { NorthstarBoardPortalLogin } from "@/components/demo/board/NorthstarBoardPortalLogin";
import { GreenDesertBoardPortalLogin } from "@/components/greendesert/board/GreenDesertBoardPortalLogin";
import { getRequestHost, isDemoDomainHost } from "@/lib/app-domains";
import { isGreenDesertHost } from "@/lib/greendesert-surface";

export async function generateMetadata(): Promise<Metadata> {
  const host = getRequestHost({ headers: await headers() });
  if (isGreenDesertHost(host)) {
    return {
      title: "Board Login | Green Desert",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: "Board Login | Northstar Demo",
    robots: { index: false, follow: false },
  };
}

/**
 * Public board portal login.
 * Middleware decides whether this page is served — do not cookie-redirect here.
 */
export default async function BoardPortalLoginPage() {
  const host = getRequestHost({ headers: await headers() });
  if (isGreenDesertHost(host)) {
    return <GreenDesertBoardPortalLogin />;
  }
  if (!isDemoDomainHost(host)) notFound();

  return <NorthstarBoardPortalLogin />;
}
