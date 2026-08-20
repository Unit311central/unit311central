"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import CrmWorkspace from "@/components/testflighthub/CrmWorkspace";
import SalesQuotesWorkspace from "@/components/testflighthub/SalesQuotesWorkspace";
import { cn } from "@/lib/utils";

type OpportunitiesSubview = "deals" | "quotes";

export default function SalesManagementOpportunitiesTab({
  quotesReturnHref,
}: {
  quotesReturnHref: string;
}) {
  const searchParams = useSearchParams();
  const [subview, setSubview] = useState<OpportunitiesSubview>(() =>
    searchParams.get("panel") === "quotes" ? "quotes" : "deals",
  );

  useEffect(() => {
    setSubview(searchParams.get("panel") === "quotes" ? "quotes" : "deals");
  }, [searchParams]);

  const tabs = useMemo(
    () =>
      [
        { id: "deals" as const, label: "Opportunities" },
        { id: "quotes" as const, label: "Sales Quotes" },
      ] as const,
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubview(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              subview === tab.id
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subview === "deals" ? (
        <CrmWorkspace
          variant="opportunities"
          embedded
          quotesReturnHref={quotesReturnHref}
          title="Opportunities"
          subtitle="Qualified and active deals from the shared CRM lead register."
        />
      ) : (
        <SalesQuotesWorkspace embedded title="Sales quotes" />
      )}
    </div>
  );
}
