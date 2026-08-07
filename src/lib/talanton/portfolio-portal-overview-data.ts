import { companyPortalAbsoluteUrl, TALANTON_COMPANY_PORTAL_ROUTES } from "@/lib/talanton/company-portal-routes";

export type QuarterlySummaryStatus = "Submitted" | "Due soon" | "Overdue";

export type PortfolioPortalOverviewRow = {
  companyId: string;
  companyName: string;
  path: string;
  portalUrl: string;
  newStoriesLogged: number;
  lastActivity: string;
  lastActivityDetail: string;
  quarterlySummaryStatus: QuarterlySummaryStatus;
  quarterlySummaryDue: string;
  portalStatus: "Active" | "Invited" | "Inactive";
};

const ACTIVITY_DETAILS = [
  "Uploaded Q2 impact story draft",
  "CEO logged into portal",
  "Finance lead viewed quarterly template",
  "Submitted compliance attestation",
  "Added 2 journey story photos",
  "Reviewed board pack excerpt",
  "Updated cap table disclosure",
  "Commented on ESG checklist",
] as const;

export function buildPortfolioPortalOverviewRows(): PortfolioPortalOverviewRow[] {
  return TALANTON_COMPANY_PORTAL_ROUTES.filter((r) => r.portalKind !== "board" && r.companyId).map(
    (route, idx) => {
      const day = String(3 + (idx % 24)).padStart(2, "0");
      const month = String((idx % 5) + 3).padStart(2, "0");
      const dueMonth = String(((idx % 4) + 6)).padStart(2, "0");
      const quarterlySummaryStatus: QuarterlySummaryStatus =
        idx % 7 === 0 ? "Overdue" : idx % 5 === 0 ? "Due soon" : "Submitted";
      return {
        companyId: route.companyId,
        companyName: route.displayName,
        path: route.path,
        portalUrl: companyPortalAbsoluteUrl(route),
        newStoriesLogged: 1 + (idx % 6),
        lastActivity: `2026-${month}-${day}`,
        lastActivityDetail: ACTIVITY_DETAILS[idx % ACTIVITY_DETAILS.length]!,
        quarterlySummaryStatus,
        quarterlySummaryDue: `2026-${dueMonth}-${String(15 + (idx % 10)).padStart(2, "0")}`,
        portalStatus: idx % 11 === 0 ? "Invited" : idx % 13 === 0 ? "Inactive" : "Active",
      };
    },
  );
}

export function portfolioPortalOverviewSummary(rows: PortfolioPortalOverviewRow[]) {
  const newStories = rows.reduce((sum, row) => sum + row.newStoriesLogged, 0);
  const overdueQuarterly = rows.filter((row) => row.quarterlySummaryStatus === "Overdue").length;
  const dueSoonQuarterly = rows.filter((row) => row.quarterlySummaryStatus === "Due soon").length;
  const activePortals = rows.filter((row) => row.portalStatus === "Active").length;
  const latestActivity = rows.reduce(
    (latest, row) => (row.lastActivity > latest ? row.lastActivity : latest),
    "2026-01-01",
  );
  return {
    newStories,
    overdueQuarterly,
    dueSoonQuarterly,
    activePortals,
    totalPortals: rows.length,
    latestActivity,
  };
}
