import Image from "next/image";

import { cn } from "@/lib/utils";

export const CORPCENTRE_LOGO_SRC = "/images/workspaces/corplogo.jpg";

const CORPCENTRE_SLUGS = new Set(["corpcentre", "corporatecentre"]);

export function isCorpCentreSlug(slug: string | null | undefined): boolean {
  return Boolean(slug && CORPCENTRE_SLUGS.has(slug.trim().toLowerCase()));
}

type CorpCentreLogoMarkProps = {
  className?: string;
  height?: number;
};

/** Official Corp.Centre logo (corplogo.jpg) on a white well for dark surfaces. */
export default function CorpCentreLogoMark({
  className,
  height = 40,
}: CorpCentreLogoMarkProps) {
  const width = Math.round(height * (220 / 48));
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.35)]",
        className,
      )}
    >
      <Image
        src={CORPCENTRE_LOGO_SRC}
        alt="Corp.Centre"
        width={width}
        height={height}
        className="h-auto w-auto max-w-full object-contain object-center"
        style={{ height, width: "auto", maxWidth: width }}
        priority
      />
    </span>
  );
}
