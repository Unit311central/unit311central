import ModuleReviewGridMockup from "@/components/module-review/ModuleReviewGridMockup";
import MarketingPageShell from "@/components/layout/MarketingPageShell";
import { MODULE_REVIEW_COL_GAP } from "@/lib/module-review-tile-styles";

export const dynamic = "force-dynamic";

const SIZE_PREVIEW_CONTENT_CLASS =
  "relative z-10 mx-auto flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden px-2 py-2 pt-[max(0.35rem,env(safe-area-inset-top))] pb-2 sm:px-3 sm:py-3";

const ROW_ONE_END_COLUMN_INDEX = 6;

/** Size preview mockup — screenshot to desktop before deploy. */
export default function ModuleReviewSizePreviewPage() {
  return (
    <MarketingPageShell
      className="!min-h-0 h-[calc(100dvh-3.5rem)] overflow-hidden sm:h-[calc(100dvh-4rem)]"
      backgroundImage="/images/overview-corporate-intelligence-bg.png"
      backgroundImageViaCss
      backgroundImageClassName="opacity-[0.55] sm:opacity-[0.62]"
      overlayClassName="absolute inset-0 bg-gradient-to-b from-[#030712]/45 via-[#020617]/58 to-[#020617]/72"
      contentClassName={SIZE_PREVIEW_CONTENT_CLASS}
    >
      <div className="w-full max-w-full pt-6 sm:pt-8" data-module-review-size-page>
        <header className="text-left">
          <h1 className="text-sm font-bold leading-tight tracking-tight text-white sm:text-base lg:text-lg">
            UNIT311 CENTRAL MODULE REVIEW
          </h1>
          <p className="mt-1 max-w-4xl text-[11px] leading-snug text-white/70 sm:text-xs">
            Review the full Unit311 module map and tick the areas you want to prioritise in your
            discovery session.
          </p>
        </header>

        <div
          className="mt-5 rounded-[16px] border border-white/18 bg-slate-950/50 p-1 shadow-[0_20px_64px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl sm:mt-6 sm:p-1.5"
        >
          <div className={`grid w-full min-w-0 grid-cols-7 ${MODULE_REVIEW_COL_GAP} pb-1.5 pt-1 sm:pt-1.5`}>
            {Array.from({ length: 7 }, (_, columnIndex) =>
              columnIndex === ROW_ONE_END_COLUMN_INDEX ? (
                <div
                  key="submit-above-board"
                  className="inline-flex min-h-8 w-full items-center justify-center rounded-lg bg-[#0b2d63] px-2 py-1.5 text-[10px] font-semibold text-white shadow-[0_6px_18px_rgba(11,45,99,0.35)] sm:text-[11px]"
                >
                  Submit selections
                </div>
              ) : (
                <div key={`submit-spacer-${columnIndex}`} className="min-w-0" aria-hidden />
              ),
            )}
          </div>
          <ModuleReviewGridMockup />
        </div>
      </div>
    </MarketingPageShell>
  );
}
