"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";

type FullscreenOverlayProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export default function FullscreenOverlay({
  open,
  title,
  onClose,
  children,
  className,
}: FullscreenOverlayProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#050816]/95 backdrop-blur-sm safe-area-pt safe-area-pb safe-area-px"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
            Fullscreen viewer
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-white">{title}</h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 rounded-xl text-xs"
          onClick={onClose}
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Exit fullscreen
        </Button>
      </div>
      <div className={cn("relative min-h-0 flex-1 pt-3", className)}>{children}</div>
    </div>
  );
}

export function FullscreenButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-8 rounded-xl text-xs"
      onClick={onClick}
    >
      <Maximize2 className="h-3.5 w-3.5" />
      Fullscreen
    </Button>
  );
}
