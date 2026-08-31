/**
 * Email managed addresses — static checks.
 * Run: node --import tsx src/lib/email/__tests__/managed-addresses.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  isAllowedFromAddress,
  primaryManagedAddress,
  resolveReceivedByAddress,
  resolveSentFromAddress,
} from "@/lib/email/received-address";

const root = process.cwd();

const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/192_email_mailbox_managed_addresses.sql"),
  "utf8",
);
assert.match(migration, /email_mailbox_profiles/, "migration must create mailbox profiles");
assert.match(migration, /email_mailbox_addresses/, "migration must create managed addresses");
assert.match(migration, /tom@interfaceworx\.com/, "migration must seed Tom primary address");
assert.match(migration, /info@interfaceworx\.com/, "migration must seed info alias");

const managed = [
  { address: "tom@interfaceworx.com", kind: "primary" as const },
  { address: "info@interfaceworx.com", kind: "alias" as const },
];

assert.equal(
  resolveReceivedByAddress({
    headers: new Map([["delivered-to", "info@interfaceworx.com"]]),
    to: undefined,
    cc: undefined,
    managedAddresses: managed,
    mailboxAuthEmail: "tom@interfaceworx.com",
  }),
  "info@interfaceworx.com",
);

assert.equal(
  resolveReceivedByAddress({
    headers: new Map([["delivered-to", "tom@interfaceworx.com"]]),
    to: undefined,
    cc: undefined,
    managedAddresses: managed,
    mailboxAuthEmail: "tom@interfaceworx.com",
  }),
  "tom@interfaceworx.com",
);

assert.equal(
  resolveSentFromAddress({
    fromEmail: "info@interfaceworx.com",
    managedAddresses: managed,
    mailboxAuthEmail: "tom@interfaceworx.com",
  }),
  "info@interfaceworx.com",
);

assert.equal(primaryManagedAddress(managed, "tom@interfaceworx.com"), "tom@interfaceworx.com");
assert.equal(isAllowedFromAddress("info@interfaceworx.com", managed), true);
assert.equal(isAllowedFromAddress("other@example.com", managed), false);

const ui = fs.readFileSync(
  path.join(root, "src/components/testflighthub/InfoEmailWorkspace.tsx"),
  "utf8",
);
assert.match(ui, /Managed addresses/, "Email UI must show managed addresses");
assert.match(ui, /Received by/, "Email UI must show received-by label");
assert.match(ui, /composeFromAddress/, "Email UI must support compose From selector");

console.log("ok  email managed-addresses checks passed\n");
