import type { SalesQuote } from "@/lib/accounting/types";
import type { CrmLead } from "@/lib/crm-data";
import { mapCrmActivity, type CrmActivity } from "@/lib/crm-contact-data";
import { listLeads } from "@/lib/crm-leads-service";
import { listFounderSessionBookings } from "@/lib/founder-booking/service";
import { formatLondonDateTime } from "@/lib/founder-booking/slots";
import { formatDateTimeInTimezone, getFounderBookingTimezone } from "@/lib/founder-booking/timezones";
import { findPlatformUserById } from "@/lib/platform-users-service";
import {
  buildSalesDashboardMetrics,
  filterLeadsBySalesSegment,
  formatSalesMoney,
  isOpenPipelineLead,
  isOpportunityLead,
  isProspectLead,
  resolveLeadWinProbability,
  type SalesDashboardMeetingSummary,
  type SalesReportingCurrency,
} from "@/lib/sales-management-insights";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export type SalesPerson = {
  userId: string;
  displayName: string;
  email: string;
  hrEmployeeId: string | null;
  teamIds: string[];
  roles: Array<"member" | "manager">;
  isManager: boolean;
};

export type SalesTeam = {
  id: string;
  name: string;
  managerUserId: string | null;
  managerName: string | null;
  memberCount: number;
  memberUserIds: string[];
};

export type SalesActivityItem = {
  id: string;
  kind: "follow_up" | "meeting" | "crm_activity";
  title: string;
  subtitle: string;
  when: string | null;
  whenLabel: string | null;
  status: "upcoming" | "overdue" | "completed";
  ownerUserId: string | null;
  ownerName: string | null;
  crmLeadId: string | null;
  companyName: string | null;
};

export type SalesTargetRecord = {
  id: string;
  ownerUserId: string | null;
  ownerName: string | null;
  teamId: string | null;
  teamName: string | null;
  periodType: "month" | "quarter" | "year";
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  actualValue: number;
  progressPct: number | null;
  currency: SalesReportingCurrency;
  notes: string | null;
};

export type SalesCommissionRule = {
  id: string;
  name: string;
  ratePct: number;
  appliesTo: "won_deal" | "accepted_quote" | "invoice_paid";
  isActive: boolean;
};

export type SalesCommissionRecord = {
  id: string;
  userId: string;
  userName: string;
  crmLeadId: string | null;
  companyName: string | null;
  quoteId: string | null;
  ruleId: string | null;
  ruleName: string | null;
  commissionableValue: number;
  ratePct: number;
  earnedAmount: number;
  status: "pending" | "approved" | "paid";
};

export type SalesWorkspaceContext = {
  currency: SalesReportingCurrency;
  currentUserId: string;
  currentUserName: string;
  isSalesperson: boolean;
  isManager: boolean;
  people: SalesPerson[];
  teams: SalesTeam[];
  personByUserId: Record<string, SalesPerson>;
  displayNameForUserId: (userId: string | null | undefined) => string;
};

export type SalesWorkspaceBundle = {
  context: SalesWorkspaceContext;
  leads: CrmLead[];
  quotes: SalesQuote[];
  meetings: SalesDashboardMeetingSummary[];
  activities: CrmActivity[];
  targets: SalesTargetRecord[];
  commissionRules: SalesCommissionRule[];
  commissions: SalesCommissionRecord[];
  metrics: ReturnType<typeof buildSalesDashboardMetrics>;
};

function requireSupabase() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function classifyWhen(iso: string | null | undefined): SalesActivityItem["status"] {
  const date = parseDate(iso);
  if (!date) return "upcoming";
  const today = startOfToday();
  if (date < today) return "overdue";
  return "upcoming";
}

async function loadMeetings(workspaceId: string): Promise<SalesDashboardMeetingSummary[]> {
  const bookings = await listFounderSessionBookings({ workspaceId });
  return Promise.all(
    bookings.map(async (booking) => {
      const timezoneMeta = getFounderBookingTimezone(booking.clientTimezone ?? "Europe/London");
      return {
        id: booking.id,
        organization: booking.organization,
        name: booking.name,
        formattedWhen:
          formatDateTimeInTimezone(booking.startsAt, timezoneMeta.id) ??
          formatLondonDateTime(booking.startsAt),
        status: booking.status,
      };
    }),
  );
}

async function loadCrmActivities(workspaceId: string, leadIds: string[]): Promise<CrmActivity[]> {
  if (!leadIds.length) return [];
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("crm_lead_id", leadIds.slice(0, 200))
    .order("occurred_at", { ascending: false })
    .limit(200);
  if (error) {
    if (error.message.includes("crm_activities")) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapCrmActivity);
}

async function loadSalesTeams(workspaceId: string): Promise<SalesTeam[]> {
  const supabase = requireSupabase();
  const { data: teams, error } = await supabase
    .from("sales_teams")
    .select("id, name, manager_user_id")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) {
    if (error.message.includes("sales_teams")) return [];
    throw new Error(error.message);
  }
  const teamIds = (teams ?? []).map((t) => t.id as string);
  if (!teamIds.length) return [];

  const { data: members, error: memberError } = await supabase
    .from("sales_team_members")
    .select("team_id, user_id, role, is_active")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);
  if (memberError && !memberError.message.includes("sales_team_members")) {
    throw new Error(memberError.message);
  }

  const membersByTeam = new Map<string, string[]>();
  for (const row of members ?? []) {
    const list = membersByTeam.get(String(row.team_id)) ?? [];
    list.push(String(row.user_id));
    membersByTeam.set(String(row.team_id), list);
  }

  const managerNames = new Map<string, string>();
  for (const team of teams ?? []) {
    const managerId = team.manager_user_id ? String(team.manager_user_id) : null;
    if (!managerId) continue;
    const user = await findPlatformUserById(managerId);
    if (user) managerNames.set(managerId, user.display_name);
  }

  return (teams ?? []).map((team) => {
    const managerUserId = team.manager_user_id ? String(team.manager_user_id) : null;
    const memberUserIds = membersByTeam.get(String(team.id)) ?? [];
    return {
      id: String(team.id),
      name: String(team.name),
      managerUserId,
      managerName: managerUserId ? managerNames.get(managerUserId) ?? null : null,
      memberCount: memberUserIds.length,
      memberUserIds,
    };
  });
}

async function loadSalesTeamMembers(workspaceId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_team_members")
    .select("team_id, user_id, hr_employee_id, role, is_active")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);
  if (error) {
    if (error.message.includes("sales_team_members")) return [];
    throw new Error(error.message);
  }
  return data ?? [];
}

async function loadWorkspacePlatformUsers(workspaceId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("platform_users")
    .select("id, display_name, username, email, user_type, is_active")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .eq("user_type", "internal")
    .order("display_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    displayName: String(row.display_name ?? row.username),
    email: String(row.email ?? row.username),
  }));
}

async function buildPeople(workspaceId: string, teams: SalesTeam[]): Promise<SalesPerson[]> {
  const [users, memberships] = await Promise.all([
    loadWorkspacePlatformUsers(workspaceId),
    loadSalesTeamMembers(workspaceId),
  ]);

  const teamByUser = new Map<string, { teamIds: string[]; roles: Array<"member" | "manager"> }>();
  for (const row of memberships) {
    const userId = String(row.user_id);
    const current = teamByUser.get(userId) ?? { teamIds: [], roles: [] };
    current.teamIds.push(String(row.team_id));
    current.roles.push(row.role === "manager" ? "manager" : "member");
    teamByUser.set(userId, current);
  }

  const managerUserIds = new Set(
    teams.flatMap((team) => (team.managerUserId ? [team.managerUserId] : [])),
  );

  return users.map((user) => {
    const membership = teamByUser.get(user.id);
    const roles = membership?.roles ?? [];
    return {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      hrEmployeeId: memberships.find((m) => String(m.user_id) === user.id)?.hr_employee_id
        ? String(memberships.find((m) => String(m.user_id) === user.id)!.hr_employee_id)
        : null,
      teamIds: membership?.teamIds ?? [],
      roles,
      isManager: roles.includes("manager") || managerUserIds.has(user.id),
    };
  });
}

function computeActualForTarget(
  target: SalesTargetRecord,
  leads: CrmLead[],
  quotes: SalesQuote[],
): number {
  const inPeriod = (iso: string | null | undefined) => {
    if (!iso) return false;
    const d = iso.slice(0, 10);
    return d >= target.periodStart && d <= target.periodEnd;
  };

  const scopedLeads = leads.filter((lead) => {
    if (target.ownerUserId && lead.ownerUserId !== target.ownerUserId) return false;
    if (target.teamId) {
      // team-scoped actuals require owner on team — handled upstream when targets saved
      return true;
    }
    return true;
  });

  const wonValue = scopedLeads
    .filter((lead) => lead.status === "Won" && inPeriod(lead.updatedAt))
    .reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);

  const acceptedQuotes = quotes
    .filter(
      (quote) =>
        quote.status === "accepted" &&
        inPeriod(quote.updatedAt) &&
        (!target.ownerUserId || quote.clientId),
    )
    .reduce((sum, quote) => sum + quote.totalAmount, 0);

  return wonValue + acceptedQuotes;
}

async function loadTargets(
  workspaceId: string,
  workspaceSlug: string,
  teams: SalesTeam[],
  leads: CrmLead[],
  quotes: SalesQuote[],
  displayNameForUserId: (userId: string | null | undefined) => string,
): Promise<SalesTargetRecord[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_targets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("period_start", { ascending: false });
  if (error) {
    if (error.message.includes("sales_targets")) return [];
    throw new Error(error.message);
  }

  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));
  const reportingCurrency = resolveSlugReportingCurrency(workspaceSlug) as SalesReportingCurrency;

  return (data ?? []).map((row) => {
    const ownerUserId = row.owner_user_id ? String(row.owner_user_id) : null;
    const teamId = row.team_id ? String(row.team_id) : null;
    const targetValue = Number(row.target_value ?? 0);
    const record: SalesTargetRecord = {
      id: String(row.id),
      ownerUserId,
      ownerName: ownerUserId ? displayNameForUserId(ownerUserId) : null,
      teamId,
      teamName: teamId ? teamNameById.get(teamId) ?? null : null,
      periodType: row.period_type as SalesTargetRecord["periodType"],
      periodStart: String(row.period_start),
      periodEnd: String(row.period_end),
      targetValue,
      actualValue: 0,
      progressPct: null,
      currency: (row.currency as SalesReportingCurrency) ?? reportingCurrency,
      notes: row.notes ? String(row.notes) : null,
    };
    record.actualValue = computeActualForTarget(record, leads, quotes);
    record.progressPct =
      targetValue > 0 ? Math.min(100, Math.round((record.actualValue / targetValue) * 100)) : null;
    return record;
  });
}

async function loadCommissionRules(workspaceId: string): Promise<SalesCommissionRule[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_commission_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) {
    if (error.message.includes("sales_commission_rules")) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    ratePct: Number(row.rate_pct ?? 0),
    appliesTo: row.applies_to as SalesCommissionRule["appliesTo"],
    isActive: Boolean(row.is_active),
  }));
}

async function loadCommissions(
  workspaceId: string,
  leads: CrmLead[],
  rules: SalesCommissionRule[],
  displayNameForUserId: (userId: string | null | undefined) => string,
): Promise<SalesCommissionRecord[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_commissions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (error.message.includes("sales_commissions")) return [];
    throw new Error(error.message);
  }

  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const ruleById = new Map(rules.map((rule) => [rule.id, rule]));

  return (data ?? []).map((row) => {
    const crmLeadId = row.crm_lead_id ? String(row.crm_lead_id) : null;
    const ruleId = row.rule_id ? String(row.rule_id) : null;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      userName: displayNameForUserId(String(row.user_id)),
      crmLeadId,
      companyName: crmLeadId ? leadById.get(crmLeadId)?.companyName ?? null : null,
      quoteId: row.quote_id ? String(row.quote_id) : null,
      ruleId,
      ruleName: ruleId ? ruleById.get(ruleId)?.name ?? null : null,
      commissionableValue: Number(row.commissionable_value ?? 0),
      ratePct: Number(row.rate_pct ?? 0),
      earnedAmount: Number(row.earned_amount ?? 0),
      status: row.status as SalesCommissionRecord["status"],
    };
  });
}

export function buildSalesActivities(input: {
  leads: CrmLead[];
  meetings: SalesDashboardMeetingSummary[];
  crmActivities: CrmActivity[];
  displayNameForUserId: (userId: string | null | undefined) => string;
}): SalesActivityItem[] {
  const items: SalesActivityItem[] = [];

  for (const lead of input.leads) {
    if (!lead.nextActionDate && !lead.nextAction) continue;
    const status = classifyWhen(lead.nextActionDate);
    items.push({
      id: `follow-up-${lead.id}`,
      kind: "follow_up",
      title: lead.nextAction || "Follow up",
      subtitle: lead.companyName,
      when: lead.nextActionDate,
      whenLabel: lead.nextActionDate,
      status,
      ownerUserId: lead.ownerUserId,
      ownerName: input.displayNameForUserId(lead.ownerUserId),
      crmLeadId: lead.id,
      companyName: lead.companyName,
    });
  }

  for (const meeting of input.meetings) {
    const status =
      meeting.status === "completed" || meeting.status === "cancelled"
        ? "completed"
        : "upcoming";
    items.push({
      id: `meeting-${meeting.id}`,
      kind: "meeting",
      title: "Discovery session",
      subtitle: `${meeting.organization} · ${meeting.name}`,
      when: null,
      whenLabel: meeting.formattedWhen,
      status,
      ownerUserId: null,
      ownerName: null,
      crmLeadId: null,
      companyName: meeting.organization,
    });
  }

  for (const activity of input.crmActivities.slice(0, 40)) {
    items.push({
      id: `crm-${activity.id}`,
      kind: "crm_activity",
      title: activity.title || activity.activityType,
      subtitle: activity.subject || activity.message.slice(0, 120),
      when: activity.occurredAt,
      whenLabel: activity.occurredAt?.slice(0, 10) ?? null,
      status: "completed",
      ownerUserId: activity.createdBy,
      ownerName: input.displayNameForUserId(activity.createdBy),
      crmLeadId: activity.crmLeadId,
      companyName: null,
    });
  }

  return items.sort((a, b) => String(b.when ?? "").localeCompare(String(a.when ?? "")));
}

export function filterLeadsForUser(
  leads: CrmLead[],
  context: SalesWorkspaceContext,
  mode: "mine" | "team" | "all",
): CrmLead[] {
  if (mode === "all" || context.isManager) return leads;
  if (mode === "mine") {
    return leads.filter(
      (lead) => !lead.ownerUserId || lead.ownerUserId === context.currentUserId,
    );
  }
  const teamMemberIds = new Set(
    context.people
      .filter((person) => person.teamIds.some((id) => context.teams.some((t) => t.id === id)))
      .map((person) => person.userId),
  );
  teamMemberIds.add(context.currentUserId);
  return leads.filter((lead) => !lead.ownerUserId || teamMemberIds.has(lead.ownerUserId ?? ""));
}

export async function loadSalesQuotesForWorkspace(input: {
  workspaceId: string;
  workspaceSlug: string;
}): Promise<SalesQuote[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_quotes")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.message.includes("sales_quotes")) return [];
    throw new Error(error.message);
  }
  const ids = (data ?? []).map((row) => String(row.id));
  if (!ids.length) return [];

  const { data: lineRows, error: lineError } = await supabase
    .from("sales_quote_line_items")
    .select("*")
    .in("quote_id", ids)
    .order("line_number", { ascending: true });
  if (lineError) throw new Error(lineError.message);

  const linesByQuote = new Map<string, SalesQuote["lineItems"]>();
  for (const row of lineRows ?? []) {
    const quoteId = String(row.quote_id);
    const items = linesByQuote.get(quoteId) ?? [];
    items.push({
      id: String(row.id),
      lineNumber: Number(row.line_number) || 0,
      description: String(row.description),
      quantity: Number(row.quantity) || 0,
      unitPrice: Number(row.unit_price) || 0,
      amount: Number(row.amount) || 0,
    });
    linesByQuote.set(quoteId, items);
  }

  const reportingCurrency = resolveSlugReportingCurrency(input.workspaceSlug) as SalesReportingCurrency;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    quoteNumber: String(row.quote_number),
    crmLeadId: row.crm_lead_id ? String(row.crm_lead_id) : null,
    clientId: row.client_id ? String(row.client_id) : null,
    companyName: String(row.company_name),
    contactName: row.contact_name ? String(row.contact_name) : null,
    contactEmail: row.contact_email ? String(row.contact_email) : null,
    title: String(row.title ?? "Sales quote"),
    currency: String(row.currency ?? reportingCurrency),
    subtotal: Number(row.subtotal) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    status: row.status as SalesQuote["status"],
    validUntil: row.valid_until ? String(row.valid_until) : null,
    pdfPath: row.pdf_path ? String(row.pdf_path) : null,
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    stripePaymentLinkUrl: row.stripe_payment_link_url ? String(row.stripe_payment_link_url) : null,
    notes: row.notes ? String(row.notes) : null,
    lineItems: linesByQuote.get(String(row.id)) ?? [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function loadSalesWorkspaceBundle(input: {
  workspaceId: string;
  workspaceSlug: string;
  currentUserId: string;
  currentUserName: string;
}): Promise<SalesWorkspaceBundle> {
  const [leads, quotes, meetings, teams] = await Promise.all([
    listLeads("All", { workspaceId: input.workspaceId }),
    loadSalesQuotesForWorkspace({
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
    }),
    loadMeetings(input.workspaceId),
    loadSalesTeams(input.workspaceId),
  ]);

  const people = await buildPeople(input.workspaceId, teams);
  const personByUserId = Object.fromEntries(people.map((person) => [person.userId, person]));
  const displayNameForUserId = (userId: string | null | undefined) => {
    if (!userId) return "Unassigned";
    return personByUserId[userId]?.displayName ?? "Unknown";
  };

  const reportingCurrency = resolveSlugReportingCurrency(input.workspaceSlug) as SalesReportingCurrency;
  const currentPerson = personByUserId[input.currentUserId];
  const context: SalesWorkspaceContext = {
    currency: reportingCurrency,
    currentUserId: input.currentUserId,
    currentUserName: input.currentUserName,
    isSalesperson: Boolean(currentPerson),
    isManager:
      Boolean(currentPerson?.isManager) ||
      teams.some((team) => team.managerUserId === input.currentUserId),
    people,
    teams,
    personByUserId,
    displayNameForUserId,
  };

  const crmActivities = await loadCrmActivities(
    input.workspaceId,
    leads.map((lead) => lead.id),
  );
  const targets = await loadTargets(
    input.workspaceId,
    input.workspaceSlug,
    teams,
    leads,
    quotes,
    displayNameForUserId,
  );
  const commissionRules = await loadCommissionRules(input.workspaceId);
  const commissions = await loadCommissions(
    input.workspaceId,
    leads,
    commissionRules,
    displayNameForUserId,
  );

  const metrics = buildSalesDashboardMetrics({
    leads,
    quotes,
    meetings,
    displayNameForUserId,
    workspaceSlug: input.workspaceSlug,
    reportingCurrency,
  });

  return {
    context,
    leads,
    quotes,
    meetings,
    activities: crmActivities,
    targets,
    commissionRules,
    commissions,
    metrics,
  };
}

export function buildPipelineBySalesperson(
  leads: CrmLead[],
  displayNameForUserId: (userId: string | null | undefined) => string,
) {
  const map = new Map<string, { assignee: string; count: number; value: number; userId: string | null }>();
  for (const lead of leads.filter((row) => isOpenPipelineLead(row.status))) {
    const userId = lead.ownerUserId;
    const assignee = displayNameForUserId(userId);
    const current = map.get(assignee) ?? { assignee, count: 0, value: 0, userId: userId ?? null };
    current.count += 1;
    current.value += lead.estimatedValue ?? 0;
    map.set(assignee, current);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export function buildForecastSummary(
  leads: CrmLead[],
  quotes: SalesQuote[],
  salesStaffCount = 0,
) {
  const openLeads = leads.filter((lead) => isOpenPipelineLead(lead.status));
  const openPipeline = openLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
  const weightedPipeline = openLeads.reduce(
    (sum, lead) => sum + (lead.estimatedValue ?? 0) * (resolveLeadWinProbability(lead) / 100),
    0,
  );
  const committedWon = leads
    .filter((lead) => lead.status === "Won")
    .reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
  const acceptedQuotes = quotes
    .filter((quote) => quote.status === "accepted")
    .reduce((sum, quote) => sum + quote.totalAmount, 0);

  const totalVisibleForecast = openPipeline + committedWon + acceptedQuotes;
  const weightedForecastTotal = Math.round(weightedPipeline + committedWon + acceptedQuotes);

  const horizons = ([3, 6, 9, 12] as const).map((months) => {
    const factor = months / 12;
    return {
      months,
      label: `Next ${months} months`,
      forecastRevenue: Math.round(totalVisibleForecast * factor),
      weightedForecast: Math.round(weightedForecastTotal * factor),
      pipelineValue: Math.round(openPipeline * factor),
      salesStaffCount,
    };
  });

  return {
    openPipelineValue: openPipeline,
    weightedPipelineValue: Math.round(weightedPipeline),
    committedWonValue: committedWon,
    acceptedQuotesValue: acceptedQuotes,
    totalVisibleForecast,
    weightedForecastTotal,
    salesStaffCount,
    horizons,
    assumptions: [
      "Open pipeline uses full estimated values on the Pipeline and Performance views.",
      "Weighted forecast = sum(open opportunity value × win probability) using crm_leads.win_probability, or status defaults when unset.",
      "Committed forecast includes Won opportunities and accepted sales quotes.",
      "Multi-month horizons prorate the current visible forecast evenly across a 12-month run-rate.",
    ],
  };
}

export function buildPerformanceSummary(
  leads: CrmLead[],
  targets: SalesTargetRecord[],
  displayNameForUserId: (userId: string | null | undefined) => string,
) {
  const won = leads.filter((lead) => lead.status === "Won");
  const lost = leads.filter((lead) => lead.status === "Lost");
  const closed = won.length + lost.length;
  const conversionPct = closed > 0 ? Math.round((won.length / closed) * 100) : null;

  const byPerson = buildPipelineBySalesperson(leads, displayNameForUserId);
  const activeTargets = targets.filter((target) => target.targetValue > 0);
  const today = new Date().toISOString().slice(0, 10);

  const personIds = new Set<string>();
  for (const lead of leads) {
    if (lead.ownerUserId) personIds.add(lead.ownerUserId);
  }
  for (const target of activeTargets) {
    if (target.ownerUserId) personIds.add(target.ownerUserId);
  }

  const bySalesperson = [...personIds].map((userId) => {
    const scoped = leads.filter((lead) => lead.ownerUserId === userId);
    const scopedWon = scoped.filter((lead) => lead.status === "Won");
    const wonValue = scopedWon.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
    const openPipeline = scoped
      .filter((lead) => isOpenPipelineLead(lead.status))
      .reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
    const weightedPipeline = scoped
      .filter((lead) => isOpenPipelineLead(lead.status))
      .reduce(
        (sum, lead) =>
          sum + (lead.estimatedValue ?? 0) * (resolveLeadWinProbability(lead) / 100),
        0,
      );
    const currentTarget = activeTargets.find(
      (target) =>
        target.ownerUserId === userId &&
        target.periodStart <= today &&
        target.periodEnd >= today,
    );
    const targetValue = currentTarget?.targetValue ?? 0;
    const actualValue = currentTarget?.actualValue ?? wonValue;
    const progressPct =
      targetValue > 0 ? Math.round((actualValue / targetValue) * 100) : null;
    const variance = actualValue - targetValue;
    let status: "ahead" | "on_track" | "behind" = "on_track";
    if (targetValue > 0) {
      if (progressPct != null && progressPct >= 105) status = "ahead";
      else if (progressPct != null && progressPct < 85) status = "behind";
    }

    return {
      userId,
      name: displayNameForUserId(userId),
      targetValue,
      actualValue,
      progressPct,
      variance,
      openPipeline,
      weightedForecast: Math.round(weightedPipeline + wonValue),
      status,
    };
  });

  return {
    wonCount: won.length,
    lostCount: lost.length,
    conversionPct,
    openPipelineValue: leads
      .filter((lead) => isOpenPipelineLead(lead.status))
      .reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
    wonValue: won.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
    pipelineByPerson: byPerson,
    targetProgress: activeTargets.slice(0, 12),
    bySalesperson: bySalesperson.sort((a, b) => b.actualValue - a.actualValue),
  };
}

export function buildMySalesSummary(
  bundle: SalesWorkspaceBundle,
): {
  prospects: CrmLead[];
  opportunities: CrmLead[];
  pipeline: CrmLead[];
  quotes: SalesQuote[];
  activities: SalesActivityItem[];
  metrics: {
    pipelineValue: number;
    openOpportunities: number;
    overdueActivities: number;
    upcomingMeetings: number;
  };
} {
  const scopedLeads = filterLeadsForUser(bundle.leads, bundle.context, "mine");
  const activityItems = buildSalesActivities({
    leads: scopedLeads,
    meetings: bundle.meetings,
    crmActivities: bundle.activities,
    displayNameForUserId: bundle.context.displayNameForUserId,
  });

  const openPipeline = scopedLeads.filter((lead) => isOpenPipelineLead(lead.status));

  return {
    prospects: scopedLeads.filter((lead) => isProspectLead(lead.status)),
    opportunities: scopedLeads.filter((lead) => isOpportunityLead(lead.status)),
    pipeline: openPipeline,
    quotes: bundle.quotes,
    activities: activityItems,
    metrics: {
      pipelineValue: openPipeline.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
      openOpportunities: openPipeline.length,
      overdueActivities: activityItems.filter((item) => item.status === "overdue").length,
      upcomingMeetings: bundle.meetings.filter(
        (meeting) => meeting.status !== "completed" && meeting.status !== "cancelled",
      ).length,
    },
  };
}

export function buildSalesTeamSummary(bundle: SalesWorkspaceBundle) {
  return bundle.context.people.map((person) => {
    const ownedLeads = bundle.leads.filter((lead) => lead.ownerUserId === person.userId);
    const open = ownedLeads.filter((lead) => isOpenPipelineLead(lead.status));
    const activities = buildSalesActivities({
      leads: ownedLeads,
      meetings: [],
      crmActivities: bundle.activities.filter((a) => a.createdBy === person.userId),
      displayNameForUserId: bundle.context.displayNameForUserId,
    });
    return {
      person,
      openOpportunityCount: open.length,
      pipelineValue: open.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
      wonCount: ownedLeads.filter((lead) => lead.status === "Won").length,
      activityLoad: activities.filter((item) => item.status !== "completed").length,
      teams: bundle.context.teams.filter(
        (team) => team.memberUserIds.includes(person.userId) || team.managerUserId === person.userId,
      ),
    };
  });
}

export function buildReportsSummary(bundle: SalesWorkspaceBundle) {
  const { metrics } = bundle;
  return {
    pipelineByStage: metrics.byStatus.filter((row) => isOpenPipelineLead(row.status as CrmLead["status"])),
    pipelineByPerson: buildPipelineBySalesperson(bundle.leads, bundle.context.displayNameForUserId),
    wonLost: [
      { label: "Won", count: metrics.wonCount, value: bundle.leads.filter((l) => l.status === "Won").reduce((s, l) => s + (l.estimatedValue ?? 0), 0) },
      { label: "Lost", count: metrics.lostCount, value: bundle.leads.filter((l) => l.status === "Lost").reduce((s, l) => s + (l.estimatedValue ?? 0), 0) },
    ],
    leadTrend: metrics.leadsCreatedByMonth,
    forecast: buildForecastSummary(bundle.leads, bundle.quotes, bundle.context.people.length),
    targetProgress: bundle.targets,
    activitySummary: {
      upcoming: buildSalesActivities({
        leads: bundle.leads,
        meetings: bundle.meetings,
        crmActivities: bundle.activities,
        displayNameForUserId: bundle.context.displayNameForUserId,
      }).filter((item) => item.status === "upcoming").length,
      overdue: buildSalesActivities({
        leads: bundle.leads,
        meetings: bundle.meetings,
        crmActivities: bundle.activities,
        displayNameForUserId: bundle.context.displayNameForUserId,
      }).filter((item) => item.status === "overdue").length,
    },
    conversionPct: metrics.winRatePct,
  };
}

export async function createSalesCommissionRule(input: {
  workspaceId: string;
  name: string;
  ratePct: number;
  appliesTo: SalesCommissionRule["appliesTo"];
  isActive?: boolean;
}): Promise<SalesCommissionRule> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_commission_rules")
    .insert({
      workspace_id: input.workspaceId,
      name: input.name.trim(),
      rate_pct: input.ratePct,
      applies_to: input.appliesTo,
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return {
    id: String(data.id),
    name: String(data.name),
    ratePct: Number(data.rate_pct ?? 0),
    appliesTo: data.applies_to as SalesCommissionRule["appliesTo"],
    isActive: Boolean(data.is_active),
  };
}

export async function updateSalesCommissionRule(input: {
  workspaceId: string;
  ruleId: string;
  name?: string;
  ratePct?: number;
  appliesTo?: SalesCommissionRule["appliesTo"];
  isActive?: boolean;
}): Promise<SalesCommissionRule> {
  const supabase = requireSupabase();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name != null) patch.name = input.name.trim();
  if (input.ratePct != null) patch.rate_pct = input.ratePct;
  if (input.appliesTo != null) patch.applies_to = input.appliesTo;
  if (input.isActive != null) patch.is_active = input.isActive;
  const { data, error } = await supabase
    .from("sales_commission_rules")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.ruleId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return {
    id: String(data.id),
    name: String(data.name),
    ratePct: Number(data.rate_pct ?? 0),
    appliesTo: data.applies_to as SalesCommissionRule["appliesTo"],
    isActive: Boolean(data.is_active),
  };
}

export async function deleteSalesCommissionRule(workspaceId: string, ruleId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("sales_commission_rules")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", ruleId);
  if (error) throw new Error(error.message);
}

export async function createSalesActivity(input: {
  workspaceId: string;
  crmLeadId: string;
  title: string;
  activityType?: string;
  subject?: string | null;
  message?: string | null;
  occurredAt?: string | null;
  createdBy?: string | null;
}): Promise<CrmActivity> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("crm_activities")
    .insert({
      workspace_id: input.workspaceId,
      crm_lead_id: input.crmLeadId,
      activity_type: input.activityType ?? "sales_activity",
      title: input.title.trim(),
      subject: input.subject?.trim() || null,
      message: input.message?.trim() || null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCrmActivity(data);
}

export async function updateSalesActivity(input: {
  workspaceId: string;
  activityId: string;
  title?: string;
  subject?: string | null;
  message?: string | null;
  occurredAt?: string | null;
}): Promise<CrmActivity> {
  const supabase = requireSupabase();
  const patch: Record<string, unknown> = {};
  if (input.title != null) patch.title = input.title.trim();
  if (input.subject !== undefined) patch.subject = input.subject?.trim() || null;
  if (input.message !== undefined) patch.message = input.message?.trim() || null;
  if (input.occurredAt !== undefined) patch.occurred_at = input.occurredAt;
  const { data, error } = await supabase
    .from("crm_activities")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.activityId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCrmActivity(data);
}

export async function deleteSalesActivity(workspaceId: string, activityId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("crm_activities")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", activityId);
  if (error) throw new Error(error.message);
}

export async function createSalesDiscoverySession(input: {
  workspaceId: string;
  name: string;
  organization: string;
  role?: string | null;
  email: string;
  startsAt: string;
  endsAt?: string | null;
  clientTimezone?: string | null;
  status?: string;
  crmLeadId?: string | null;
}) {
  const supabase = requireSupabase();
  const startsAt = input.startsAt;
  const endsAt =
    input.endsAt ??
    new Date(new Date(startsAt).getTime() + 45 * 60_000).toISOString();
  const slugBase = input.organization
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const meetingSlug = `${slugBase || "discovery"}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("founder_session_bookings")
    .insert({
      workspace_id: input.workspaceId,
      name: input.name.trim(),
      organization: input.organization.trim(),
      role: input.role?.trim() || null,
      email: input.email.trim().toLowerCase(),
      starts_at: startsAt,
      ends_at: endsAt,
      video_link: `https://meet.demo.unit311central.com/${meetingSlug}`,
      meeting_slug: meetingSlug,
      status: input.status ?? "scheduled",
      client_timezone: input.clientTimezone?.trim() || "Europe/London",
      crm_lead_id: input.crmLeadId ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSalesTarget(input: {
  workspaceId: string;
  targetId: string;
  ownerUserId?: string | null;
  teamId?: string | null;
  periodType?: SalesTargetRecord["periodType"];
  periodStart?: string;
  periodEnd?: string;
  targetValue?: number;
  notes?: string | null;
}): Promise<void> {
  const supabase = requireSupabase();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.ownerUserId !== undefined) patch.owner_user_id = input.ownerUserId;
  if (input.teamId !== undefined) patch.team_id = input.teamId;
  if (input.periodType) patch.period_type = input.periodType;
  if (input.periodStart) patch.period_start = input.periodStart;
  if (input.periodEnd) patch.period_end = input.periodEnd;
  if (input.targetValue != null) patch.target_value = input.targetValue;
  if (input.notes !== undefined) patch.notes = input.notes;
  const { error } = await supabase
    .from("sales_targets")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.targetId);
  if (error) throw new Error(error.message);
}

export async function deleteSalesTarget(workspaceId: string, targetId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("sales_targets")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", targetId);
  if (error) throw new Error(error.message);
}

export { formatSalesMoney, filterLeadsBySalesSegment };
