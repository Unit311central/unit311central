import { getCursorAdminApiKey, CURSOR_API_BASE } from "@/lib/software-billing/cursor-config";

export class CursorBillingApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CursorBillingApiError";
    this.status = status;
  }
}

export type CursorTeamMemberSpend = {
  userId: string;
  name: string;
  email: string;
  role: string;
  spendCents: number;
  overallSpendCents: number;
};

export type CursorSpendSummary = {
  subscriptionCycleStart: string;
  subscriptionCycleEnd: string | null;
  totalMembers: number;
  totalOverallSpendCents: number;
  totalOnDemandSpendCents: number;
  members: CursorTeamMemberSpend[];
};

export type CursorUsageEvent = {
  timestamp: string;
  model: string;
  kind: string;
  chargedCents: number;
  userEmail: string | null;
};

async function cursorFetch(path: string, body?: Record<string, unknown>) {
  const key = getCursorAdminApiKey();
  if (!key) {
    throw new CursorBillingApiError("CURSOR_ADMIN_API_KEY is not configured.", 503);
  }
  const auth = Buffer.from(`${key}:`).toString("base64");
  return fetch(`${CURSOR_API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

export async function fetchCursorTeamMembers() {
  const response = await cursorFetch("/teams/members");
  const text = await response.text();
  if (!response.ok) {
    throw new CursorBillingApiError(
      `Cursor members API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  const payload = JSON.parse(text) as { teamMembers?: Array<Record<string, unknown>> };
  return (payload.teamMembers ?? []).map((member) => ({
    id: String(member.id ?? ""),
    name: String(member.name ?? ""),
    email: String(member.email ?? ""),
    role: String(member.role ?? ""),
    isRemoved: Boolean(member.isRemoved),
  }));
}

export async function fetchCursorSpendSummary(): Promise<CursorSpendSummary> {
  const members: CursorTeamMemberSpend[] = [];
  let page = 1;
  let totalPages = 1;
  let subscriptionCycleStart = new Date().toISOString();
  let totalMembers = 0;

  while (page <= totalPages) {
    const response = await cursorFetch("/teams/spend", {
      page,
      pageSize: 100,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new CursorBillingApiError(
        `Cursor spend API failed (${response.status}): ${text.slice(0, 200)}`,
        response.status,
      );
    }
    const payload = JSON.parse(text) as {
      teamMemberSpend?: Array<Record<string, unknown>>;
      subscriptionCycleStart?: number;
      totalMembers?: number;
      totalPages?: number;
    };
    if (payload.subscriptionCycleStart) {
      subscriptionCycleStart = new Date(payload.subscriptionCycleStart).toISOString();
    }
    totalMembers = Number(payload.totalMembers ?? totalMembers);
    totalPages = Number(payload.totalPages ?? 1);
    for (const row of payload.teamMemberSpend ?? []) {
      members.push({
        userId: String(row.userId ?? ""),
        name: String(row.name ?? ""),
        email: String(row.email ?? ""),
        role: String(row.role ?? ""),
        spendCents: Number(row.spendCents ?? 0),
        overallSpendCents: Number(row.overallSpendCents ?? 0),
      });
    }
    page += 1;
  }

  const totalOverallSpendCents = members.reduce((sum, row) => sum + row.overallSpendCents, 0);
  const totalOnDemandSpendCents = members.reduce((sum, row) => sum + row.spendCents, 0);

  return {
    subscriptionCycleStart,
    subscriptionCycleEnd: null,
    totalMembers: totalMembers || members.length,
    totalOverallSpendCents,
    totalOnDemandSpendCents,
    members,
  };
}

export async function fetchCursorUsageEvents(input: {
  startDate: string;
  endDate: string;
}): Promise<CursorUsageEvent[]> {
  const events: CursorUsageEvent[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await cursorFetch("/teams/filtered-usage-events", {
      startDate: input.startDate,
      endDate: input.endDate,
      page,
      pageSize: 500,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new CursorBillingApiError(
        `Cursor usage events API failed (${response.status}): ${text.slice(0, 200)}`,
        response.status,
      );
    }
    const payload = JSON.parse(text) as {
      usageEvents?: Array<Record<string, unknown>>;
      totalPages?: number;
    };
    totalPages = Number(payload.totalPages ?? 1);
    for (const row of payload.usageEvents ?? []) {
      const timestamp =
        typeof row.timestamp === "number"
          ? new Date(row.timestamp).toISOString()
          : String(row.timestamp ?? new Date().toISOString());
      events.push({
        timestamp,
        model: String(row.model ?? row.modelName ?? "unknown"),
        kind: String(row.kind ?? "usage"),
        chargedCents: Number(row.chargedCents ?? 0),
        userEmail: row.userEmail ? String(row.userEmail) : null,
      });
    }
    page += 1;
  }

  return events;
}
