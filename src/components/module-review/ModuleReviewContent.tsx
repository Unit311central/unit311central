"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import ModuleReviewGrid from "@/components/module-review/ModuleReviewGrid";
import { createEmptyBookThankYouSelections } from "@/lib/book-thank-you-data";

export default function ModuleReviewContent() {
  const [selections, setSelections] = useState(createEmptyBookThankYouSelections);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(key: string, checked: boolean) {
    setSelections((current) => ({
      items: { ...current.items, [key]: checked },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
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
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save selections.");
      }
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save selections.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCount = Object.values(selections.items).filter(Boolean).length;

  return (
    <div className="w-full max-w-full">
      <header className="text-left">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl lg:text-[2rem]">
          UNIT311 CENTRAL MODULE REVIEW
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/70 sm:text-[15px]">
          Review the full Unit311 module map and tick the areas you want to prioritise in your
          discovery session.
        </p>
      </header>

      <div
        className="mt-6 rounded-[24px] border border-white/18 bg-slate-950/50 p-2 shadow-[0_32px_100px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl sm:mt-8 sm:p-4 lg:p-5"
        data-module-review-panel
      >
        <ModuleReviewGrid selections={selections.items} onToggle={handleToggle} />

        <div className="mt-6 flex flex-col items-start gap-3 border-t border-white/15 pt-6">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || submitted}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0b2d63] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(11,45,99,0.35)] transition-colors hover:bg-[#0a2554] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : submitted ? (
              "Saved to spreadsheet"
            ) : (
              "Submit selections"
            )}
          </button>
          <p className="text-xs text-white/55">
            {selectedCount === 0
              ? "No modules selected yet."
              : `${selectedCount} module area${selectedCount === 1 ? "" : "s"} selected.`}
          </p>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {submitted ? (
            <p className="text-sm text-emerald-300">
              Saved to modulereviewarjan.csv on your desktop.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
