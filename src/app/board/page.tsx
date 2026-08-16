import type { Metadata } from "next";

import {
  DemoBoardDashboardWorkspace,
  DemoBoardMeetingsWorkspace,
} from "@/components/demo/DemoBoardWorkspace";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getRequestHost, isDemoDomainHost } from "@/lib/app-domains";

export const metadata: Metadata = {
  title: "Board | Northstar Demo",
  robots: { index: false, follow: false },
};

export default async function DemoBoardPage() {
  const host = getRequestHost({ headers: await headers() });
  if (!isDemoDomainHost(host)) {
    redirect("/dashboard?view=board-dashboard");
  }

  return (
    <div className="min-h-screen bg-[#07111f] p-4 sm:p-6">
      <DemoBoardDashboardWorkspace />
      <div className="mt-8">
        <DemoBoardMeetingsWorkspace />
      </div>
    </div>
  );
}
