import type { Metadata } from "next";

import ModuleReviewContent from "@/components/module-review/ModuleReviewContent";
import MarketingPageShell from "@/components/layout/MarketingPageShell";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Module Review",
  description:
    "Review Unit311 platform modules and select focus areas for your discovery session.",
  path: "/module-review",
});

const MODULE_REVIEW_CONTENT_CLASS =
  "relative z-10 mx-auto w-full max-w-[min(100%,1920px)] px-4 py-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-8 lg:px-6";

export default function ModuleReviewPage() {
  return (
    <MarketingPageShell
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
