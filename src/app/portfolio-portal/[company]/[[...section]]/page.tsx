import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CompanyPortalAssignedCourses,
  CompanyPortalCourseCompletion,
  CompanyPortalDocumentsHub,
  CompanyPortalHome,
  CompanyPortalMyTraining,
  CompanyPortalPolicies,
  CompanyPortalReportsHub,
  CompanyPortalSharedDocuments,
  CompanyPortalSubmitReport,
  CompanyPortalSubmittedReports,
  CompanyPortalTemplates,
  CompanyPortalTrainingHub,
} from "@/components/talanton/portal/CompanyPortalPanels";
import { getCompanyPortalByPath } from "@/lib/talanton/company-portal-routes";

function SubLinks({
  base,
  items,
}: {
  base: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={`${base}${item.href}`}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 hover:border-emerald-400/40 hover:text-emerald-200"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default async function CompanyPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getCompanyPortalByPath(company);
  if (!route) notFound();

  const key = section.join("/");
  const base = `/${route.path}`;

  if (!key) {
    return <CompanyPortalHome companyId={route.companyId} />;
  }

  if (key === "training") {
    return (
      <div>
        <SubLinks
          base={base}
          items={[
            { href: "/training/assigned", label: "Assigned Courses" },
            { href: "/training/my-training", label: "My Training" },
            { href: "/training/completion", label: "Course Completion" },
          ]}
        />
        <CompanyPortalTrainingHub />
      </div>
    );
  }
  if (key === "training/assigned") {
    return <CompanyPortalAssignedCourses />;
  }
  if (key === "training/my-training") {
    return <CompanyPortalMyTraining companyId={route.companyId} />;
  }
  if (key === "training/completion") {
    return <CompanyPortalCourseCompletion companyId={route.companyId} />;
  }

  if (key === "reports") {
    return (
      <div>
        <SubLinks
          base={base}
          items={[
            { href: "/reports/submit", label: "Submit Quarterly Report" },
            { href: "/reports/submitted", label: "Submitted Reports" },
          ]}
        />
        <CompanyPortalReportsHub />
      </div>
    );
  }
  if (key === "reports/submit") {
    return <CompanyPortalSubmitReport companyId={route.companyId} />;
  }
  if (key === "reports/submitted") {
    return <CompanyPortalSubmittedReports companyId={route.companyId} />;
  }

  if (key === "documents") {
    return (
      <div>
        <SubLinks
          base={base}
          items={[
            { href: "/documents/policies", label: "Policies" },
            { href: "/documents/templates", label: "Templates" },
            { href: "/documents/shared", label: "Shared Documents" },
          ]}
        />
        <CompanyPortalDocumentsHub />
      </div>
    );
  }
  if (key === "documents/policies") {
    return <CompanyPortalPolicies />;
  }
  if (key === "documents/templates") {
    return <CompanyPortalTemplates />;
  }
  if (key === "documents/shared") {
    return <CompanyPortalSharedDocuments companyId={route.companyId} />;
  }

  notFound();
}
