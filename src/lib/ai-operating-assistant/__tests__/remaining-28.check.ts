import { resolveOrchestrationRoute } from "../action-orchestration";
import { registerAllActionModules } from "../actions/register-all-modules";
import { classifyKnowledgeDomain } from "../knowledge-domains";
import { hasExplicitWriteIntent } from "../intent-action-resolver";
import { answerPlatformQuestion } from "../application-catalogue";

registerAllActionModules();

const business = {
  user: { id: "u", username: "u", displayName: "U", userType: "internal" as const },
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
    roleView: "c-suite" as const,
    canAccessFinancials: true,
    canAccessUsers: true,
    canAccessStrategy: true,
    canAccessHr: true,
  },
  generatedAt: new Date().toISOString(),
};

const prompts: Array<[string, string]> = [
  ["write", "Schedule a demo for Peak Infrastructure next Tuesday."],
  ["write", "Send the onboarding checklist to the new client contact."],
  ["write", "Convert Peak Infrastructure from potential to active client."],
  ["write", "Close the completed intranet redesign project."],
  ["write", "Schedule payment for the DJI battery order."],
  ["write", "Tag last week's hotel receipts to the Coastal project."],
  ["write", "Schedule a performance check-in with the ops lead."],
  ["business", "Confirm the Wise account is linked correctly."],
  ["write", "Record that Assets went live this morning."],
  ["business", "Where is software spend concentrated?"],
  ["write", "Record renewal of the client portal TLS cert."],
  ["business", "Run a technology compliance report."],
  ["business", "Find the latest board pack draft."],
  ["business", "Find the signed proposal for Coastal LiDAR."],
  ["business", "Flag support escalations in the inbox."],
  ["write", "Close the resolved orthophoto download ticket."],
  ["business", "Flag chats older than four hours unanswered."],
  ["write", "Cancel the duplicate order for landing gear."],
  ["write", "Enrol Jordan Lee on UAV safety fundamentals."],
  ["write", "Publish a revised flight operations SOP."],
  ["write", "Retire the superseded battery handling guide."],
  ["business", "Run a QMS performance report."],
  ["write", "Schedule the new case study to go live Friday."],
  ["write", "Connect the company calendar integration if missing."],
  ["business", "Find the latest Unit311 product preview video."],
  ["write", "Deactivate the leaver account for last month's contractor."],
  ["write", "Revoke access for the former Harbour Mapping contact."],
  ["write", "Switch the invoice delivery preference to email PDF."],
];

async function main() {
  let bad = 0;
  for (const [exp, p] of prompts) {
    const d = classifyKnowledgeDomain(p);
    const w = hasExplicitWriteIntent(p);
    const plat = answerPlatformQuestion(p);
    const r = await resolveOrchestrationRoute(p, [], business);
    const tool = r.kind === "tool" ? r.intent.tool : r.kind;
    const msg =
      r.kind === "capability_answer"
        ? r.message.slice(0, 90)
        : r.kind === "platform_answer"
          ? r.message.slice(0, 60)
          : "";

    let ok = true;
    if (exp === "write") {
      // Expect honest unsupported, need_info, or a real write propose — not search*/queryBusiness/platform.
      const honest =
        r.kind === "capability_answer" ||
        r.kind === "need_info" ||
        (r.kind === "tool" &&
          (r.intent.tool === "proposeBusinessActionPlan" ||
            r.intent.tool === "planBusinessGoal"));
      ok = honest && !plat;
    } else {
      ok =
        !plat &&
        r.kind !== "platform_answer" &&
        !(r.kind === "tool" && r.intent.tool === "proposeBusinessActionPlan") &&
        d.domain !== "write";
    }
    if (!ok) bad += 1;
    console.log(
      JSON.stringify({
        ok,
        exp,
        domain: d.domain,
        write: w,
        plat: Boolean(plat),
        route: tool,
        msg,
      }),
    );
  }
  console.log(JSON.stringify({ bad, total: prompts.length }));
  if (bad) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
