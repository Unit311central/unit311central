/**
 * CEO meeting flow: create immediately, then collect attendee emails and send invites.
 */
import {
  appendAttendeesToNotes,
  buildCalendarMeetingUrl,
  normalizeAttendeeEmails,
  sendCalendarMeetingInvites,
  stripAttendeesFromNotes,
} from "@/lib/calendar-invite-email";
import {
  listCalendarEvents,
  updateCalendarEvent,
} from "@/lib/internal-calendar-service";
import type { CalendarWorkspaceScope } from "@/lib/calendar-workspace";
import type { CalendarEvent } from "@/lib/calendar-data";
import type { AssistantBusinessContext, AssistantChatMessage } from "../../../types";

export const AWAITING_ATTENDEES_MARKER = "AWAITING_ATTENDEES";

export function withAwaitingAttendeesMarker(notes: string | null | undefined): string {
  const base = stripAttendeesFromNotes(notes)
    .replace(new RegExp(`\\n?${AWAITING_ATTENDEES_MARKER}\\b`, "gi"), "")
    .trim();
  return base ? `${base}\n${AWAITING_ATTENDEES_MARKER}` : AWAITING_ATTENDEES_MARKER;
}

export function clearAwaitingAttendeesMarker(notes: string | null | undefined): string | null {
  const cleared = (notes ?? "")
    .replace(new RegExp(`\\n?${AWAITING_ATTENDEES_MARKER}\\b`, "gi"), "")
    .trim();
  return cleared || null;
}

export function extractEmailsFromMessage(message: string): string[] {
  return normalizeAttendeeEmails(message);
}

export function isMeetingCreatedAsk(message: string): boolean {
  return /meeting created/i.test(message) && /email/i.test(message);
}

export function looksLikeMeetingAttendeeReply(
  message: string,
  history: AssistantChatMessage[],
): boolean {
  const emails = extractEmailsFromMessage(message);
  if (emails.length === 0) return false;
  // Pure email list / "send to a@x.com, b@y.com" after a meeting-created turn.
  const recent = [...history].reverse().slice(0, 8);
  return recent.some(
    (m) => m.role === "assistant" && isMeetingCreatedAsk(m.content || ""),
  );
}

export function meetingCreatedPrompt(clientName?: string | null): string {
  const who = clientName?.trim() || "the client";
  return `Meeting created — please give me the email addresses of the ${who} people you want to join the call.`;
}

async function resolveOrganiserEmail(
  business: AssistantBusinessContext,
): Promise<{ name: string; email: string }> {
  const name =
    business.user.displayName?.trim() ||
    business.workspace.name?.trim() ||
    "Workspace";
  const username = business.user.username?.trim() || "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    return { name, email: username.toLowerCase() };
  }

  try {
    const { isSupabaseConfigured } = await import("@/lib/supabase/server");
    const { createTenancyServerClient } = await import("@/lib/supabase/tenancy-server");
    if (isSupabaseConfigured() && business.user.id) {
      const supabase = createTenancyServerClient();
      const { data } = await supabase
        .from("platform_users")
        .select("email")
        .eq("id", business.user.id)
        .maybeSingle();
      const email = typeof data?.email === "string" ? data.email.trim() : "";
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { name, email: email.toLowerCase() };
      }
    }
  } catch {
    // fall through
  }

  const { brandFromWorkspaceClaim } = await import("@/lib/workspace-brand");
  const brand = brandFromWorkspaceClaim({
    slug: business.workspace.slug,
    name: business.workspace.name,
  });
  return { name, email: brand.supportEmail };
}

export async function findPendingMeetingForInvite(
  scope: CalendarWorkspaceScope,
  history: AssistantChatMessage[],
): Promise<CalendarEvent | null> {
  const events = await listCalendarEvents(undefined, undefined, scope);
  const awaiting = events
    .filter((e) => (e.notes || "").includes(AWAITING_ATTENDEES_MARKER))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (awaiting.length === 0) return null;

  // Prefer client mentioned in the recent schedule ask.
  const recentUser = [...history]
    .reverse()
    .find(
      (m) =>
        m.role === "user" &&
        /\b(schedule|book)\b/i.test(m.content || "") &&
        /\bmeeting\b/i.test(m.content || ""),
    );
  const withMatch = recentUser?.content?.match(
    /\b(?:with|for)\s+([A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){0,5})/,
  );
  const clientHint = withMatch?.[1]?.trim().toLowerCase();
  if (clientHint) {
    const hit = awaiting.find((e) => (e.clientName || "").toLowerCase().includes(clientHint));
    if (hit) return hit;
  }

  return awaiting[0] ?? null;
}

export async function sendMeetingAttendeeInvites(input: {
  event: CalendarEvent;
  attendeeEmails: string[];
  business: AssistantBusinessContext;
  scope: CalendarWorkspaceScope;
}): Promise<{ ok: boolean; message: string }> {
  const organiser = await resolveOrganiserEmail(input.business);
  const attendees = normalizeAttendeeEmails([
    ...input.attendeeEmails,
    organiser.email,
  ]);

  const meetingUrl =
    input.event.location && /^https?:\/\//i.test(input.event.location)
      ? input.event.location
      : buildCalendarMeetingUrl(input.event.id);

  const notes = appendAttendeesToNotes(
    clearAwaitingAttendeesMarker(input.event.notes),
    attendees,
  );

  const updated = await updateCalendarEvent(
    input.event.id,
    {
      location: meetingUrl,
      notes: notes || "",
    },
    input.scope,
  );

  const invites = await sendCalendarMeetingInvites({
    event: { ...updated, location: meetingUrl },
    attendeeEmails: attendees,
    organiserName: organiser.name,
    organiserEmail: organiser.email,
    workspaceId: input.scope.workspaceId,
  });

  if (invites.sent === 0) {
    return {
      ok: false,
      message: `Couldn't send invites${
        invites.failed.length ? ` (${invites.failed.join(", ")})` : ""
      }. Check mailbox settings and try again.`,
    };
  }

  const failedNote =
    invites.failed.length > 0 ? ` Failed: ${invites.failed.join(", ")}.` : "";
  return {
    ok: true,
    message: `Invites sent to ${invites.sent} recipient${invites.sent === 1 ? "" : "s"}.${failedNote}`,
  };
}
