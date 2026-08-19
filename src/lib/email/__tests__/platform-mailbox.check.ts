/**
 * Platform mailbox env resolution guards.
 * Run: node --import tsx src/lib/email/__tests__/platform-mailbox.check.ts
 */
import assert from "node:assert/strict";

import {
  isPlatformManagedMailboxEmail,
  resolvePlatformMailboxEmailFromEnv,
} from "@/lib/email/platform-mailbox";

assert.equal(isPlatformManagedMailboxEmail("paul@unit311central.com"), true);
assert.equal(isPlatformManagedMailboxEmail("paul.fotheringham@barcelonadronecenter.com"), false);

const paulDefault = "paul@unit311central.com";
assert.equal(
  resolvePlatformMailboxEmailFromEnv("paul", paulDefault, [
    "paul.fotheringham@barcelonadronecenter.com",
  ]),
  null,
);
assert.equal(
  resolvePlatformMailboxEmailFromEnv("paul", paulDefault, ["paul@unit311central.com"]),
  "paul@unit311central.com",
);

console.log("platform-mailbox.check.ts — all assertions passed");
