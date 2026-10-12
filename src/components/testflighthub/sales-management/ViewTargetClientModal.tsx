"use client";

import { X } from "lucide-react";

import type { TargetClientRow } from "@/lib/target-clients";
import { targetClientWebsiteHref } from "@/lib/target-clients";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-sm text-white/90">{value || "—"}</p>
    </div>
  );
}

export default function ViewTargetClientModal({
  open,
  row,
  onClose,
}: {
  open: boolean;
  row: TargetClientRow | null;
  onClose: () => void;
}) {
  if (!open || !row) return null;

  const websiteHref = targetClientWebsiteHref(row.website);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-target-client-title"
        className="my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1220] shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="view-target-client-title" className="text-base font-semibold text-white">
            Target Client
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <Field label="Company Name" value={row.companyName} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Website</p>
            {websiteHref ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-violet-200 underline-offset-2 hover:underline"
              >
                {row.website}
              </a>
            ) : (
              <p className="mt-1 text-sm text-white/90">{row.website || "—"}</p>
            )}
          </div>
          <Field label="Sector" value={row.sector} />
          <Field label="Contact Name" value={row.contactName} />
          <Field label="Contact Position" value={row.contactPosition} />
          <Field label="Email Address" value={row.email} />
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-white/12 px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/[0.05] sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
