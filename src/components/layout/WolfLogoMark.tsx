"use client";

import { WOLF_DISPLAY_NAME, WOLF_TAGLINE } from "@/lib/wolf/wolf-surface";
import { cn } from "@/lib/utils";

type WolfLogoMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
};

export default function WolfLogoMark({
  className,
  size = "md",
  showTagline = true,
}: WolfLogoMarkProps) {
  const titleSize =
    size === "lg" ? "text-3xl sm:text-4xl" : size === "sm" ? "text-xl" : "text-2xl sm:text-3xl";
  const taglineSize =
    size === "lg" ? "text-[11px] sm:text-xs" : size === "sm" ? "text-[9px]" : "text-[10px] sm:text-[11px]";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          titleSize,
          "font-semibold tracking-[0.28em] text-white uppercase leading-none",
        )}
      >
        {WOLF_DISPLAY_NAME}
      </span>
      {showTagline ? (
        <span
          className={cn(
            taglineSize,
            "font-medium tracking-[0.14em] text-white/55 uppercase",
          )}
        >
          {WOLF_TAGLINE}
        </span>
      ) : null}
    </div>
  );
}
