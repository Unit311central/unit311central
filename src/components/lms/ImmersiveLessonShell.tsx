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
};

export default function ImmersiveLessonShell({
  eyebrow,
  title,
  subtitle,
  sceneText,
  imageUrl,
  children,
  footer,
  primaryLabel = "Next",
  primaryDisabled = false,
  primaryLoading = false,
  onPrimary,
  wide = false,
}: Props) {
  const scene = resolveQuestionScene(sceneText || `${eyebrow} ${title}`);
  const hero = imageUrl || scene.imageUrl;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-[calc(100vh-9.5rem)] w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1628] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] lg:flex-row",
        wide ? "max-w-6xl" : "max-w-5xl",
      )}
    >
      <div className="relative h-44 shrink-0 overflow-hidden sm:h-56 lg:h-auto lg:w-[40%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          key={hero}
          initial={{ scale: 1.06, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55 }}
          src={hero}
          alt={scene.label}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/75 to-transparent p-4 pt-16 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-1/2 lg:bg-gradient-to-l lg:via-[#0a1628]/55 lg:pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
            {scene.label}
          </p>
          <p className="mt-1 text-sm text-white/85">{scene.caption}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-relaxed text-white/60">{subtitle}</p> : null}

        <div className="mt-5 flex-1">{children}</div>

        {(onPrimary || footer) && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
            <div className="text-xs text-white/40">{footer}</div>
            {onPrimary ? (
              <button
                type="button"
                disabled={primaryDisabled || primaryLoading}
                onClick={onPrimary}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {primaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {primaryLabel}
                {!primaryLoading ? <ChevronRight className="h-4 w-4" /> : null}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
