/**
 * WOLF Central messaging operator allowlist checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-messaging-operators.check.ts
 */
import assert from "node:assert/strict";

import type { ManagedUser } from "@/lib/user-management-data";
import {
  filterWolfMessagingOperatorIds,
  filterWolfMessagingOperators,
  isWolfMessagingAllowedOperator,
} from "@/lib/wolf/wolf-messaging-operators";

function fixture(partial: Partial<ManagedUser> & Pick<ManagedUser, "id" | "username" | "email">): ManagedUser {
  return {
    id: partial.id,
    username: partial.username,
    email: partial.email,
    operatorLabel: partial.operatorLabel ?? "Op",
    fullName: partial.fullName ?? "Operator",
    phone: "",
    role: "Associate",
    roles: ["Associate"],
    department: "Corporate",
    departments: ["Corporate"],
    status: "Active",
    region: "",
    licenseId: "",
    notes: "",
    allowedViews: null,
    dashboardPrefs: null,
  };
}

const allowedUsers = [
  fixture({
    id: "1",
    username: "admin@wolf.unit311central.com",
    email: "admin@wolf.unit311central.com",
  }),
  fixture({ id: "2", username: "alex@wolf.unit311central.com", email: "alex@wolf.unit311central.com" }),
  fixture({ id: "3", username: "jordi@wolf.unit311central.com", email: "jordi@wolf.unit311central.com" }),
  fixture({ id: "4", username: "bcn@wolf.unit311central.com", email: "bcn@wolf.unit311central.com" }),
  fixture({
    id: "5",
    username: "bcnengineer@wolf.unit311central.com",
    email: "bcnengineer@wolf.unit311central.com",
  }),
];

const blockedUser = fixture({
  id: "6",
  username: "other@wolf.unit311central.com",
  email: "other@wolf.unit311central.com",
});

assert.equal(filterWolfMessagingOperators([...allowedUsers, blockedUser]).length, 5);
assert.ok(isWolfMessagingAllowedOperator({ username: "bcn@wolf.unit311central.com", email: "bcn@wolf.unit311central.com" }));
assert.ok(
  !isWolfMessagingAllowedOperator({ username: "bcnother@wolf.unit311central.com", email: "bcnother@wolf.unit311central.com" }),
);
assert.deepEqual(
  filterWolfMessagingOperatorIds([...allowedUsers, blockedUser], ["1", "2", "6", "99"]),
  ["1", "2"],
);

console.log("wolf-messaging-operators.check.ts — all assertions passed.");
