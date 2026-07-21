import { executiveRevenueSummary } from "@/lib/internal-operations-command-data";
import { listProjects } from "@/lib/internal-projects-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import { listLeads } from "@/lib/crm-leads-service";
import { CAREER_APPLICANTS } from "@/lib/career-applicants-data";
import { DEBTORS_ACCOUNTS } from "@/lib/financials-ledger-mock-data";
import { listHrEmployees } from "@/lib/hr-employees-service";
import { vacationDaysRemaining } from "@/lib/hr-data";
import { isOverdue } from "./tool-result";
import type { AssistantBusinessContext } from "./types";
import type { DailyExecutiveBrief } from "./executive-types";
import { briefDateKey } from "./date-keys";
import { analysePlatformInsights } from "./insight-service";
import {
  filterWorkflowsForRole,
  getRoleFocusProfile,
  resolveExecutivePersona,
} from "./role-awareness";
import { workflowsForPermissions } from "./workflow-registry";

export { briefDateKey } from "./date-keys";

/**
 * Daily Executive Brief — personalised, concise, actionable.
 * Generated from live platform data + smart insights (no separate LLM call required).
 */
export async function buildDailyExecutiveBrief(
  context: AssistantBusinessContext,
): Promise<DailyExecutiveBrief> {
  const persona = resolveExecutivePersona(
    context.permissions.roleView,
    context.user.displayName,
  );
  const focus = getRoleFocusProfile(persona);
  const { insights, dataGaps } = await analysePlatformInsights(context);

  const [projects, clients, leads] = await Promise.all([
    listProjects().catch(() => []),
    listInternalClients().catch(() => []),
    listLeads().catch(() => []),
  ]);

  const overdueProjects = projects.filter((project) => isOverdue(project.endDate));
  const upcomingDeadlines = projects.filter((project) => {
    if (!project.endDate || project.phase !== "live") return false;
    const end = new Date(`${project.endDate}T12:00:00`);
    const days = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 14;
  });

  const criticalInsights = insights.filter(
    (entry) => entry.severity === "critical" || entry.severity === "high",
  );

  const priorities = [
    ...criticalInsights.slice(0, 3).map((entry) => entry.title),
    ...overdueProjects.slice(0, 2).map((project) => `At risk: ${project.name}`),
  ].slice(0, 5);

  if (priorities.length === 0) {
    priorities.push("No critical risks detected — review CRM and project progress.");
  }

  const sections: DailyExecutiveBrief["sections"] = [
    {
      id: "priorities",
      title: "Today's priorities",
      bullets: priorities,
      insightIds: criticalInsights.slice(0, 3).map((entry) => entry.id),
    },
    {
      id: "projects_at_risk",
      title: "Projects at risk",
      bullets:
        overdueProjects.length > 0
          ? overdueProjects.slice(0, 5).map((project) => `${project.name} · ${project.clientName}`)
          : ["No overdue projects in the current dataset."],
    },
    {
      id: "overdue_tasks",
      title: "Overdue tasks",
      bullets: insights
        .filter((entry) => entry.category === "operations")
        .slice(0, 5)
        .map((entry) => entry.title),
    },
    {
      id: "upcoming_deadlines",
      title: "Upcoming deadlines",
      bullets:
        upcomingDeadlines.length > 0
          ? upcomingDeadlines
              .slice(0, 5)
              .map((project) => `${project.name} · ends ${project.endDate}`)
          : ["No project deadlines in the next 14 days."],
    },
  ];

  if (sections.find((section) => section.id === "overdue_tasks")?.bullets.length === 0) {
    sections.find((section) => section.id === "overdue_tasks")!.bullets = [
      "No high-priority operational tasks flagged.",
    ];
  }

  sections.push({
    id: "contracts",
    title: "Contracts nearing expiry",
    bullets: insights
      .filter((entry) => entry.category === "contracts")
      .slice(0, 4)
      .map((entry) => entry.title),
  });
  if ((sections.at(-1)?.bullets.length ?? 0) === 0) {
    sections[sections.length - 1]!.bullets = [
      "No structured contract expiry dates — review Trial accounts and Files.",
    ];
  }

  if (context.permissions.canAccessHr) {
    const employees = await listHrEmployees().catch(() => []);
    const leaveToday = employees.filter((employee) => vacationDaysRemaining(employee) <= 0);
    const recruitment = CAREER_APPLICANTS.filter(
      (row) =>
        row.status === "new" ||
        row.status === "screening" ||
        row.status === "interview-scheduled",
    );

    sections.push({
      id: "recruitment",
      title: "Recruitment activity",
      bullets:
        recruitment.length > 0
          ? recruitment
              .slice(0, 4)
              .map((row) => `${row.name} · ${row.openingId} · ${row.status}`)
          : ["No active applicants in the careers pipeline dataset."],
    });

    sections.push({
      id: "leave",
      title: "Leave today",
      bullets:
        leaveToday.length > 0
          ? leaveToday.slice(0, 5).map((employee) => employee.fullName)
          : ["No leave signals from vacation balances (dated leave calendar not stored)."],
    });
  }

  if (context.permissions.canAccessFinancials) {
    const overdueInvoices = DEBTORS_ACCOUNTS.filter(
      (account) => account.status === "overdue" || account.daysOverdue > 0,
    );
    sections.push({
      id: "finance",
      title: "Financial highlights",
      bullets: [
        `Past month revenue signal: €${executiveRevenueSummary.pastMonth.value.toLocaleString()} (${executiveRevenueSummary.pastMonth.change})`,
        overdueInvoices.length > 0
          ? `${overdueInvoices.length} overdue receivable account${overdueInvoices.length === 1 ? "" : "s"}`
          : "No overdue receivables in the current ledger snapshot.",
        ...overdueInvoices
          .slice(0, 2)
          .map(
            (account) =>
              `${account.name}: €${account.outstanding.toLocaleString()} · ${account.daysOverdue}d overdue`,
          ),
      ],
    });
  }

  const recentClients = clients.slice(0, 3);
  const recentLeads = leads.slice(0, 3);
  sections.push({
    id: "customer_activity",
    title: "Recent customer activity",
    bullets: [
      ...recentClients.map(
        (client) => `Client · ${client.companyName} · ${client.accountStatus}`,
      ),
      ...recentLeads.map(
        (lead) => `CRM · ${lead.companyName || lead.contactName} · ${lead.status}`,
      ),
    ].slice(0, 6),
  });
  if ((sections.at(-1)?.bullets.length ?? 0) === 0) {
    sections[sections.length - 1]!.bullets = ["No recent client/CRM rows available."];
  }

  sections.push({
    id: "ai_recommendations",
    title: "Recent AI recommendations",
    bullets: insights.slice(0, 4).map((entry) => {
      const action = entry.recommendedActions[0]?.label;
      return action ? `${entry.title} → ${action}` : entry.title;
    }),
  });

  const workflows = filterWorkflowsForRole(
    workflowsForPermissions(context.permissions),
    persona,
  )
    .slice(0, 4)
    .map((workflow) => workflow.id);

  const firstName = context.user.displayName.trim().split(/\s+/)[0] || "there";

  return {
    id: `brief_${briefDateKey()}_${context.user.id}`,
    dateKey: briefDateKey(),
    greeting: `Good day, ${firstName}`,
    headline: `${focus.label} brief · ${priorities.length} priorit${priorities.length === 1 ? "y" : "ies"} · ${criticalInsights.length} elevated risk${criticalInsights.length === 1 ? "" : "s"}`,
    priorities,
    sections,
    insights: insights.slice(0, 12),
    recommendedWorkflows: workflows,
    followUpActions: [
      {
        id: "health",
        label: "View Business Health",
        kind: "generate",
      },
      {
        id: "tour_home",
        label: "Show Me Around",
        kind: "navigate",
        href: "guided://start_tour?view=home",
      },
      ...insights
        .slice(0, 2)
        .flatMap((entry) => entry.recommendedActions.slice(0, 1)),
    ],
    dataGaps,
    generatedAt: new Date().toISOString(),
  };
}
