"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

import { QA_BETA_REPORT_TYPES, type QaBetaReportTypeId } from "@/lib/qa-workspace/constants";
import { buildBetaReportTaskInput } from "@/lib/qa-workspace/beta-report";
import type { QaPageContext } from "@/lib/qa-workspace/types";
import { cn } from "@/lib/utils";

type QaBetaReportDialogProps = {
  open: boolean;
  pageContext: QaPageContext;
  onClose: () => void;
};

export default function QaBetaReportDialog({ open, pageContext, onClose }: QaBetaReportDialogProps) {
  const [reportTypeId, setReportTypeId] = useState<QaBetaReportTypeId>("broken");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submitReport() {
    if (!description.trim()) {
      setError("Please tell us what happened.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildBetaReportTaskInput({
            pageContext,
            reportTypeId,
            description,
          }),
        ),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to submit report.");
      setDescription("");
      setReportTypeId("broken");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-qa-dialog
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1524] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Report an Issue</h2>
        <p className="mt-1 text-sm text-white/50">
          We&apos;ll capture where you were in InterfaceWorx automatically.
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
          <p>
            <span className="text-white/40">Module:</span> {pageContext.moduleLabel}
          </p>
          <p className="mt-1">
            <span className="text-white/40">Page:</span> {pageContext.pageLabel}
          </p>
        </div>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-medium text-white/70">What did you find?</legend>
          {QA_BETA_REPORT_TYPES.map((option) => (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                reportTypeId === option.id
                  ? "border-[#CC5500]/50 bg-[#CC5500]/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/75 hover:border-white/20",
              )}
            >
              <input
                type="radio"
                name="qa-beta-report-type"
                value={option.id}
                checked={reportTypeId === option.id}
                onChange={() => setReportTypeId(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <label className="mt-4 block text-sm text-white/70">
          What happened?
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#050b16] px-3 py-2 text-sm text-white outline-none focus:border-[#CC5500]/50"
            placeholder="Tell me what you found..."
            autoFocus
          />
        </label>

        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl border border-[#CC5500]/40 bg-[#CC5500]/20 px-4 py-2 text-sm font-medium text-orange-100 disabled:opacity-50"
            onClick={() => void submitReport()}
            disabled={busy}
          >
            {busy ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

type QaBetaReportFabProps = {
  onClick: () => void;
};

export function QaBetaReportFab({ onClick }: QaBetaReportFabProps) {
  return (
    <button
      type="button"
      data-qa-target="beta-report-fab"
      onClick={onClick}
      className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#CC5500]/40 bg-[#CC5500]/90 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-[#CC5500]"
    >
      <Flag className="h-4 w-4" />
      Report Issue
    </button>
  );
}
