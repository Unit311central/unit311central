"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import CrmWorkspace from "@/components/testflighthub/CrmWorkspace";
import SalesQuotesWorkspace from "@/components/testflighthub/SalesQuotesWorkspace";
import { SalesFilterBar, SalesFilterButton, SalesTabHeader } from "./sales-management-ui";

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
      <SalesTabHeader
        title="Opportunities"
        description="Qualified and active deals from the shared CRM register, with optional quote panel."
      />

      <SalesFilterBar>
        {tabs.map((tab) => (
          <SalesFilterButton key={tab.id} active={subview === tab.id} onClick={() => setSubview(tab.id)}>
            {tab.label}
          </SalesFilterButton>
        ))}
      </SalesFilterBar>

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
