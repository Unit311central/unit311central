import ModuleReviewGridMockup from "@/components/module-review/ModuleReviewGridMockup";
import MarketingPageShell from "@/components/layout/MarketingPageShell";

export const dynamic = "force-dynamic";

const MOCKUP_CONTENT_CLASS =
  "relative z-10 mx-auto w-full max-w-[100%] px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-3";

/** Layout mockup: 3 rows × 7 tiles — screenshot only. */
export default function ModuleReviewNewMockupPage() {
  return (
    <MarketingPageShell
      backgroundImage="/images/overview-corporate-intelligence-bg.png"
      backgroundImageViaCss
      backgroundImageClassName="opacity-[0.55] sm:opacity-[0.62]"
      overlayClassName="absolute inset-0 bg-gradient-to-b from-[#030712]/45 via-[#020617]/58 to-[#020617]/72"
      contentClassName={MOCKUP_CONTENT_CLASS}
    >
      <div className="w-full max-w-full" data-module-review-mockup-page>
        <header className="text-left">
          <h1 className="text-base font-bold leading-tight tracking-tight text-white sm:text-lg">
            UNIT311 CENTRAL MODULE REVIEW
          </h1>
          <p className="mt-1 max-w-4xl text-[11px] leading-snug text-white/70 sm:text-xs">
            Review the full Unit311 module map and tick the areas you want to prioritise in your
            discovery session.
          </p>
        </header>

        <div
          className="mt-2 rounded-[18px] border border-white/18 bg-slate-950/50 p-1.5 shadow-[0_20px_64px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl sm:p-2"
        >
          <ModuleReviewGridMockup />
          <div className="mt-2 border-t border-white/15 pt-2">
            <div className="inline-flex min-h-8 items-center rounded-lg bg-[#0b2d63] px-5 text-[11px] font-semibold text-white">
              Submit selections
            </div>
            <p className="mt-1 text-[9px] text-white/55">No modules selected yet.</p>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
