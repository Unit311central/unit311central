/**
 * WOLF Central messaging operator allowlist checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-messaging-operators.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { ManagedUser } from "@/lib/user-management-data";
import {
  filterWolfMessagingOperatorIds,
  filterWolfMessagingOperators,
  isWolfCentralOperatorUsername,
  isWolfMessagingAllowedOperator,
  WOLF_CENTRAL_OPERATOR_ALLOWLIST,
} from "@/lib/wolf/wolf-messaging-operators";
import { usesWorkspaceTenantUserManagement } from "@/lib/customer-workspace-surface";
import { requestTargetsWolfCentral } from "@/lib/wolf/wolf-surface";

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

assert.equal(WOLF_CENTRAL_OPERATOR_ALLOWLIST.length, 5);
assert.equal(filterWolfMessagingOperators([...allowedUsers, blockedUser]).length, 5);
assert.ok(isWolfMessagingAllowedOperator({ username: "bcn@wolf.unit311central.com", email: "bcn@wolf.unit311central.com" }));
assert.ok(
  !isWolfMessagingAllowedOperator({ username: "bcnother@wolf.unit311central.com", email: "bcnother@wolf.unit311central.com" }),
);
assert.deepEqual(
  filterWolfMessagingOperatorIds([...allowedUsers, blockedUser], ["1", "2", "6", "99"]),
  ["1", "2"],
);
assert.equal(isWolfCentralOperatorUsername("jordi@wolf.unit311central.com"), true);
assert.equal(isWolfCentralOperatorUsername("Jordi"), true);
assert.equal(isWolfCentralOperatorUsername("other@wolf.unit311central.com"), false);
assert.equal(
  usesWorkspaceTenantUserManagement("wolf-central", "jordi@wolf.unit311central.com"),
  true,
);
assert.equal(usesWorkspaceTenantUserManagement("wolf-central", "jordi"), true);
assert.equal(usesWorkspaceTenantUserManagement("wolf-central", "other@wolf.unit311central.com"), false);
assert.match(
  readFileSync("src/lib/internal-admin-auth.ts", "utf8"),
  /isWolfCentralOperatorUsername\(session\.username\)/,
);
assert.match(
  readFileSync("src/lib/workspace-authorization.ts", "utf8"),
  /from "@\/lib\/wolf\/wolf-operator-access"/,
);
assert.match(
  readFileSync("src/lib/workspace-context.ts", "utf8"),
  /sessionUsername: session\.username/,
);
assert.match(
  readFileSync("src/lib/internal-admin-auth.ts", "utf8"),
  /requestTargetsWolfCentral\(requestHeaders\)/,
);
assert.equal(
  requestTargetsWolfCentral({
    get(name: string) {
      return name === "origin" ? "https://wolf.unit311central.com" : null;
    },
  }),
  true,
);
assert.equal(
  requestTargetsWolfCentral({
    get(name: string) {
      return name === "origin" ? "https://talantonimpact.unit311central.com" : null;
    },
  }),
  false,
);
assert.doesNotMatch(
  readFileSync("src/lib/wolf/wolf-operator-access.ts", "utf8"),
  /from ["'](?:@\/lib\/platform-auth|node:crypto)["']/,
);

function localImports(source: string): string[] {
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((specifier) => specifier.startsWith("@/") || specifier.startsWith("."));
}

function resolveSpecifier(specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? `src/${specifier.slice(2)}`
    : specifier;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    try {
      readFileSync(candidate, "utf8");
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

const cryptoImporters = new Set<string>();
const seen = new Set<string>();
const queue = ["src/middleware.ts"];
while (queue.length > 0) {
  const file = queue.pop()!;
  if (seen.has(file)) continue;
  seen.add(file);
  const source = readFileSync(file, "utf8");
  if (/from ["']node:crypto["']|import ["']node:crypto["']/.test(source)) cryptoImporters.add(file);
  for (const specifier of localImports(source)) {
    const resolved = resolveSpecifier(specifier);
    if (resolved) queue.push(resolved);
  }
}
assert.deepEqual([...cryptoImporters], [], `middleware import graph reaches node:crypto via ${[...cryptoImporters].join(", ")}`);

console.log("wolf-messaging-operators.check.ts — all assertions passed.");
