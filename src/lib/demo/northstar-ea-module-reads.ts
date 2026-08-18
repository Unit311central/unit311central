/**
 * Northstar demo — EA module read adapters (all sidebar modules + sub-pages).
 */

import "server-only";

import { getNorthstarMarketingBundle } from "@/lib/demo/northstar-marketing-store";
import {
  buildNorthstarCapTableSnapshot,
  NORTHSTAR_COMPANY_NAME,
} from "@/lib/demo/northstar-cap-table-data";
import { NORTHSTAR_CORPORATE_CONTRACTS } from "@/lib/demo/northstar-corporate-contracts";
import { NORTHSTAR_OFFICE_MAP_MARKERS } from "@/lib/demo/northstar-office-map-data";
import {
  getNorthstarOperationsDashboardSummary,
  getNorthstarInventoryCharts,
  getNorthstarProcurementSeed,
  formatNorthstarGbp,
} from "@/lib/demo/northstar-operations-data";
import {
  buildNorthstarTechSpendTrend,
  formatNorthstarTechGbp,
  NORTHSTAR_TECH_HARDWARE,
  NORTHSTAR_TECH_TELECOM,
} from "@/lib/demo/northstar-tech-data";
import { NORTHSTAR_TECH_TELECOMS } from "@/lib/demo/northstar-telecom-data";
import {
  buildNorthstarLeaveRequests,
  buildNorthstarRecruitmentVacancies,
  buildNorthstarHrReports,
  getNorthstarHrEmployees,
  getNorthstarPayrollDashboard,
  buildNorthstarHrMockState,
} from "@/lib/demo/northstar-hr-data";
import { buildNorthstarHeadcountGrowthSummary } from "@/lib/demo/northstar-hr-headcount-history";
import { getNorthstarDemoProjects } from "@/lib/demo/northstar-projects-data";
import { NORTHSTAR_TRAINING_EVENTS } from "@/lib/demo/northstar-tqms-training";
import { buildNorthstarDemoUsers } from "@/lib/demo/northstar-users-data";
import { getNorthstarIntegrations } from "@/lib/demo/northstar-integrations-data";
import {
  getNorthstarClients,
  getNorthstarCrmLeads,
  getNorthstarDiscoveryMeetings,
  getNorthstarFundraisingPipeline,
  getNorthstarGrantApplications,
  getNorthstarLedgerAccounts,
  getNorthstarOnboardingRecords,
  getNorthstarPartners,
  getNorthstarPitchDecks,
  getNorthstarDataRooms,
} from "@/lib/demo/module-fixtures";
import { getTqmsMockSnapshot } from "@/lib/tqms-mock-store";
import type { NorthstarModuleQueryResult } from "@/lib/demo/executive-intelligence";
import type { NorthstarModuleId } from "@/lib/demo/northstar-module-id";
import { northstarDemoAsAtLabel } from "@/lib/demo/northstar-financial-model";

export type NorthstarModuleReadOptions = {
  question?: string;
  focus?: string;
  viewId?: string;
  pageLabel?: string;
};

function asOf() {
  return northstarDemoAsAtLabel();
}

function base(
  module: NorthstarModuleId,
  headline: string,
  bullets: string[],
  metrics: Record<string, string | number>,
  navigationHint: string,
  records?: Record<string, unknown>,
): NorthstarModuleQueryResult {
  return { asOf: asOf(), module, headline, bullets, metrics, navigationHint, records };
}

function focusKey(options?: NorthstarModuleReadOptions) {
  const parts = [options?.focus, options?.viewId, options?.pageLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const q = (options?.question ?? "").toLowerCase();
  return `${parts} ${q}`.trim();
}

export function readNorthstarEaModule(
  module: NorthstarModuleId,
  options?: NorthstarModuleReadOptions,
): NorthstarModuleQueryResult {
  const f = focusKey(options);

  switch (module) {
    case "home":
      return base(
        module,
        "Northstar executive home — revenue, delivery, and governance pulse",
        [
          "Revenue YTD tracking ahead of plan; margin recovery programme active.",
          "Atlas UAT gate and Sheffield renewal are top commercial priorities.",
          "Board actions and engineering risks visible from the EA briefing.",
        ],
        { activeModules: 19, reportingCurrency: "GBP" },
        "HOME → Executive Dashboard",
      );

    case "executive-assistant":
      return base(
        module,
        "Executive Assistant — natural-language access across all Northstar modules",
        [
          "Ask financial, engineering, fundraising, HR, marketing, operations, or QMS questions.",
          "Generate PDFs, board decks, and cross-module reports from live demo fixtures.",
          "Use /testing on demo.unit311central.com for the full automated question suite.",
        ],
        { modulesCovered: 19, cataloguePages: 109 },
        "EXECUTIVE ASSISTANT",
      );

    case "business-central": {
      const clients = getNorthstarClients();
      const leads = getNorthstarCrmLeads();
      const onboarding = getNorthstarOnboardingRecords();
      const discovery = getNorthstarDiscoveryMeetings();
      const partners = getNorthstarPartners();
      if (/onboarding/.test(f)) {
        return base(
          module,
          `${onboarding.length} client onboarding journeys in progress`,
          onboarding.slice(0, 6).map((r) => `${r.companyName} — ${r.currentStage} — ${r.currentStatus}`),
          { inProgress: onboarding.filter((r) => r.currentStatus !== "Platform Live").length },
          "Business Central → Client Onboarding",
          { onboarding },
        );
      }
      if (/discovery|meeting/.test(f)) {
        const lastQuarter = discovery.filter((m) => m.startsAt >= "2026-04-01");
        return base(
          module,
          `${lastQuarter.length} discovery calls in the last quarter`,
          lastQuarter.slice(0, 6).map((m) => `${m.organization} — ${m.startsAt.slice(0, 10)} — ${m.statusLabel}`),
          { discoveryCallsQ2: lastQuarter.length, pipelineLeads: leads.length },
          "Business Central → Discovery",
          { discovery: lastQuarter, leads: leads.slice(0, 10) },
        );
      }
      if (/pipeline|crm|lead/.test(f)) {
        const hot = leads.filter((l) => l.status === "Hot");
        return base(
          module,
          `CRM pipeline: ${leads.length} leads · ${hot.length} hot`,
          hot.slice(0, 5).map((l) => `${l.companyName} — ${l.status} — next ${l.nextAction ?? "—"}`),
          { leads: leads.length, hotLeads: hot.length },
          "Business Central → Pipeline",
          { leads },
        );
      }
      if (/partner/.test(f)) {
        return base(
          module,
          `${partners.length} strategic partners on the register`,
          partners.slice(0, 5).map((p) => `${p.companyName} — ${p.city} — ${p.status}`),
          { partners: partners.length },
          "Business Central → Partners",
          { partners },
        );
      }
      if (/member\s+intelligence/.test(f)) {
        return base(
          module,
          "Member Intelligence — client health and expansion signals",
          clients.slice(0, 4).map((c) => `${c.companyName} — ${c.accountStatus} — ${c.region}`),
          { clients: clients.length },
          "Business Central → Member Intelligence",
          { clients },
        );
      }
      return base(
        module,
        `Business Central: ${clients.length} clients · ${leads.length} CRM leads`,
        [
          `${onboarding.length} onboarding in flight · ${discovery.length} discovery meetings scheduled`,
          `${getNorthstarGrantApplications().length} active grant applications`,
        ],
        { clients: clients.length, leads: leads.length, partners: partners.length },
        "Business Central → Clients / CRM / Grants",
        { clients, leads, onboarding, discovery },
      );
    }

    case "marketing": {
      const bundle = getNorthstarMarketingBundle();
      const kpis = bundle.kpis;
      if (/newsletter|mail/.test(f)) {
        return base(
          module,
          `${bundle.newsletters.length} newsletters · open rate ${kpis.newsletterOpenRate ?? 0}%`,
          bundle.newsletters.slice(0, 4).map((n) => `${n.title} — ${n.status}`),
          { openRatePct: kpis.newsletterOpenRate ?? 0, subscribers: kpis.mailingSubscribers },
          "Marketing & Events → Digital Newsletter",
          { newsletters: bundle.newsletters },
        );
      }
      if (/event/.test(f)) {
        return base(
          module,
          `${bundle.externalEvents.length} external events · ${kpis.externalEventsConfirmed} confirmed`,
          bundle.externalEvents.slice(0, 5).map((e) => `${e.name} — ${e.startDate} — ${e.city ?? "TBC"}`),
          { events: bundle.externalEvents.length },
          "Marketing & Events → External Events",
          { events: bundle.externalEvents },
        );
      }
      if (/mailing|list/.test(f)) {
        return base(
          module,
          `Mailing list: ${bundle.contacts.length} contacts across manufacturing and F&B segments`,
          bundle.contacts.slice(0, 6).map((c) => `${c.name} — ${c.organisation} — ${c.segment}`),
          { contacts: bundle.contacts.length },
          "Marketing & Events → Mailing List",
          { contacts: bundle.contacts },
        );
      }
      return base(
        module,
        `Marketing & Events — ${kpis.mailingSubscribers} subscribers · ${kpis.externalEventsTotal} events`,
        [
          `Newsletter open rate ${kpis.newsletterOpenRate ?? 0}% · ${bundle.campaigns.length} active campaigns`,
          `${bundle.portfolioStories.length} client stories published`,
        ],
        {
          mailingList: kpis.mailingSubscribers,
          openRatePct: kpis.newsletterOpenRate ?? 0,
          eventsTotal: kpis.externalEventsTotal,
        },
        "Marketing & Events → Dashboard",
        { kpis, bundle },
      );
    }

    case "operations": {
      const ops = getNorthstarOperationsDashboardSummary();
      const inv = getNorthstarInventoryCharts();
      const proc = getNorthstarProcurementSeed();
      if (/asset/.test(f)) {
        return base(
          module,
          `Assets: ${ops.assetsTotalCount} items · ${formatNorthstarGbp(ops.assetsTotalValueGbp)} total value`,
          [`Depreciation ${formatNorthstarGbp(ops.assetsDepreciationGbp)} · utilisation stable across UK sites`],
          { count: ops.assetsTotalCount, valueGbp: ops.assetsTotalValueGbp },
          "Operations → Assets",
          { kpis: ops },
        );
      }
      if (/inventory|stock/.test(f)) {
        return base(
          module,
          `Inventory: ${ops.inventorySkuCount} SKUs · ${formatNorthstarGbp(ops.inventoryOnHandValueGbp)} on hand`,
          inv.valueByLocation.map((r) => `${r.location}: ${formatNorthstarGbp(r.value)}`),
          { skus: ops.inventorySkuCount, onHandGbp: ops.inventoryOnHandValueGbp },
          "Operations → Inventory",
          { charts: inv },
        );
      }
      if (/procurement|purchase|po/.test(f)) {
        return base(
          module,
          `Procurement: ${formatNorthstarGbp(ops.procurementSpendMtdGbp)} spend MTD · ${ops.procurementOpenPos} open POs`,
          proc.purchaseOrders.slice(0, 4).map((po) => `${po.poNumber} — ${po.supplierName} — ${po.status}`),
          { spendMtdGbp: ops.procurementSpendMtdGbp, openPos: ops.procurementOpenPos },
          "Operations → Procurement",
          { purchaseOrders: proc.purchaseOrders },
        );
      }
      if (/logistics|shipment|courier/.test(f)) {
        return base(
          module,
          `Logistics: ${ops.logisticsInboundInTransit} inbound / ${ops.logisticsOutboundInTransit} outbound in transit`,
          [
            `Late delivery ${ops.logisticsLatePct3Mo}% (3 mo) · avg courier ${formatNorthstarGbp(ops.logisticsAvgCourierSpendGbp)}/pkg`,
          ],
          {
            inboundInTransit: ops.logisticsInboundInTransit,
            outboundInTransit: ops.logisticsOutboundInTransit,
            latePct: ops.logisticsLatePct3Mo,
          },
          "Operations → Logistics",
        );
      }
      return base(
        module,
        `Operations dashboard — assets ${formatNorthstarGbp(ops.assetsTotalValueGbp)} · inventory ${formatNorthstarGbp(ops.inventoryOnHandValueGbp)}`,
        [
          `Procurement ${formatNorthstarGbp(ops.procurementSpendMtdGbp)} MTD · ${ops.procurementOpenPos} open POs`,
          `Logistics late rate ${ops.logisticsLatePct3Mo}% (3 months)`,
        ],
        {
          assetsGbp: ops.assetsTotalValueGbp,
          inventoryGbp: ops.inventoryOnHandValueGbp,
          procurementMtdGbp: ops.procurementSpendMtdGbp,
        },
        "Operations → Dashboard",
        { summary: ops },
      );
    }

    case "technology": {
      const trend = buildNorthstarTechSpendTrend({ softwareMonthlyGbp: 24_800 });
      if (/telecom|mobile|fibre/.test(f)) {
        return base(
          module,
          `Telecom spend ${formatNorthstarTechGbp(NORTHSTAR_TECH_TELECOM.lastMonthGbp)}/mo · ${NORTHSTAR_TECH_TELECOMS.length} lines`,
          NORTHSTAR_TECH_TELECOMS.slice(0, 5).map(
            (l) => `${l.service} — ${l.office} — ${formatNorthstarTechGbp(l.monthlyCostGbp)}/mo`,
          ),
          { lines: NORTHSTAR_TECH_TELECOMS.length, monthlyGbp: NORTHSTAR_TECH_TELECOM.lastMonthGbp },
          "Technology Management → Telecommunications",
          { lines: NORTHSTAR_TECH_TELECOMS },
        );
      }
      if (/software|saas/.test(f)) {
        return base(
          module,
          `Software & SaaS ~${formatNorthstarTechGbp(trend.currentMonthly)}/mo · trend ${trend.changePct.toFixed(1)}%`,
          ["Wise, Supabase, Vercel, Cursor, and M365 on the Northstar software register"],
          { monthlyGbp: trend.currentMonthly, changePct: trend.changePct.toFixed(1) },
          "Technology Management → Software & SaaS",
          { trend },
        );
      }
      if (/device|asset|hardware|laptop/.test(f)) {
        return base(
          module,
          `${NORTHSTAR_TECH_HARDWARE.physicalAssets} technology assets · hardware spend ${formatNorthstarTechGbp(NORTHSTAR_TECH_HARDWARE.lastMonthGbp)}/mo`,
          [`Upcoming refresh budget ${formatNorthstarTechGbp(NORTHSTAR_TECH_HARDWARE.upcomingGbp)}`],
          { assets: NORTHSTAR_TECH_HARDWARE.physicalAssets },
          "Technology Management → Technology Assets",
        );
      }
      return base(
        module,
        `Technology spend ~${formatNorthstarTechGbp(trend.currentMonthly)}/mo across software, hardware, and telecom`,
        [
          `Hardware ${formatNorthstarTechGbp(NORTHSTAR_TECH_HARDWARE.lastMonthGbp)} · Telecom ${formatNorthstarTechGbp(NORTHSTAR_TECH_TELECOM.lastMonthGbp)}`,
          `${NORTHSTAR_TECH_HARDWARE.physicalAssets} managed devices`,
        ],
        { totalMonthlyGbp: trend.currentMonthly, devices: NORTHSTAR_TECH_HARDWARE.physicalAssets },
        "Technology Management → Dashboard",
        { trend },
      );
    }

    case "training": {
      const tqms = getTqmsMockSnapshot();
      const courses = tqms.courses ?? [];
      if (/course\s+builder|builder/.test(f)) {
        return base(
          module,
          `${courses.length} published courses · mandatory induction and ISO modules active`,
          courses.slice(0, 5).map((c) => `${c.code} — ${c.title} — ${c.status}`),
          { courses: courses.length },
          "Training → Course Builder",
          { courses },
        );
      }
      if (/qms\s+course|quality\s+course/.test(f)) {
        const qmsCourses = courses.filter((c) => /qms|quality|iso/i.test(c.title));
        return base(
          module,
          `${qmsCourses.length} QMS-linked training courses`,
          qmsCourses.map((c) => `${c.title} — ${c.durationHours}h — owner ${c.owner}`),
          { qmsCourses: qmsCourses.length },
          "Training → QMS Courses",
          { courses: qmsCourses },
        );
      }
      return base(
        module,
        `Training — ${courses.length} courses · ${NORTHSTAR_TRAINING_EVENTS.length} upcoming sessions`,
        NORTHSTAR_TRAINING_EVENTS.map((e) => `${e.title} — ${e.when} — ${e.owner}`),
        { courses: courses.length, events: NORTHSTAR_TRAINING_EVENTS.length },
        "Training → Dashboard / Courses",
        { courses: courses.slice(0, 8), events: NORTHSTAR_TRAINING_EVENTS },
      );
    }

    case "corporate": {
      const cap = buildNorthstarCapTableSnapshot();
      if (/cap\s+table|shareholder/.test(f)) {
        return base(
          module,
          `${NORTHSTAR_COMPANY_NAME} — ${cap.shareholders.length} shareholders on cap table`,
          cap.shareholders.slice(0, 5).map((s) => `${s.holder} — ${s.ownershipPct}% — ${s.shareClass}`),
          { shareholders: cap.shareholders.length, optionPoolPct: cap.optionPool.authorisedPct },
          "Corporate Information → Cap Table (Fundraising module on demo)",
          { capTable: cap },
        );
      }
      if (/contract/.test(f)) {
        return base(
          module,
          `${NORTHSTAR_CORPORATE_CONTRACTS.length} corporate contracts on file`,
          NORTHSTAR_CORPORATE_CONTRACTS.slice(0, 5).map((c) => `${c.name} — ${c.supplier} — ${c.status}`),
          { contracts: NORTHSTAR_CORPORATE_CONTRACTS.length },
          "Corporate Information → Contracts",
          { contracts: NORTHSTAR_CORPORATE_CONTRACTS },
        );
      }
      if (/office|location/.test(f)) {
        return base(
          module,
          `${NORTHSTAR_OFFICE_MAP_MARKERS.length} Northstar office locations`,
          NORTHSTAR_OFFICE_MAP_MARKERS.map((m) => `${m.city}, ${m.country} — ${m.employees} staff`),
          { offices: NORTHSTAR_OFFICE_MAP_MARKERS.length },
          "Corporate Information → Office Locations",
          { offices: NORTHSTAR_OFFICE_MAP_MARKERS },
        );
      }
      return base(
        module,
        `Corporate Information — ${NORTHSTAR_COMPANY_NAME}`,
        [
          `${cap.shareholders.length} cap table holders · ${NORTHSTAR_CORPORATE_CONTRACTS.length} contracts`,
          `Offices: Manchester HQ, Bristol lab, Austin sales`,
        ],
        { contracts: NORTHSTAR_CORPORATE_CONTRACTS.length, offices: NORTHSTAR_OFFICE_MAP_MARKERS.length },
        "Corporate Information → Dashboard",
        { capTable: cap },
      );
    }

    case "project-management": {
      const projects = getNorthstarDemoProjects();
      const internal = projects.filter((p) => !p.clientId);
      const external = projects.filter((p) => p.clientId);
      if (/internal/.test(f)) {
        return base(
          module,
          `${internal.length} internal programmes`,
          internal.slice(0, 5).map((p) => `${p.name} — ${p.progressPct}% — ${p.phase}`),
          { count: internal.length },
          "Project Management → Internal Projects",
          { projects: internal },
        );
      }
      if (/external/.test(f)) {
        return base(
          module,
          `${external.length} external client projects`,
          external.slice(0, 5).map((p) => `${p.name} — ${p.clientName} — ${p.progressPct}%`),
          { count: external.length },
          "Project Management → External Projects",
          { projects: external },
        );
      }
      return base(
        module,
        `Project Management — ${projects.length} live programmes`,
        projects.slice(0, 6).map((p) => `${p.name} — ${p.progressPct}% — ${p.operator}`),
        { total: projects.length, internal: internal.length, external: external.length },
        "Project Management → Dashboard",
        { projects },
      );
    }

    case "productivity":
      return base(
        module,
        "Business Productivity — files, email, calendar, and collaboration",
        [
          "Content Studio, File Explorer (internal/external/client), and calendar are available.",
          "Ask EA to search files or summarise recent communications.",
        ],
        { apps: 9 },
        "Business Productivity → Dashboard",
      );

    case "tools": {
      const users = buildNorthstarDemoUsers();
      const integrations = getNorthstarIntegrations();
      if (/integration/.test(f)) {
        return base(
          module,
          `${integrations.length} platform integrations configured`,
          integrations.slice(0, 6).map((i) => `${i.name} — ${i.status} — ${i.category}`),
          { integrations: integrations.length },
          "Tools → Integrations",
          { integrations },
        );
      }
      if (/user/.test(f)) {
        return base(
          module,
          `${users.length} platform users across Northstar demo`,
          users.slice(0, 6).map((u) => `${u.fullName} — ${u.role} — ${u.department}`),
          { users: users.length },
          "Tools → Users",
          { users },
        );
      }
      return base(
        module,
        "Tools — website, integrations, testing, telemetry, and users",
        [
          `${integrations.length} integrations · ${users.length} users`,
          "Website management and telemetry available for operators.",
        ],
        { integrations: integrations.length, users: users.length },
        "Tools → Integrations / Users",
      );
    }

    case "external-client-access":
      return base(
        module,
        "External Client Access — Sheffield Precision and partner portals",
        [
          "External users can access scoped project and support views.",
          "2 portal surfaces configured on the demo tenant.",
        ],
        { portals: 2 },
        "External Client Access → Dashboard",
      );

    case "settings":
      return base(
        module,
        "Settings — profile, workspace general, billing, and appearance",
        [
          "Northstar demo billing shows software provider sync.",
          "Sidebar reorder and module preferences under General.",
        ],
        { sections: 4 },
        "Settings → General / Billing",
      );

    case "hr": {
      const employees = getNorthstarHrEmployees();
      const payroll = getNorthstarPayrollDashboard();
      if (/leave|attendance|time/.test(f)) {
        const leave = buildNorthstarLeaveRequests().filter((r) => r.status === "approved");
        return base(
          module,
          `${leave.length} approved leave requests on calendar`,
          leave.slice(0, 6).map((r) => `${r.employeeName} — ${r.startDate} to ${r.endDate}`),
          { onLeave: leave.length },
          "Human Resources → Time & Attendance",
          { leave },
        );
      }
      if (/recruit|vacanc/.test(f)) {
        const vacancies = buildNorthstarRecruitmentVacancies();
        return base(
          module,
          `${vacancies.length} open vacancies`,
          vacancies.map((v) => `${v.title} — ${v.department} — ${v.status}`),
          { vacancies: vacancies.length },
          "Human Resources → Recruitment",
          { vacancies },
        );
      }
      if (/performance|review/.test(f)) {
        const reviews = buildNorthstarHrMockState().reviews;
        return base(
          module,
          `${reviews.length} performance reviews in cycle`,
          reviews.slice(0, 5).map((r) => `${r.employeeName} — ${r.status} — rating ${r.overallRating ?? "—"}`),
          { reviews: reviews.length },
          "Human Resources → Performance",
          { reviews },
        );
      }
      if (/payroll/.test(f)) {
        return base(
          module,
          `Payroll gross ${formatNorthstarGbp(payroll.monthlyGrossPayroll)} · employer taxes ${formatNorthstarGbp(payroll.estimatedEmployerTaxes)}`,
          [
            payroll.recentRuns[0]?.notes ?? "Latest payroll run complete",
            `${employees.length} employees on monthly payroll`,
          ],
          { grossGbp: payroll.monthlyGrossPayroll, employees: employees.length },
          "Human Resources → Payroll",
          { payroll },
        );
      }
      if (/report|headcount|growth|graph|chart/.test(f)) {
        const hr = buildNorthstarHeadcountGrowthSummary();
        return base(
          module,
          hr.headline,
          hr.bullets,
          { headcount: hr.series[hr.series.length - 1]?.total ?? 25 },
          "Human Resources → HR Reports",
          { headcountByYear: hr.series, chart: hr },
        );
      }
      return base(
        module,
        `Human Resources — ${employees.length} employees across Manchester, Bristol, and Austin`,
        [
          `${buildNorthstarRecruitmentVacancies().length} open roles · payroll gross ${formatNorthstarGbp(payroll.monthlyGrossPayroll)}`,
          buildNorthstarHeadcountGrowthSummary().headline,
        ],
        { headcount: employees.length },
        "Human Resources → Employees",
        { employees: employees.slice(0, 10) },
      );
    }

    case "qms": {
      const tqms = getTqmsMockSnapshot();
      const capas = tqms.capas ?? [];
      const audits = tqms.audits ?? [];
      const docs = tqms.documents ?? [];
      if (/capa/.test(f)) {
        return base(
          module,
          `${capas.length} CAPA records — ${capas.filter((c) => c.status !== "Closed").length} open`,
          capas.slice(0, 5).map((c) => `${c.reference} — ${c.issue} — ${c.status}`),
          { openCapa: capas.filter((c) => c.status !== "Closed").length },
          "QMS → CAPA",
          { capas },
        );
      }
      if (/audit/.test(f)) {
        return base(
          module,
          `${audits.length} internal audits scheduled or complete`,
          audits.slice(0, 4).map((a) => `${a.title} — ${a.status} — ${a.scheduledFor}`),
          { audits: audits.length },
          "QMS → Internal Audits",
          { audits },
        );
      }
      if (/document/.test(f)) {
        return base(
          module,
          `${docs.length} controlled documents`,
          docs.slice(0, 5).map((d) => `${d.number} — ${d.title} — ${d.status}`),
          { documents: docs.length },
          "QMS → Document Control",
          { documents: docs },
        );
      }
      return base(
        module,
        `QMS — ${capas.filter((c) => c.status !== "Closed").length} open CAPAs · ${audits.length} audits`,
        [
          `${docs.length} controlled documents · ISO 9001 surveillance on track`,
          "Firmware QA backlog linked to engineering CAPA.",
        ],
        { openCapa: capas.filter((c) => c.status !== "Closed").length, audits: audits.length },
        "QMS → Dashboard",
        { capas, audits, documents: docs },
      );
    }

    case "financials": {
      const ledger = getNorthstarLedgerAccounts();
      if (/general\s+ledger|gl\b|ledger/.test(f)) {
        return base(
          module,
          `${ledger.length} GL accounts — trial balance balanced`,
          ledger.slice(0, 6).map((a) => `${a.code} — ${a.name} — ${formatNorthstarGbp(a.balance ?? 0)}`),
          { accounts: ledger.length },
          "Financials → General Ledger",
          { accounts: ledger },
        );
      }
      if (/receivable|ar\b|invoice/.test(f)) {
        return base(
          module,
          "Accounts receivable — Sheffield and Midlands accounts dominant",
          ["Outstanding AR tracked in live invoice ledger for demo"],
          { source: "live-invoices" },
          "Financials → Accounts Receivable",
        );
      }
      if (/payable|ap\b/.test(f)) {
        return base(
          module,
          "Accounts payable — supplier invoices and accruals",
          ["Voltex and cloud vendors in current AP cycle"],
          {},
          "Financials → Accounts Payable",
        );
      }
      if (/expense/.test(f)) {
        return base(
          module,
          "Expense claims — engineering and sales travel in August",
          ["Use searchExpenses for line-level detail"],
          {},
          "Financials → Expenses",
        );
      }
      if (/bank|cash|treasury|wise/.test(f)) {
        return base(
          module,
          "Bank & treasury — Wise multi-currency balances",
          ["Cash position available via getCashPosition / financials module"],
          {},
          "Financials → Bank",
        );
      }
      return base(
        module,
        "Financials — revenue, margin, cash, and GL connected for EA",
        [
          `${ledger.length} GL accounts · payroll and P&L available for PDF export`,
          "Ask for P&L, balance sheet, and cash for scoped PDF generation.",
        ],
        { glAccounts: ledger.length },
        "Financials → Dashboard",
        { ledger },
      );
    }

    case "fundraising": {
      const pipeline = getNorthstarFundraisingPipeline().filter((d) => d.stage !== "Passed");
      if (/investor/.test(f)) {
        return base(
          module,
          `${pipeline.length} active investor conversations`,
          pipeline.map((d) => `${d.firm} — ${d.stage} — ${formatNorthstarGbp(d.amountGbp)}`),
          { deals: pipeline.length },
          "Fundraising → Investors",
          { pipeline },
        );
      }
      if (/data\s+room/.test(f)) {
        const rooms = getNorthstarDataRooms();
        return base(
          module,
          `${rooms.length} data rooms prepared`,
          rooms.map((r) => `${r.investor} — ${r.status} — ${r.lastUpdatedAt}`),
          { dataRooms: rooms.length },
          "Fundraising → Data Rooms",
          { dataRooms: rooms },
        );
      }
      if (/pitch|deck/.test(f)) {
        const decks = getNorthstarPitchDecks();
        return base(
          module,
          `${decks.length} pitch deck versions`,
          decks.map((d) => `${d.title} — v${d.version} — ${d.lastUpdatedAt}`),
          { decks: decks.length },
          "Fundraising → Pitch Decks",
          { decks },
        );
      }
      const pipelineGbp = pipeline.reduce((s, d) => s + d.amountGbp, 0);
      return base(
        module,
        `Seed round pipeline ${formatNorthstarGbp(pipelineGbp)} active`,
        pipeline.slice(0, 5).map((d) => `${d.firm} (${d.stage}) — ${formatNorthstarGbp(d.amountGbp)}`),
        { activeDeals: pipeline.length, pipelineGbp },
        "Fundraising → Pipeline",
        { pipeline },
      );
    }

  }

  // Delegate modules still implemented in executive-intelligence (engineering, board, etc.)
  return base(
    module,
    `Northstar ${module} module`,
    options?.question ? [`Query: ${options.question}`] : ["Open the module in the sidebar for full detail."],
    {},
    `Navigate to ${module} in the left sidebar.`,
  );
}
