"use client";

import { startTransition, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import type { MotionStudioPreviewPayload } from "@/lib/motion-studio/types";

import { MotionStudioPlayer } from "./MotionStudioPlayer";

export type MotionStudioModalProps = {
  open: boolean;
  payload: MotionStudioPreviewPayload | null;
  onClose: () => void;
};

export function MotionStudioModal({ open, payload, onClose }: MotionStudioModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !payload) return null;

  const modalTitle = `Motion Studio — ${payload.title}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5"
      role="presentation"
      data-testid="motion-studio-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mx-auto flex max-h-[94svh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 shadow-2xl"
        data-testid="motion-studio-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/85">
              Motion Studio
            </p>
            <h2 id={titleId} className="truncate font-display text-base font-semibold text-white sm:text-lg">
              {modalTitle}
            </h2>
            <p className="text-[11px] text-white/45">16:9 playback · Play, pause, or scrub the timeline</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            data-testid="motion-studio-modal-close"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"
            aria-label="Close Motion Studio"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <MotionStudioPlayer payload={payload} autoPlay variant="full" />
      </div>
    </div>,
    document.body,
  );
}

/** Mount gate for SSR — avoids portal mismatch on first paint. */
export function MotionStudioModalHost(props: MotionStudioModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);
  if (!mounted) return null;
  return <MotionStudioModal {...props} />;
}
