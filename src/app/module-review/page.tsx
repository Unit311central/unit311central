import type { Metadata } from "next";

import ModuleReviewContent from "@/components/module-review/ModuleReviewContent";
import MarketingPageShell from "@/components/layout/MarketingPageShell";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "UNIT311 Central Module Review",
  description:
    "Review Unit311 platform modules and select focus areas for your discovery session.",
  path: "/module-review",
});

const MODULE_REVIEW_CONTENT_CLASS =
  "relative z-10 mx-auto flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden px-2 py-2 pt-[max(0.35rem,env(safe-area-inset-top))] pb-2 sm:px-3 sm:py-3";

export default function ModuleReviewPage() {
  return (
    <MarketingPageShell
      className="!min-h-0 h-[calc(100dvh-3.5rem)] overflow-hidden sm:h-[calc(100dvh-4rem)]"
      backgroundImage="/images/overview-corporate-intelligence-bg.png"
      backgroundImageViaCss
      backgroundImageClassName="opacity-[0.55] sm:opacity-[0.62]"
      overlayClassName="absolute inset-0 bg-gradient-to-b from-[#030712]/45 via-[#020617]/58 to-[#020617]/72"
      contentClassName={MODULE_REVIEW_CONTENT_CLASS}
    >
      <ModuleReviewContent />
    </MarketingPageShell>
  );
}
