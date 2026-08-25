import type {
  CreateUnit311SupportTicketInput,
  Unit311SupportTicket,
  Unit311SupportTicketDetail,
} from "@/lib/unit311-support/types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status}).`);
  }
  return payload;
}

export async function fetchUnit311SupportTickets(): Promise<{
  tickets: Unit311SupportTicket[];
  summary: { open: number; awaitingCustomer: number; resolved: number };
}> {
  const response = await fetch("/api/unit311-support/tickets", {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(response);
}

export async function fetchUnit311SupportTicket(id: string): Promise<{ ticket: Unit311SupportTicketDetail }> {
  const response = await fetch(`/api/unit311-support/tickets/${encodeURIComponent(id)}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(response);
}

export async function createUnit311SupportTicket(
  input: CreateUnit311SupportTicketInput,
): Promise<{ ticket: Unit311SupportTicketDetail }> {
  const response = await fetch("/api/unit311-support/tickets", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export async function replyToUnit311SupportTicket(
  id: string,
  body: string,
): Promise<{ ticket: Unit311SupportTicketDetail }> {
  const response = await fetch(`/api/unit311-support/tickets/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return parseJson(response);
}

export async function fetchUnit311SupportOrgWorkspaces(): Promise<{
  workspaces: Array<{ id: string; name: string; slug: string }>;
}> {
  const response = await fetch("/api/unit311-support/org-workspaces", {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(response);
}

export async function fetchInternalUnit311SupportTickets(): Promise<{
  tickets: Unit311SupportTicket[];
}> {
  const response = await fetch("/api/internal/unit311-support/tickets", {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(response);
}

export async function fetchInternalUnit311SupportTicket(
  id: string,
): Promise<{ ticket: Unit311SupportTicketDetail }> {
  const response = await fetch(`/api/internal/unit311-support/tickets/${encodeURIComponent(id)}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(response);
}

export async function updateInternalUnit311SupportTicket(
  id: string,
  patch: {
    status?: string;
    severity?: string | null;
    assignedTo?: string | null;
  },
): Promise<{ ticket: Unit311SupportTicketDetail }> {
  const response = await fetch(`/api/internal/unit311-support/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJson(response);
}

export async function replyInternalUnit311SupportTicket(
  id: string,
  body: string,
): Promise<{ ticket: Unit311SupportTicketDetail }> {
  const response = await fetch(
    `/api/internal/unit311-support/tickets/${encodeURIComponent(id)}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    },
  );
  return parseJson(response);
}
