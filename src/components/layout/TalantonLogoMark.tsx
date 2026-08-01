"use client";

import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { cn } from "@/lib/utils";

/** Full Talanton wordmark (dark text on light ground) — from repo `t.jpg`. */
export const TALANTON_LOGO_SRC = "/images/workspaces/talantonimpact-t.jpg";

/** Intrinsic pixel size of t.jpg */
const LOGO_INTRINSIC_W = 277;
const LOGO_INTRINSIC_H = 70;

export { isTalantonImpactSlug };

type TalantonLogoMarkProps = {
  className?: string;
  height?: number;
};

/**
 * Talanton Impact logo for dark surfaces.
 * Uses a plain <img> (not next/image) so the full wordmark is never cropped
 * by the optimizer or a too-narrow max-width.
 */
export default function TalantonLogoMark({
  className,
  height = 40,
}: TalantonLogoMarkProps) {
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
        src={TALANTON_LOGO_SRC}
        alt="Talanton Impact"
        width={width}
        height={height}
        decoding="async"
        className="block object-contain object-left"
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
