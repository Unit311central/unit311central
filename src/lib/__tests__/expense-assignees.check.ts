import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  expenseAssigneesFromHrEmployees,
  expenseAssigneesFromInternalUsers,
  expenseAssigneesUseInternalUsers,
  mergeExpenseAssignees,
  resolveDefaultExpenseAssigneeId,
} from "@/lib/expense-assignees";

const ONWARD_AIR_ROSTER = [
  { id: "hr-alec", fullName: "Alec Gibson", email: "alec.gibson@onwardair.tech", employmentStatus: "active" },
  { id: "hr-anuj", fullName: "Anuj Kumar", email: "anuj.kumar@onwardair.tech", employmentStatus: "active" },
  { id: "hr-scott", fullName: "Scott Parazynski, MD", email: "scott.parazynski@onwardair.tech", employmentStatus: "active" },
];

const UNIT311_USERS = [
  {
    id: "user-admin",
    fullName: "Admin",
    email: "admin@unit311central.com",
    username: "admin@unit311central.com",
    status: "Active",
    operatorLabel: "Admin",
  },
  {
    id: "user-jordi",
    fullName: "Jordi Vila",
    email: "jordi.vila@unit311central.com",
    username: "jordi",
    status: "Active",
    operatorLabel: "Jordi",
  },
  {
    id: "user-board",
    fullName: "Board",
    email: "board@unit311central.com",
    username: "board@unit311central.com",
    status: "Inactive",
    operatorLabel: "Board",
  },
];

test("internal Unit311 host assigns expenses to internal users, not the HR roster", () => {
  assert.equal(
    expenseAssigneesUseInternalUsers({ host: "internal.unit311central.com" }),
    true,
  );
  assert.equal(
    expenseAssigneesUseInternalUsers({ host: "internal.localhost", workspaceSlug: "unit311" }),
    true,
  );
  assert.equal(expenseAssigneesUseInternalUsers({ workspaceSlug: "unit311" }), true);
  assert.equal(
    expenseAssigneesUseInternalUsers({
      host: "onwardair.unit311central.com",
      workspaceSlug: "onwardair",
    }),
    false,
  );
  assert.equal(
    expenseAssigneesUseInternalUsers({ host: "demo.unit311central.com", workspaceSlug: "demo" }),
    false,
  );
});

test("internal user list drops inactive accounts and does not include OnwardAir staff", () => {
  const assignees = expenseAssigneesFromInternalUsers(UNIT311_USERS);
  assert.deepEqual(
    assignees.map((assignee) => assignee.fullName),
    ["Admin", "Jordi Vila"],
  );
  assert.equal(
    assignees.some((assignee) => assignee.email.endsWith("@onwardair.tech")),
    false,
  );
});

test("signed-in Unit311 user is the default assignee, never the first HR name", () => {
  const hrAssignees = expenseAssigneesFromHrEmployees(ONWARD_AIR_ROSTER);
  assert.equal(hrAssignees[0]?.fullName, "Alec Gibson");
  assert.equal(
    resolveDefaultExpenseAssigneeId(hrAssignees, {
      displayName: "Jordi",
      email: "jordi.vila@unit311central.com",
      username: "jordi",
    }),
    "",
  );

  const internalAssignees = expenseAssigneesFromInternalUsers(UNIT311_USERS);
  assert.equal(
    resolveDefaultExpenseAssigneeId(internalAssignees, {
      displayName: "Jordi",
      email: "jordi.vila@unit311central.com",
      username: "jordi",
    }),
    "user-jordi",
  );
  assert.equal(
    resolveDefaultExpenseAssigneeId(internalAssignees, {
      displayName: "Someone Else",
      email: "someone@example.com",
    }),
    "",
  );
});

test("legacy HR claimant names still resolve when the picker is internal users", () => {
  const merged = mergeExpenseAssignees(
    expenseAssigneesFromInternalUsers(UNIT311_USERS),
    expenseAssigneesFromHrEmployees(ONWARD_AIR_ROSTER),
  );
  assert.equal(merged.find((assignee) => assignee.id === "hr-alec")?.fullName, "Alec Gibson");
  assert.equal(merged.find((assignee) => assignee.id === "user-jordi")?.fullName, "Jordi Vila");
});

test("expenses hub loads messaging operators for the internal assignee picker", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/components/testflighthub/ExpensesHubWorkspace.tsx"),
    "utf8",
  );
  assert.match(source, /expenseAssigneesUseInternalUsers/);
  assert.match(source, /\/api\/users/);
  assert.match(source, /\/api\/messaging\/operators/);
  assert.match(source, /resolveDefaultExpenseAssigneeId/);
  assert.doesNotMatch(source, /employees\[0\]/);
});
