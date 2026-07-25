import {
  createCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
} from "@/lib/internal-calendar-service";
import type { CalendarWorkspaceScope } from "@/lib/calendar-workspace";
import type { AssistantActionDefinition } from "../../types";
import type { AssistantBusinessContext } from "../../../types";
import {
  defaultMeetingTitle,
  enrichScheduleMeetingInput,
  parseNaturalWhen,
} from "./natural-when";
import {
  meetingCreatedPrompt,
  withAwaitingAttendeesMarker,
} from "./meeting-invite-flow";
import { buildCalendarMeetingUrl } from "@/lib/calendar-invite-email";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function calendarScope(business: AssistantBusinessContext): CalendarWorkspaceScope {
  return { workspaceId: business.workspace.id?.trim() || null };
}

function parseWhen(raw: string): string | null {
  return parseNaturalWhen(raw);
}

export const scheduleMeetingAction: AssistantActionDefinition = {
  id: "calendar.scheduleMeeting",
  name: "Schedule meeting",
  description: "Create a calendar meeting/event from natural language.",
  module: "calendar",
  requiredPermissions: ["authenticated"],
  confirmationRequired: false,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      startsAt: { type: "string" },
      endsAt: { type: "string" },
      clientName: { type: "string" },
      location: { type: "string" },
      notes: { type: "string" },
    },
    required: ["startsAt"],
  },
  capability: {
    id: "calendar.scheduleMeeting",
    businessObject: "CalendarEvent",
    intentExamples: [
      "Schedule a demo for Peak Infrastructure next Tuesday",
      "Book a performance check-in with the ops lead",
      "Schedule a discovery meeting Friday at 10am",
      "Schedule a meeting with Manpower next Tuesday at 10",
    ],
    semanticAliases: [
      "schedule",
      "book",
      "meeting",
      "demo",
      "calendar",
      "appointment",
      "check-in",
      "checkin",
    ],
    entityExtraction: {
      primaryNameFields: ["clientName"],
      fields: [
        { field: "clientName", from: "named_entity" },
        { field: "location", from: "location" },
      ],
    },
    confirmationPolicy: "never",
    successFormatter: {
      template:
        "Meeting created — please give me the email addresses of the {clientName} people you want to join the call.",
      fields: [{ token: "clientName", path: "result.clientName" }],
    },
    suggestedFollowUps: [
      { label: "Reschedule meeting", actionId: "calendar.rescheduleMeeting" },
    ],
    relationships: { suggestedNext: [] },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.user.id) {
        return { ok: false, errors: ["Authentication required."], warnings: [] };
      }
      const enriched = enrichScheduleMeetingInput("", input);
      const startsAt = parseWhen(asTrimmedString(enriched.startsAt));
      if (!startsAt) {
        return {
          ok: false,
          errors: ["Provide a start time (e.g. next Tuesday at 10am)."],
          warnings: [],
        };
      }
      return { ok: true, errors: [], warnings: [] };
    },

    async preview(input) {
      const enriched = enrichScheduleMeetingInput("", input);
      const title = defaultMeetingTitle(
        asTrimmedString(enriched.clientName),
        asTrimmedString(enriched.title),
      );
      const startsAt =
        parseWhen(asTrimmedString(enriched.startsAt)) ||
        asTrimmedString(enriched.startsAt) ||
        "(time TBC)";
      return {
        summary: `Schedule “${title}” at ${startsAt}`,
        affectedRecords: [{ type: "calendar_event", id: "new", label: title, change: "Create" }],
        warnings: [],
        reversible: false,
      };
    },

    async execute(input, ctx) {
      const enriched = enrichScheduleMeetingInput("", input);
      const title = defaultMeetingTitle(
        asTrimmedString(enriched.clientName),
        asTrimmedString(enriched.title),
      );
      const startsAt = parseWhen(asTrimmedString(enriched.startsAt));
      if (!startsAt) {
        return { ok: false, message: "A valid start time is required." };
      }
      let endsAt = parseWhen(asTrimmedString(enriched.endsAt));
      if (!endsAt) {
        endsAt = new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
      }
      const clientName = asTrimmedString(enriched.clientName) || undefined;
      const scope = calendarScope(ctx.business);
      const event = await createCalendarEvent(
        {
          title,
          startsAt,
          endsAt,
          clientName,
          location: asTrimmedString(enriched.location) || undefined,
          notes: withAwaitingAttendeesMarker(asTrimmedString(enriched.notes) || null),
          eventType: "meeting",
        },
        scope,
      );
      const meetingUrl = buildCalendarMeetingUrl(event.id);
      const finalEvent = await updateCalendarEvent(
        event.id,
        {
          location: meetingUrl,
          notes: event.notes || withAwaitingAttendeesMarker(null),
        },
        scope,
      );
      return {
        ok: true,
        message: meetingCreatedPrompt(clientName),
        recordId: finalEvent.id,
        recordLabel: finalEvent.title,
        beforeState: null,
        afterState: {
          eventId: finalEvent.id,
          title: finalEvent.title,
          startsAt: finalEvent.startsAt,
          endsAt: finalEvent.endsAt,
          clientName: finalEvent.clientName,
          meetingUrl,
        },
        output: {
          eventId: finalEvent.id,
          title: finalEvent.title,
          startsAt: finalEvent.startsAt,
          clientName: finalEvent.clientName || clientName || "the client",
          meetingUrl,
        },
      };
    },
  },
};

export const rescheduleMeetingAction: AssistantActionDefinition = {
  id: "calendar.rescheduleMeeting",
  name: "Reschedule meeting",
  description: "Move an existing calendar meeting to a new time.",
  module: "calendar",
  requiredPermissions: ["authenticated"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: true,
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string" },
      title: { type: "string" },
      startsAt: { type: "string" },
      endsAt: { type: "string" },
    },
    required: ["startsAt"],
  },
  capability: {
    id: "calendar.rescheduleMeeting",
    businessObject: "CalendarEvent",
    intentExamples: [
      "Reschedule the Harbour Mapping discovery to Friday",
      "Move tomorrow's demo to 3pm",
    ],
    semanticAliases: ["reschedule", "move", "meeting", "calendar", "demo"],
    entityExtraction: {
      primaryNameFields: ["title"],
      fields: [{ field: "title", from: "named_entity" }],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Meeting rescheduled.\n\n{recordLabel}\nNew start {startsAt}",
      fields: [
        { token: "recordLabel", path: "result.recordLabel" },
        { token: "startsAt", path: "result.startsAt" },
      ],
    },
    suggestedFollowUps: [],
    relationships: { suggestedNext: [] },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.user.id) {
        return { ok: false, errors: ["Authentication required."], warnings: [] };
      }
      const startsAt = parseWhen(asTrimmedString(input.startsAt));
      if (!startsAt) {
        return { ok: false, errors: ["Provide a valid new start time."], warnings: [] };
      }
      const scope = calendarScope(ctx.business);
      const eventId = asTrimmedString(input.eventId);
      const title = asTrimmedString(input.title);
      const events = await listCalendarEvents(undefined, undefined, scope);
      const match = eventId
        ? events.find((e) => e.id === eventId)
        : title
          ? events.find((e) => e.title.toLowerCase().includes(title.toLowerCase()))
          : null;
      if (!match) {
        return {
          ok: false,
          errors: ["Calendar event not found. Name the meeting or provide eventId."],
          warnings: [],
        };
      }
      return { ok: true, errors: [], warnings: [] };
    },

    async preview(input, ctx) {
      const scope = calendarScope(ctx.business);
      const events = await listCalendarEvents(undefined, undefined, scope);
      const eventId = asTrimmedString(input.eventId);
      const title = asTrimmedString(input.title);
      const match = eventId
        ? events.find((e) => e.id === eventId)
        : title
          ? events.find((e) => e.title.toLowerCase().includes(title.toLowerCase()))
          : null;
      if (!match) {
        return {
          summary: "Reschedule meeting (not found)",
          affectedRecords: [],
          warnings: ["Calendar event not found."],
          reversible: true,
        };
      }
      return {
        summary: `Reschedule “${match.title}” → ${asTrimmedString(input.startsAt)}`,
        affectedRecords: [
          {
            type: "calendar_event",
            id: match.id,
            label: match.title,
            change: `${match.startsAt} → ${asTrimmedString(input.startsAt)}`,
          },
        ],
        warnings: [],
        reversible: true,
      };
    },

    async execute(input, ctx) {
      const startsAt = parseWhen(asTrimmedString(input.startsAt));
      if (!startsAt) {
        return { ok: false, message: "Invalid start time." };
      }
      const scope = calendarScope(ctx.business);
      const events = await listCalendarEvents(undefined, undefined, scope);
      const eventId = asTrimmedString(input.eventId);
      const title = asTrimmedString(input.title);
      const match = eventId
        ? events.find((e) => e.id === eventId)
        : title
          ? events.find((e) => e.title.toLowerCase().includes(title.toLowerCase()))
          : null;
      if (!match) {
        return { ok: false, message: "Calendar event not found." };
      }
      let endsAt = parseWhen(asTrimmedString(input.endsAt));
      if (!endsAt) {
        const duration =
          new Date(match.endsAt).getTime() - new Date(match.startsAt).getTime();
        endsAt = new Date(
          new Date(startsAt).getTime() + (Number.isFinite(duration) ? duration : 3600000),
        ).toISOString();
      }
      const updated = await updateCalendarEvent(
        match.id,
        { startsAt, endsAt },
        scope,
      );
      return {
        ok: true,
        message: `Rescheduled “${updated.title}”.`,
        recordId: updated.id,
        recordLabel: updated.title,
        beforeState: {
          startsAt: match.startsAt,
          endsAt: match.endsAt,
        },
        afterState: {
          startsAt: updated.startsAt,
          endsAt: updated.endsAt,
        },
        output: {
          eventId: updated.id,
          startsAt: updated.startsAt,
        },
      };
    },

    async rollback(_input, ctx) {
      const id = asTrimmedString(ctx.executeResult.recordId);
      const previousStartsAt = parseWhen(
        asTrimmedString(ctx.executeResult.beforeState?.startsAt),
      );
      const previousEndsAt = parseWhen(
        asTrimmedString(ctx.executeResult.beforeState?.endsAt),
      );
      if (!id || !previousStartsAt || !previousEndsAt) {
        return { ok: false, message: "No prior schedule to restore." };
      }
      const updated = await updateCalendarEvent(
        id,
        { startsAt: previousStartsAt, endsAt: previousEndsAt },
        calendarScope(ctx.business),
      );
      return {
        ok: true,
        message: `Restored schedule for “${updated.title}”.`,
      };
    },
  },
};
