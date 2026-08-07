import type { Metadata } from "next";

import { TalantonEaTestingWorkspace } from "@/components/talanton/TalantonEaTestingWorkspace";

export const metadata: Metadata = {
  title: "EA Test Suite | Talanton Impact",
  description: "Talanton Executive Assistant automated test suite.",
  robots: { index: false, follow: false },
};

export default function TalantonTestingPage() {
  return <TalantonEaTestingWorkspace />;
}
