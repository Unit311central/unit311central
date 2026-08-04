/**
 * Run: node --import tsx src/lib/abhi/__tests__/abhi-request-org-state.check.ts
 */
import assert from "node:assert/strict";
import {
  getAbhiRequestMeetings,
  iterateWithAbhiRequestOrgState,
  parseAbhiClientOrgState,
  runWithAbhiRequestOrgState,
} from "../abhi-request-org-state";
import { getAbhiBoardMeetingsServerSnapshot } from "../board-meetings-store";

async function main() {
  const parsed = parseAbhiClientOrgState({
    meetings: {
      meetings: [
        {
          id: "BM-TEST",
          meetingDate: "2026-09-01",
          title: "Test Board",
          status: "Held",
          attendees: [],
          agenda: [],
          decisions: [],
          actions: [
            {
              id: "BA-TEST",
              title: "Client-synced overdue action",
              owner: "Test Owner",
              dueDate: "2026-08-01",
              status: "Overdue",
            },
          ],
          notes: "",
          resolutions: [],
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
        },
      ],
    },
    risks: {
      risks: [
        {
          id: "R-99",
          description: "Client-synced risk",
          owner: "Risk Owner",
          impact: "H",
          likelihood: "H",
          rating: 25,
          trend: "↑",
          mitigation: "Mitigate",
          status: "Active",
          dateRaised: "2026-07-01",
          reviewDate: "2026-08-15",
          archived: false,
          createdAt: "2026-07-01T00:00:00Z",
          updatedAt: "2026-07-01T00:00:00Z",
        },
      ],
    },
  });
  assert.ok(parsed?.meetings?.meetings.length === 1);
  assert.ok(parsed?.risks?.risks.length === 1);

  runWithAbhiRequestOrgState(parsed, () => {
    const overlay = getAbhiRequestMeetings();
    assert.equal(overlay?.meetings[0]?.id, "BM-TEST");
    const snap = getAbhiBoardMeetingsServerSnapshot();
    assert.equal(snap.meetings[0]?.id, "BM-TEST");
    assert.equal(snap.meetings[0]?.actions[0]?.title, "Client-synced overdue action");
  });

  async function* gen() {
    yield getAbhiBoardMeetingsServerSnapshot().meetings[0]?.id ?? "none";
  }

  const seen: string[] = [];
  for await (const id of iterateWithAbhiRequestOrgState(parsed, gen())) {
    seen.push(String(id));
  }
  assert.deepEqual(seen, ["BM-TEST"]);
  console.log("ok  ABHI request org-state overlay works\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
