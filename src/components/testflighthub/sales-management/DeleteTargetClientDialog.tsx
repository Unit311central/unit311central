"use client";

import { Loader2 } from "lucide-react";

import type { TargetClientRow } from "@/lib/target-clients";

export default function DeleteTargetClientDialog({
  open,
  row,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  row: TargetClientRow | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-target-client-title"
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0b1220] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
      >
        <h2 id="delete-target-client-title" className="text-base font-semibold text-white">
          Delete Target Client?
        </h2>
        <p className="mt-2 text-sm text-white/60">
          This removes <span className="font-medium text-white">{row.companyName}</span> from the Target
          Clients list. This action cannot be undone.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-white/12 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.05] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}
