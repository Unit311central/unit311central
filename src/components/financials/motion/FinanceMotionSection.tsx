"use client";

import type { ReactNode } from "react";

import {
  useFinanceSectionIntro,
  type FinanceMotionSectionId,
} from "@/components/dashboard-framework/motion/finance-living-motion";
import { cn } from "@/lib/utils";

export function FinanceMotionSection({
  sectionId,
  className,
  qaTarget,
  children,
}: {
  sectionId: FinanceMotionSectionId;
  className?: string;
  qaTarget?: string;
  children: (playSectionIntro: boolean) => ReactNode;
}) {
  const { sectionRef, playSectionIntro, sectionDataAttr } = useFinanceSectionIntro(sectionId);

  return (
    <section
      ref={sectionRef}
      data-finance-motion-section={sectionDataAttr}
      data-qa-target={qaTarget}
      className={cn(className)}
    >
      {children(playSectionIntro)}
    </section>
  );
}
