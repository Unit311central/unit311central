import Image from "next/image";

import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { cn } from "@/lib/utils";

export const TALANTON_LOGO_SRC = "/images/workspaces/talantonimpact-t.jpg";

export { isTalantonImpactSlug };

type TalantonLogoMarkProps = {
  className?: string;
  height?: number;
};

/** Talanton Impact logo on a white well for dark sidebar / login surfaces. */
export default function TalantonLogoMark({
  className,
  height = 40,
}: TalantonLogoMarkProps) {
  const width = Math.round(height * (220 / 48));
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.35)]",
        className,
      )}
    >
      <Image
        src={TALANTON_LOGO_SRC}
        alt="Talanton Impact"
        width={width}
        height={height}
        className="h-auto w-auto max-w-full object-contain object-center"
        style={{ height, width: "auto", maxWidth: width }}
        priority
      />
    </span>
  );
}
