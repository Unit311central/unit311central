"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC } from "@/lib/unit311-central-homepage-video";

type Unit311CentralOverviewVideoModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Permanent Unit311 Central homepage overview player (hero "Watch Overview").
 * Keep this component — do not replace with workspace-specific or loop-demo players.
 */
export default function Unit311CentralOverviewVideoModal({
  open,
  onClose,
}: Unit311CentralOverviewVideoModalProps) {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const video = videoRef.current;
    if (!open || !video) return;

    video.currentTime = 0;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;

    void video.play().catch(() => {
      video.muted = true;
      video.defaultMuted = true;
      void video.play().catch(() => {});
    });

    return () => {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Ignore seek errors while the element is tearing down.
      }
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#020617]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-overview-video-title"
        className="relative max-h-[92svh] w-full overflow-hidden rounded-t-[24px] border border-white/15 bg-[#07111F] shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:max-w-4xl sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close overview video"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full border border-white/10 bg-black/40 p-2 text-white/80 hover:bg-black/60 hover:text-white sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/10 px-4 py-3 pr-12 sm:px-5 sm:py-4 sm:pr-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
            Unit311 Central
          </p>
          <h2 id="home-overview-video-title" className="mt-1 text-base font-semibold text-white sm:text-lg">
            Platform overview
          </h2>
        </div>

        <div className="p-3 sm:p-5">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#0b1220] sm:rounded-2xl">
            <video
              ref={videoRef}
              key={UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC}
              className="h-full w-full object-contain object-center"
              src={UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC}
              controls
              playsInline
              preload="auto"
              disablePictureInPicture
              aria-label="Unit311 Central platform overview video"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
