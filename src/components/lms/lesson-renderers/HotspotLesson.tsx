"use client";

import { useState } from "react";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";
import { cn } from "@/lib/utils";

type HotspotContent = Extract<LessonContent, { type: "hotspot" }>;

type Props = {
  lesson: LmsLesson;
  content: HotspotContent;
  onComplete: () => void;
};

export default function HotspotLesson({ lesson, content, onComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = content.regions.find((r) => r.id === selectedId) ?? null;
  const answered = Boolean(selected);

  return (
    <ImmersiveLessonShell
      eyebrow="Hotspot"
      title={content.title || lesson.title}
      subtitle={content.prompt}
      sceneText={`${lesson.title} ${content.prompt}`}
      primaryLabel="Continue"
      primaryDisabled={!answered}
      onPrimary={onComplete}
      footer={answered ? selected?.feedback : "Tap a highlighted area"}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.imageUrl} alt={content.title || lesson.title} className="w-full object-cover" />
        {content.regions.map((region) => (
          <button
            key={region.id}
            type="button"
            aria-label={region.label}
            onClick={() => setSelectedId(region.id)}
            style={{
              left: `${region.x}%`,
              top: `${region.y}%`,
              width: `${region.w}%`,
              height: `${region.h}%`,
            }}
            className={cn(
              "absolute rounded-lg border-2 transition",
              selectedId === region.id
                ? region.correct
                  ? "border-emerald-400 bg-emerald-400/25"
                  : "border-rose-400 bg-rose-400/20"
                : "border-white/50 bg-white/10 hover:bg-white/20",
            )}
          />
        ))}
      </div>
      {selected ? (
        <p
          className={cn(
            "mt-4 rounded-xl border px-3 py-2 text-sm",
            selected.correct
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-500/10 text-rose-100",
          )}
        >
          {selected.feedback}
        </p>
      ) : null}
    </ImmersiveLessonShell>
  );
}
