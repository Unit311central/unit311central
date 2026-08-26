"use client";

import {
  isSaecSlug,
  SAEC_LOGO_INTRINSIC_HEIGHT,
  SAEC_LOGO_INTRINSIC_WIDTH,
  SAEC_WORKSPACE_LOGO_SRC,
} from "@/lib/saec-surface";
import { cn } from "@/lib/utils";

export { isSaecSlug, SAEC_WORKSPACE_LOGO_SRC };

type SaecLogoMarkProps = {
  className?: string;
  height?: number;
  maxWidth?: number;
  priority?: boolean;
};

/** OmniTransit workspace wordmark — sidebar and login. */
export default function SaecLogoMark({
  className,
  height = 32,
  maxWidth = 180,
  priority = false,
}: SaecLogoMarkProps) {
  let width = Math.round(
    (height * SAEC_LOGO_INTRINSIC_WIDTH) / SAEC_LOGO_INTRINSIC_HEIGHT,
  );
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round(
      (width * SAEC_LOGO_INTRINSIC_HEIGHT) / SAEC_LOGO_INTRINSIC_WIDTH,
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
        src={SAEC_WORKSPACE_LOGO_SRC}
        alt="OmniTransit"
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
