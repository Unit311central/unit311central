import type { SupportTicketPriority } from "@/lib/support-data";

export const CLIENT_OPEN_TICKET_PHRASE = "Open new ticket";

export const CLIENT_INTAKE_PROMPTS = {
  name: "What is your name?",
  organisation: "What is your organisation name?",
  priority: "What is the priority?",
  description: "Description of problem?",
  received: "Thank you. A support agent will be assigned shortly.",
} as const;

export const OPEN_NEW_TICKET_RE = /^open\s+new\s+ticket\.?$/i;

/** @deprecated Kept for older tests */
export const OPEN_NEW_SUPPORT_TICKET_RE = /^open\s+new\s+support\s+ticket\.?$/i;

export function isOpenTicketCommand(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  return OPEN_NEW_TICKET_RE.test(normalized) || OPEN_NEW_SUPPORT_TICKET_RE.test(normalized);
}

export function parseClientPriorityAnswer(text: string): SupportTicketPriority | null {
  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  const direct = normalized.replace(/^priority\s*:?\s*/, "");

  if (/^(low|lo|l|1|minor)$/.test(direct) || /\blow\b/.test(direct)) return "low";
  if (/^(medium|med|m|2|normal)$/.test(direct) || /\bmedium\b/.test(direct) || /\bmed\b/.test(direct)) {
    return "medium";
  }
  if (/^(high|hi|h|3|important)$/.test(direct) || /\bhigh\b/.test(direct)) return "high";
  if (/^(urgent|critical|4|emergency)$/.test(direct) || /\burgent\b/.test(direct)) return "urgent";

  return null;
}

export function inputPlaceholderForStep(step: string | null | undefined) {
  switch (step) {
    case "awaiting_name":
      return "Type your name";
    case "awaiting_organisation":
      return "Type your organisation";
    case "awaiting_priority":
      return "Type your priority (e.g. Low, Medium, High)";
    case "awaiting_description":
      return "Describe the problem";
    default:
      return "Type Open new ticket to start";
  }
}

export function nextPromptForStep(step: string | null | undefined) {
  switch (step) {
    case "awaiting_name":
      return CLIENT_INTAKE_PROMPTS.name;
    case "awaiting_organisation":
      return CLIENT_INTAKE_PROMPTS.organisation;
    case "awaiting_priority":
      return CLIENT_INTAKE_PROMPTS.priority;
    case "awaiting_description":
      return CLIENT_INTAKE_PROMPTS.description;
    default:
      return null;
  }
}
