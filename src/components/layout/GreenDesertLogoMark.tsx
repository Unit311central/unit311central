"use client";

import {
  GREENDESERT_DISPLAY_NAME,
  GREENDESERT_WORKSPACE_LOGO_INTRINSIC_HEIGHT,
  GREENDESERT_WORKSPACE_LOGO_INTRINSIC_WIDTH,
  GREENDESERT_WORKSPACE_LOGO_SRC,
  isGreenDesertSlug,
} from "@/lib/greendesert-surface";
import { cn } from "@/lib/utils";

export { isGreenDesertSlug, GREENDESERT_WORKSPACE_LOGO_SRC };

type GreenDesertLogoMarkProps = {
  className?: string;
  height?: number;
  maxWidth?: number;
  priority?: boolean;
};

export default function GreenDesertLogoMark({
  className,
  height = 32,
  maxWidth = 180,
  priority = false,
}: GreenDesertLogoMarkProps) {
  let width = Math.round(
    (height * GREENDESERT_WORKSPACE_LOGO_INTRINSIC_WIDTH) /
      GREENDESERT_WORKSPACE_LOGO_INTRINSIC_HEIGHT,
  );
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round(
      (width * GREENDESERT_WORKSPACE_LOGO_INTRINSIC_HEIGHT) /
        GREENDESERT_WORKSPACE_LOGO_INTRINSIC_WIDTH,
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-visible bg-transparent p-0",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={GREENDESERT_WORKSPACE_LOGO_SRC}
        alt={GREENDESERT_DISPLAY_NAME}
        width={width}
        height={displayHeight}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="block bg-transparent object-contain object-left"
        style={{
          height: displayHeight,
          width,
          minWidth: width,
          maxWidth,
        }}
      />
    </span>
  );
}
