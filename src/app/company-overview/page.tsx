import type { Metadata } from "next";

import NorthstarCompanyOverview from "@/components/demo/NorthstarCompanyOverview";

export const metadata: Metadata = {
  title: "Company Overview | Northstar Demo",
  robots: { index: false, follow: false },
};

export default function CompanyOverviewPage() {
  return (
    <div className="min-h-screen bg-[#07111f]">
      <NorthstarCompanyOverview />
    </div>
  );
}
