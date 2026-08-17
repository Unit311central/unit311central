import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { NorthstarBoardPortalLogin } from "@/components/demo/board/NorthstarBoardPortalLogin";
import { getRequestHost, isDemoDomainHost } from "@/lib/app-domains";

export const metadata: Metadata = {
  title: "Board Login | Northstar Demo",
  robots: { index: false, follow: false },
};

/**
 * Public Northstar board portal login.
 * Middleware decides whether this page is served — do not cookie-redirect here.
 */
export default async function NorthstarBoardPortalLoginPage() {
  const host = getRequestHost({ headers: await headers() });
  if (!isDemoDomainHost(host)) notFound();

  return <NorthstarBoardPortalLogin />;
}
