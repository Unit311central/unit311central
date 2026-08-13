"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import ModuleReviewGrid from "@/components/module-review/ModuleReviewGrid";
import { createEmptyBookThankYouSelections } from "@/lib/book-thank-you-data";
import { finishModuleReviewSubmit } from "@/lib/module-review-submit-client";
import {
  MODULE_REVIEW_COL_GAP,
  MODULE_REVIEW_PANEL_INSET_X,
} from "@/lib/module-review-tile-styles";

export default function ModuleReviewContent() {
  const [selections, setSelections] = useState(createEmptyBookThankYouSelections);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(key: string, checked: boolean) {
    setSelections((current) => ({
      items: { ...current.items, [key]: checked },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const selected = Object.entries(selections.items)
        .filter(([, checked]) => checked)
        .map(([key]) => {
          const [module, item] = key.split("::");
          return { module, item, key };
        });

      const response = await fetch("/api/module-review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected, selections: selections.items }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        mode?: string;
        csv?: string;
        filename?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save selections.");
      }

      setSuccessMessage(finishModuleReviewSubmit(payload));
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save selections.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-full pt-6 sm:pt-8">
      <header className={`text-left ${MODULE_REVIEW_PANEL_INSET_X}`}>
        <div
          className={`grid w-full min-w-0 grid-cols-7 ${MODULE_REVIEW_COL_GAP} items-center pb-2 sm:pb-3`}
        >
          <h1
            className="col-span-6 min-w-0 text-sm font-bold leading-tight tracking-tight text-white sm:text-base lg:text-lg"
          >
            UNIT311 CENTRAL MODULE REVIEW
          </h1>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || submitted}
            className="inline-flex min-h-8 w-full items-center justify-center rounded-lg bg-[#0b2d63] px-2 py-1.5 text-[10px] font-semibold text-white shadow-[0_6px_18px_rgba(11,45,99,0.35)] transition-colors hover:bg-[#0a2554] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Saving…
              </>
            ) : submitted ? (
              "Saved to spreadsheet"
            ) : (
              "Submit selections"
            )}
          </button>
        </div>
        <p className="mt-1 max-w-4xl text-[11px] leading-snug text-white/70 sm:text-xs">
          Review the full Unit311 module map and tick the areas you want to prioritise in your
          discovery session.
        </p>
      </header>

      <div
        className="mt-5 rounded-[16px] border border-white/18 bg-slate-950/50 p-1 shadow-[0_20px_64px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl sm:mt-6 sm:p-1.5"
        data-module-review-panel
      >
        <ModuleReviewGrid selections={selections.items} onToggle={handleToggle} />

        {error ? <p className="mt-2 text-[11px] text-rose-400">{error}</p> : null}
        {successMessage ? (
          <p className="mt-2 text-[11px] text-emerald-300">{successMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
