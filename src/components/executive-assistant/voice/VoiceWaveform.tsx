"use client";

import { cn } from "@/lib/utils";

export function VoiceWaveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] rounded-full bg-sky-300/90 origin-bottom",
            active ? "animate-pulse" : "opacity-40",
          )}
          style={{
            height: active ? `${6 + ((index * 3) % 10)}px` : "4px",
            animationDelay: `${index * 120}ms`,
            transform: active ? undefined : "scaleY(0.5)",
          }}
        />
      ))}
    </div>
  );
}
