/**
 * Calendar NL datetime parsing for CEO schedule asks.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/schedule-meeting-nl.check.ts
 */
import assert from "node:assert/strict";
import {
  enrichScheduleMeetingInput,
  extractMeetingClientName,
  extractWhenPhrase,
  parseNaturalWhen,
} from "../actions/modules/calendar/natural-when";
import { registerAllActionModules } from "../actions/register-all-modules";
import { resolveBusinessActionIntent } from "../intent-action-resolver";
import type { AssistantBusinessContext } from "../types";

registerAllActionModules();

const business: AssistantBusinessContext = {
  user: { id: "u", username: "u", displayName: "U", userType: "internal" },
  organisation: { id: null, name: null },
  workspace: { id: null, name: "W", slug: "w" },
  page: { activeView: "ea", label: "EA", pathname: null },
  selection: {
    clientId: null,
    clientName: null,
    projectId: null,
    projectName: null,
    employeeId: null,
    employeeName: null,
    contractId: null,
    contractName: null,
    fileId: null,
    fileName: null,
  },
  permissions: {
    roleView: "c-suite",
    canAccessFinancials: true,
    canAccessUsers: true,
    canAccessStrategy: true,
    canAccessHr: true,
  },
  generatedAt: new Date().toISOString(),
};

async function main() {
  const prompt = "Schedule a meeting with Manpower next Tuesday at 10a,";
  assert.equal(extractMeetingClientName(prompt), "Manpower");
  assert.match(String(extractWhenPhrase(prompt)), /tuesday/i);

  const now = new Date("2026-07-24T12:00:00.000Z"); // Friday
  const parsed = parseNaturalWhen("next Tuesday at 10a", now);
  assert.ok(parsed, "expected parsed datetime");
  const d = new Date(parsed!);
  assert.equal(d.getUTCDay(), 2, `expected Tuesday, got ${d.toISOString()}`);
  // 10am local — just assert hour is morning-ish in local TZ
  assert.ok(d.getHours() === 10 || d.getUTCHours() === 10 || d.getHours() === 8);

  const enriched = enrichScheduleMeetingInput(prompt, {}, now);
  assert.equal(enriched.clientName, "Manpower");
  assert.equal(enriched.title, "Meeting with Manpower");
  assert.ok(typeof enriched.startsAt === "string" && enriched.startsAt.includes("T"));

  const intent = await resolveBusinessActionIntent(prompt, business);
  assert.equal(intent.kind, "propose", JSON.stringify(intent));
  if (intent.kind === "propose") {
    assert.equal(intent.actionId, "calendar.scheduleMeeting");
    assert.equal(intent.input.clientName, "Manpower");
    assert.equal(intent.input.title, "Meeting with Manpower");
    assert.ok(String(intent.input.startsAt).includes("T"));
  }

  console.log(JSON.stringify({ ok: true, startsAt: enriched.startsAt }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
