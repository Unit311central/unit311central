"use client";

import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function useMobileDetailPanel(initialOpen = false) {
  const [showDetail, setShowDetail] = useState(initialOpen);
  const openDetail = useCallback(() => setShowDetail(true), []);
  const closeDetail = useCallback(() => setShowDetail(false), []);
  return { showDetail, setShowDetail, openDetail, closeDetail };
}

type ResponsiveMasterDetailProps = {
  master: React.ReactNode;
  detail: React.ReactNode | null;
  showDetail: boolean;
  onBack: () => void;
  backLabel?: string;
  className?: string;
  columnsClassName?: string;
  masterClassName?: string;
  detailClassName?: string;
};

export default function ResponsiveMasterDetail({
  master,
  detail,
  showDetail,
  onBack,
  backLabel = "Back to list",
  className,
  columnsClassName = "xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]",
  masterClassName,
  detailClassName,
}: ResponsiveMasterDetailProps) {
  const mobileDetailOpen = showDetail && detail != null;

  return (
    <div className={cn("grid gap-4 sm:gap-6", columnsClassName, className)}>
      <div className={cn(mobileDetailOpen ? "hidden xl:block" : "block", masterClassName)}>
        {master}
      </div>
      {detail ? (
        <div className={cn(mobileDetailOpen ? "block" : "hidden xl:block", detailClassName)}>
          {mobileDetailOpen ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/55 transition-colors hover:text-white/80 xl:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </button>
          ) : null}
          {detail}
        </div>
      ) : null}
    </div>
  );
}
