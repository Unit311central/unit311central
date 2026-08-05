"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  isCorporateInformationTab,
  legacyCorporateViewToTab,
  type CorporateInformationTab,
} from "@/lib/internal-operations-data";

import BankAccountsWorkspace from "./BankAccountsWorkspace";
import BoardDirectorsWorkspace from "./BoardDirectorsWorkspace";
import CapTableWorkspace from "./CapTableWorkspace";
import CompanyDetailsWorkspace from "./CompanyDetailsWorkspace";
import ContractsWorkspace from "./ContractsWorkspace";
import OfficeLocationsWorkspace from "./OfficeLocationsWorkspace";
import ProfessionalAdvisorsWorkspace from "./ProfessionalAdvisorsWorkspace";

function resolveTab(
  searchParams: URLSearchParams,
  forcedTab?: CorporateInformationTab,
): CorporateInformationTab {
  if (forcedTab) return forcedTab;
  const fromTab = searchParams.get("tab");
  if (isCorporateInformationTab(fromTab)) return fromTab;
  const fromView = legacyCorporateViewToTab(searchParams.get("view"));
  return fromView ?? "company-details";
}

/**
 * Hosts Corporate Information leaf workspaces.
 * Navigation is sidebar-only — no duplicate horizontal tabs.
 * Software Licences now lives under Technology Management.
 */
export default function CorporateInformationWorkspace({
  tab: forcedTab,
}: {
  tab?: CorporateInformationTab;
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<CorporateInformationTab>(() =>
    resolveTab(searchParams, forcedTab),
  );

  useEffect(() => {
    setTab(resolveTab(searchParams, forcedTab));
  }, [searchParams, forcedTab]);

  return (
    <div className="space-y-4">
      {tab === "company-details" ? <CompanyDetailsWorkspace /> : null}
      {tab === "cap-table" ? <CapTableWorkspace /> : null}
      {tab === "office-locations" ? <OfficeLocationsWorkspace /> : null}
      {tab === "bank-accounts" ? <BankAccountsWorkspace /> : null}
      {tab === "board-directors" ? <BoardDirectorsWorkspace /> : null}
      {tab === "professional-advisors" ? <ProfessionalAdvisorsWorkspace /> : null}
      {tab === "contracts" ? <ContractsWorkspace /> : null}
    </div>
  );
}
