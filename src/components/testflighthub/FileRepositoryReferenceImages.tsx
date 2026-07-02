"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Download, X, ZoomIn } from "lucide-react";

const referenceImages = [
  {
    src: "/images/what.png",
    alt: "Operations overview diagram",
    title: "What we deliver",
    fileName: "what.png",
  },
  {
    src: "/images/architecture.png",
    alt: "Platform architecture diagram",
    title: "Architecture",
    fileName: "architecture.png",
  },
] as const;

type ReferenceImage = (typeof referenceImages)[number];

export default function FileRepositoryReferenceImages() {
  const [activeImage, setActiveImage] = useState<ReferenceImage | null>(null);

  const closeLightbox = useCallback(() => setActiveImage(null), []);

  useEffect(() => {
    if (!activeImage) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImage, closeLightbox]);

  return (
    <>
      <section className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
            Reference
          </p>
          <h2 className="mt-1 text-sm font-semibold text-white">Platform diagrams</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {referenceImages.map((image) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveImage(image)}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0b1220] text-left transition-colors hover:border-sky-400/35 hover:bg-white/[0.03]"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{image.title}</p>
                  <p className="text-xs text-white/45">Click to enlarge or download</p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 transition-colors group-hover:border-sky-400/30 group-hover:text-sky-300">
                  <ZoomIn className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
          onClick={closeLightbox}
        >
          <div
            className="relative flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1220] shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <p className="text-sm font-semibold text-white">{activeImage.title}</p>
                <p className="text-xs text-white/45">{activeImage.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeImage.src}
                  download={activeImage.fileName}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={cn("relative min-h-[240px] flex-1 bg-[#07111f]")}>
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                className="object-contain p-4 sm:p-6"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
