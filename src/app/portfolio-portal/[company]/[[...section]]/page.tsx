import Link from "next/link";
import { notFound } from "next/navigation";

import PortalCourseLaunch from "@/components/lms/PortalCourseLaunch";
import { TalantonBoardPortalApp } from "@/components/talanton/board/TalantonBoardPortalApp";
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
  CompanyPortalTalantonUpdates,
  CompanyPortalTemplates,
  CompanyPortalTrainingCertificates,
  CompanyPortalTrainingCompleted,
  CompanyPortalTrainingHub,
  CompanyPortalTrainingInProgress,
} from "@/components/talanton/portal/CompanyPortalPanels";
import { CompanyPortalStoriesImpact } from "@/components/talanton/portal/CompanyPortalStoriesImpact";
import { parseTiBoardPortalSection } from "@/lib/talanton/board-portal-data";
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

const TRAINING_SUBLINKS = [
  { href: "/training/assigned", label: "Assigned" },
  { href: "/training/in-progress", label: "In Progress" },
  { href: "/training/completed", label: "Completed" },
  { href: "/training/certificates", label: "Certificates" },
] as const;

const STORIES_IMPACT_SUBLINKS = [
  { href: "/stories-impact", label: "Overview" },
  { href: "/stories-impact/submit-story", label: "Submit Story" },
  { href: "/stories-impact/story-history", label: "Story History" },
  { href: "/stories-impact/report-impact", label: "Report Impact" },
  { href: "/stories-impact/impact-history", label: "Impact History" },
] as const;

export default async function CompanyPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getCompanyPortalByPath(company);
  if (!route) notFound();

  if (route.portalKind === "board") {
    const boardSection = parseTiBoardPortalSection(section);
    if (!boardSection) notFound();
    return <TalantonBoardPortalApp section={boardSection} />;
  }

  const key = section.join("/");
  const base = `/${route.path}`;

  if (!key) {
    return <CompanyPortalHome companyId={route.companyId} />;
  }

  if (section[0] === "training" && section[1] === "course" && section[2]) {
    return (
      <PortalCourseLaunch courseSlug={section[2]} companyPath={route.path} />
    );
  }

  if (key === "training") {
    return (
      <div>
        <SubLinks base={base} items={[...TRAINING_SUBLINKS]} />
        <CompanyPortalTrainingHub />
      </div>
    );
  }
  if (key === "training/assigned") {
    return (
      <div>
        <SubLinks base={base} items={[...TRAINING_SUBLINKS]} />
        <CompanyPortalAssignedCourses companyPath={route.path} />
      </div>
    );
  }
  if (key === "training/in-progress") {
    return (
      <div>
        <SubLinks base={base} items={[...TRAINING_SUBLINKS]} />
        <CompanyPortalTrainingInProgress companyPath={route.path} />
      </div>
    );
  }
  if (key === "training/completed") {
    return (
      <div>
        <SubLinks base={base} items={[...TRAINING_SUBLINKS]} />
        <CompanyPortalTrainingCompleted companyPath={route.path} />
      </div>
    );
  }
  if (key === "training/certificates") {
    return (
      <div>
        <SubLinks base={base} items={[...TRAINING_SUBLINKS]} />
        <CompanyPortalTrainingCertificates />
      </div>
    );
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

  if (key === "stories-impact") {
    return (
      <div>
        <SubLinks base={base} items={[...STORIES_IMPACT_SUBLINKS]} />
        <CompanyPortalStoriesImpact companyId={route.companyId} initialTab="overview" />
      </div>
    );
  }
  if (key === "stories-impact/submit-story") {
    return (
      <div>
        <SubLinks base={base} items={[...STORIES_IMPACT_SUBLINKS]} />
        <CompanyPortalStoriesImpact companyId={route.companyId} initialTab="story-form" />
      </div>
    );
  }
  if (key === "stories-impact/story-history") {
    return (
      <div>
        <SubLinks base={base} items={[...STORIES_IMPACT_SUBLINKS]} />
        <CompanyPortalStoriesImpact companyId={route.companyId} initialTab="story-history" />
      </div>
    );
  }
  if (key === "stories-impact/report-impact") {
    return (
      <div>
        <SubLinks base={base} items={[...STORIES_IMPACT_SUBLINKS]} />
        <CompanyPortalStoriesImpact companyId={route.companyId} initialTab="impact-form" />
      </div>
    );
  }
  if (key === "stories-impact/impact-history") {
    return (
      <div>
        <SubLinks base={base} items={[...STORIES_IMPACT_SUBLINKS]} />
        <CompanyPortalStoriesImpact companyId={route.companyId} initialTab="impact-history" />
      </div>
    );
  }

  if (key === "updates") {
    return <CompanyPortalTalantonUpdates />;
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
