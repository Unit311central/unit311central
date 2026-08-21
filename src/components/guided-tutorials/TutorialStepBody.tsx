"use client";

import type { TutorialStep } from "@/lib/guided-tutorials/types";
import { cn } from "@/lib/utils";

type TutorialStepBodyProps = {
  step: TutorialStep;
  hasTarget: boolean;
};

function MediaFigure({ step }: { step: TutorialStep }) {
  const media = step.media;
  if (!media?.assetUrl) return null;

  const caption = media.caption;
  const alt = media.alt ?? step.title;

  if (step.presentation === "video") {
    return (
      <figure className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <video
          className="max-h-44 w-full object-contain"
          src={media.assetUrl}
          poster={media.posterUrl}
          controls
          playsInline
          preload="metadata"
        />
        {caption ? (
          <figcaption className="border-t border-white/8 px-3 py-2 text-[11px] text-white/45">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (step.presentation === "animation") {
    return (
      <figure className="mt-3 overflow-hidden rounded-xl border border-violet-400/20 bg-violet-500/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.assetUrl}
          alt={alt}
          className={cn(
            "max-h-44 w-full object-contain p-2",
            step.presentation === "animation" && "animate-pulse",
          )}
        />
        {caption ? (
          <figcaption className="border-t border-white/8 px-3 py-2 text-[11px] text-white/45">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure
      className={cn(
        "mt-3 overflow-hidden rounded-xl border bg-black/20",
        step.presentation === "diagram"
          ? "border-sky-400/20 bg-sky-500/5"
          : "border-white/10",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.assetUrl} alt={alt} className="max-h-44 w-full object-contain p-1" />
      {caption ? (
        <figcaption className="border-t border-white/8 px-3 py-2 text-[11px] text-white/45">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function TutorialStepBody({ step, hasTarget }: TutorialStepBodyProps) {
  return (
    <>
      <h3 className="text-sm font-semibold tracking-tight">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>

      <MediaFigure step={step} />

      {step.presentation === "try" && step.tryPrompt ? (
        <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Try it: {step.tryPrompt}
        </p>
      ) : null}

      {step.actions?.length ? (
        <ul className="mt-3 space-y-1 text-xs text-white/50">
          {step.actions.map((action) => (
            <li key={action} className="flex gap-2">
              <span className="text-sky-300">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!hasTarget && step.targetId ? (
        <p className="mt-3 text-[11px] text-white/40">
          This area isn&apos;t visible right now — scroll or widen the window, then continue.
        </p>
      ) : null}
    </>
  );
}
