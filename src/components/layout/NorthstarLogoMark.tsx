"use client";

import { isNorthstarDemoSlug, NORTHSTAR_LOGO_SRC } from "@/lib/demo/northstar-surface";
import { cn } from "@/lib/utils";

export { isNorthstarDemoSlug, NORTHSTAR_LOGO_SRC };

type NorthstarLogoMarkProps = {
  className?: string;
  /** Base display height in CSS pixels (wordmark scales ~25% above legacy 32px default). */
  height?: number;
  maxWidth?: number;
  priority?: boolean;
};

/**
 * Northstar wordmark — NORTHSTAR (white) + INDUSTRIAL TECHNOLOGIES (sky blue), no image box.
 */
export default function NorthstarLogoMark({
  className,
  height = 40,
  maxWidth = 230,
}: NorthstarLogoMarkProps) {
  const titleSize = Math.round(height * 0.42);
  const subtitleSize = Math.round(height * 0.22);

  return (
    <span
      className={cn("inline-flex min-w-0 flex-col leading-none bg-transparent", className)}
      style={{ maxWidth }}
    >
      <span
        className="font-bold tracking-[0.06em] text-white"
        style={{ fontSize: titleSize, lineHeight: 1.05 }}
      >
        NORTHSTAR
      </span>
      <span
        className="mt-0.5 font-semibold uppercase tracking-[0.14em] text-sky-400"
        style={{ fontSize: subtitleSize, lineHeight: 1.1 }}
      >
        Industrial Technologies
      </span>
    </span>
  );
}
