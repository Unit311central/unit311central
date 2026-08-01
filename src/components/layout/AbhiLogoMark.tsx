"use client";

import { ABHI_LOGO_SRC, isAbhiSlug } from "@/lib/abhi-surface";
import { cn } from "@/lib/utils";

/** Intrinsic pixel size of abhi.jpg */
const LOGO_INTRINSIC_W = 152;
const LOGO_INTRINSIC_H = 83;

export { isAbhiSlug, ABHI_LOGO_SRC };

type AbhiLogoMarkProps = {
  className?: string;
  height?: number;
};

/**
 * ABHI logo for dark surfaces (login + sidebar).
 * White well keeps the magenta wordmark readable on navy UI.
 */
export default function AbhiLogoMark({
  className,
  height = 40,
}: AbhiLogoMarkProps) {
  const width = Math.round((height * LOGO_INTRINSIC_W) / LOGO_INTRINSIC_H);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-visible rounded-xl bg-white px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.35)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ABHI_LOGO_SRC}
        alt="ABHI"
        width={width}
        height={height}
        decoding="async"
        className="block object-contain object-center"
        style={{
          height,
          width,
          minWidth: width,
          maxWidth: "none",
        }}
      />
    </span>
  );
}
