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
  children: (playSectionIntro: boolean, enteredView: boolean) => ReactNode;
}) {
  const { sectionRef, playSectionIntro, enteredView, sectionDataAttr } =
    useFinanceSectionIntro(sectionId);

  return (
    <section
      ref={sectionRef}
      data-finance-motion-section={sectionDataAttr}
      data-finance-motion-entered={enteredView ? "1" : "0"}
      data-qa-target={qaTarget}
      className={cn(className)}
    >
      {children(playSectionIntro, enteredView)}
    </section>
  );
}
