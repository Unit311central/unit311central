"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Film,
  ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";

import { formatFileSize } from "@/lib/internal-files-data";
import type { InformationRepositoryRecordAttachment } from "@/lib/unit311-details-data";
import { cn } from "@/lib/utils";

type InformationRepositoryAttachmentCarouselProps = {
  attachments: InformationRepositoryRecordAttachment[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onEdit: (attachment: InformationRepositoryRecordAttachment) => void;
  onDelete: (attachment: InformationRepositoryRecordAttachment) => void;
  busy?: boolean;
};

function isImageAttachment(attachment: InformationRepositoryRecordAttachment) {
  return Boolean(attachment.mimeType?.startsWith("image/"));
}

function isVideoAttachment(attachment: InformationRepositoryRecordAttachment) {
  return Boolean(attachment.mimeType?.startsWith("video/"));
}

function isPdfAttachment(attachment: InformationRepositoryRecordAttachment) {
  return attachment.mimeType === "application/pdf" || attachment.name.toLowerCase().endsWith(".pdf");
}

function attachmentIcon(attachment: InformationRepositoryRecordAttachment) {
  if (isImageAttachment(attachment)) return ImageIcon;
  if (isVideoAttachment(attachment)) return Film;
  return FileText;
}

export default function InformationRepositoryAttachmentCarousel({
  attachments,
  activeIndex,
  onActiveIndexChange,
  onEdit,
  onDelete,
  busy = false,
}: InformationRepositoryAttachmentCarouselProps) {
  const [brokenPreview, setBrokenPreview] = useState(false);
  const activeAttachment = attachments[activeIndex] ?? null;

  useEffect(() => {
    setBrokenPreview(false);
  }, [activeAttachment?.id, activeAttachment?.url]);

  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < attachments.length - 1;

  const preview = useMemo(() => {
    if (!activeAttachment) return null;
    if (isImageAttachment(activeAttachment) && !brokenPreview) {
      return (
        <img
          src={activeAttachment.url}
          alt={activeAttachment.name}
          className="max-h-[28rem] w-full rounded-xl object-contain"
          onError={() => setBrokenPreview(true)}
        />
      );
    }
    if (isVideoAttachment(activeAttachment)) {
      return (
        <video
          key={activeAttachment.id}
          src={activeAttachment.url}
          controls
          className="max-h-[28rem] w-full rounded-xl bg-black"
        />
      );
    }
    if (isPdfAttachment(activeAttachment)) {
      return (
        <iframe
          title={activeAttachment.name}
          src={activeAttachment.url}
          className="h-[28rem] w-full rounded-xl border border-white/10 bg-white"
        />
      );
    }
    const Icon = attachmentIcon(activeAttachment);
    return (
      <div className="flex h-[18rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0b1524]/50 px-6 text-center">
        <Icon className="h-10 w-10 text-sky-300/80" />
        <p className="mt-4 text-sm font-medium text-white">{activeAttachment.name}</p>
        <p className="mt-1 text-xs text-white/45">
          {formatFileSize(activeAttachment.sizeBytes)} · Preview not available
        </p>
      </div>
    );
  }, [activeAttachment, brokenPreview]);

  if (!activeAttachment) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0b1524]/40 px-6 text-center text-sm text-white/45">
        No files uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07111f] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{activeAttachment.name}</p>
            <p className="mt-0.5 text-xs text-white/45">
              {formatFileSize(activeAttachment.sizeBytes)}
              {activeAttachment.caption ? ` · ${activeAttachment.caption}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={activeAttachment.url}
              download={activeAttachment.name}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/80 transition hover:bg-white/[0.08]"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
            <a
              href={activeAttachment.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/80 transition hover:bg-white/[0.08]"
            >
              View
            </a>
            <button
              type="button"
              disabled={busy}
              onClick={() => onEdit(activeAttachment)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(activeAttachment)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-center">
          {attachments.length > 1 ? (
            <button
              type="button"
              disabled={!canGoBack || busy}
              onClick={() => onActiveIndexChange(activeIndex - 1)}
              className="absolute left-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
              aria-label="Previous file"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="w-full px-10">{preview}</div>
          {attachments.length > 1 ? (
            <button
              type="button"
              disabled={!canGoForward || busy}
              onClick={() => onActiveIndexChange(activeIndex + 1)}
              className="absolute right-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
              aria-label="Next file"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        {attachments.length > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {attachments.map((attachment, index) => {
              const Icon = attachmentIcon(attachment);
              return (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => onActiveIndexChange(index)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                    index === activeIndex
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                      : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="max-w-[10rem] truncate">{attachment.name}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
