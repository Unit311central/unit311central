"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";

import { resolveQuestionScene } from "@/lib/lms/question-scenes";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  sceneText?: string;
  imageUrl?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrimary?: () => void;
  wide?: boolean;
  /** Hide the visual band for compact inline scroll sections. */
  compact?: boolean;
};

/**
 * Vertical learning section shell — stacked visual + content (not a side-by-side LMS card).
 */
export default function ImmersiveLessonShell({
  eyebrow,
  title,
  subtitle,
  sceneText,
  imageUrl,
  children,
  footer,
  primaryLabel = "Continue",
  primaryDisabled = false,
  primaryLoading = false,
  onPrimary,
  wide = false,
  compact = false,
}: Props) {
  const scene = resolveQuestionScene(sceneText || `${eyebrow} ${title}`);
  const hero = imageUrl || scene.imageUrl;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d1a2e] to-[#0a1424] shadow-[0_24px_60px_-36px_rgba(0,0,0,0.85)]",
        wide ? "max-w-4xl" : "max-w-3xl",
      )}
    >
      {!compact ? (
        <div className="relative h-36 overflow-hidden sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt={scene.label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1424] via-[#0a1424]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f472b6]">
              {scene.label}
            </p>
            <p className="mt-1 max-w-xl text-sm text-white/80">{scene.caption}</p>
          </div>
        </div>
      ) : null}

      <div className="p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f9a8d4]/80">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{subtitle}</p>
        ) : null}

        <div className="mt-5">{children}</div>

        {(onPrimary || footer) && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
            <div className="text-xs text-white/40">{footer}</div>
            {onPrimary ? (
              <button
                type="button"
                disabled={primaryDisabled || primaryLoading}
                onClick={onPrimary}
                className="inline-flex items-center gap-2 rounded-full bg-[#C2185B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a3134c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {primaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {primaryLabel}
                {!primaryLoading ? <ChevronRight className="h-4 w-4" /> : null}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </motion.section>
  );
}
