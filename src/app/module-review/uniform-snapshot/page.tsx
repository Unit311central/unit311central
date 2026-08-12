import ModuleReviewContentUniform from "@/components/module-review/ModuleReviewContentUniform";
import MarketingPageShell from "@/components/layout/MarketingPageShell";

export const dynamic = "force-dynamic";

const MODULE_REVIEW_CONTENT_CLASS =
  "relative z-10 mx-auto w-full max-w-[min(100%,1680px)] px-4 py-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10 lg:px-8";

/** Internal snapshot — uniform blue headers (design before per-module accents). */
export default function ModuleReviewUniformSnapshotPage() {
  return (
    <MarketingPageShell
      backgroundImage="/images/overview-corporate-intelligence-bg.png"
      backgroundImageViaCss
      backgroundImageClassName="opacity-[0.55] sm:opacity-[0.62]"
      overlayClassName="absolute inset-0 bg-gradient-to-b from-[#030712]/45 via-[#020617]/58 to-[#020617]/72"
      contentClassName={MODULE_REVIEW_CONTENT_CLASS}
    >
      <ModuleReviewContentUniform />
    </MarketingPageShell>
  );
}
