"use client";

import { useState } from "react";

import { captureContextToTaskInput, formatQaTaskScopeLabel } from "@/lib/qa-workspace/scope";
import type { QaTaskCaptureContext } from "@/lib/qa-workspace/types";

type QaTaskDialogProps = {
  open: boolean;
  captureContext: QaTaskCaptureContext;
  onClose: () => void;
};

function ContextField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-white/45">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

export default function QaTaskDialog({ open, captureContext, onClose }: QaTaskDialogProps) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function saveTask() {
    if (!comment.trim()) {
      setError("Comment is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/qa/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(captureContextToTaskInput(captureContext, comment.trim())),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to save QA task.");
      setComment("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save QA task.");
    } finally {
      setBusy(false);
    }
  }

  const { scope } = captureContext;

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
        <h2 className="text-lg font-semibold text-white">QA Task</h2>
        <dl className="mt-4 space-y-2 text-sm text-white/75">
          <div className="grid grid-cols-[7rem_1fr] gap-2">
            <dt className="text-white/45">Scope</dt>
            <dd className="font-medium text-rose-200">{formatQaTaskScopeLabel(scope)}</dd>
            {(scope === "module" || scope === "page" || scope === "element") && (
              <ContextField label="Module" value={captureContext.moduleLabel} />
            )}
            {(scope === "page" || scope === "element") && (
              <ContextField label="Page" value={captureContext.pageLabel} />
            )}
            {scope === "element" && (
              <ContextField label="Element" value={captureContext.elementLabel} />
            )}
            {(scope === "page" || scope === "element") && captureContext.routePath ? (
              <>
                <dt className="text-white/45">Route</dt>
                <dd className="break-all text-xs text-white/60">{captureContext.routePath}</dd>
              </>
            ) : null}
            {(scope === "page" || scope === "element") && captureContext.pageViewId ? (
              <>
                <dt className="text-white/45">View ID</dt>
                <dd className="text-xs text-white/60">{captureContext.pageViewId}</dd>
              </>
            ) : null}
          </div>
        </dl>
        <label className="mt-4 block text-sm text-white/60">
          Comment
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#050b16] px-3 py-2 text-sm text-white outline-none focus:border-rose-400/50"
            placeholder="Describe the issue or improvement requirement..."
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
            className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-100 disabled:opacity-50"
            onClick={() => void saveTask()}
            disabled={busy}
          >
            {busy ? "Saving..." : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
