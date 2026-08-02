"use client";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";
import { cn } from "@/lib/utils";

type InfographicContent = Extract<LessonContent, { type: "infographic" }>;

type Props = {
  lesson: LmsLesson;
  content: InfographicContent;
  onComplete: () => void;
};

export default function InfographicLesson({ lesson, content, onComplete }: Props) {
  const layout = content.layout ?? "steps";

  return (
    <ImmersiveLessonShell
      eyebrow="Visual"
      title={content.title || lesson.title}
      sceneText={`${lesson.title} ${content.items.map((i) => i.label).join(" ")}`}
      onPrimary={onComplete}
      primaryLabel="Continue"
    >
      {layout === "flow" ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-stretch gap-2">
            {content.items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="w-44 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f9a8d4]/80">
                    {item.icon || `Step ${index + 1}`}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{item.body}</p>
                </div>
                {index < content.items.length - 1 ? (
                  <div className="h-px w-6 bg-gradient-to-r from-[#C2185B] to-transparent" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ol
          className={cn(
            "grid gap-3",
            layout === "grid" ? "sm:grid-cols-2" : "grid-cols-1",
          )}
        >
          {content.items.map((item, index) => (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#C2185B] to-[#f472b6]" />
              <div className="flex items-start gap-3 pl-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C2185B]/20 text-xs font-semibold text-[#f9a8d4]">
                  {item.icon || String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{item.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Lightweight SVG process ribbon for premium feel */}
      {layout === "steps" && content.items.length > 1 ? (
        <svg
          viewBox={`0 0 ${Math.max(320, content.items.length * 80)} 36`}
          className="mt-5 h-9 w-full text-[#C2185B]/70"
          aria-hidden
        >
          {content.items.map((_, i) => {
            const x = 24 + i * 80;
            return (
              <g key={i}>
                {i > 0 ? (
                  <line
                    x1={x - 56}
                    y1={18}
                    x2={x - 14}
                    y2={18}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                ) : null}
                <circle cx={x} cy={18} r={8} fill="currentColor" />
              </g>
            );
          })}
        </svg>
      ) : null}
    </ImmersiveLessonShell>
  );
}
