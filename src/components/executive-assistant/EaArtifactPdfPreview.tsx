"use client";

import { Download, X } from "lucide-react";

import type { AssistantMessageArtifact } from "@/lib/ai-operating-assistant/types";
import { eaArtifactDisplayName } from "@/lib/ai-operating-assistant/ea-artifact-display";

type EaArtifactPdfPreviewProps = {
  artifact: AssistantMessageArtifact;
  blobUrl: string;
  onClose: () => void;
  onDownload: () => void;
};

export function EaArtifactPdfPreview({
  artifact,
  blobUrl,
  onClose,
  onDownload,
}: EaArtifactPdfPreviewProps) {
  const label = eaArtifactDisplayName(artifact);

  return (
    <div
      className="fixed inset-0 z-[220] flex flex-col bg-black/75 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${label}`}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#08111f] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{label}</p>
            <p className="text-[11px] text-white/45">PDF preview</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 transition hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <iframe
          title={label}
          src={blobUrl}
          className="min-h-0 flex-1 w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
