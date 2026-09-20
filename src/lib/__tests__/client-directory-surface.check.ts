import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  isBusinessCentralClientDirectorySurface,
  type ClientDirectorySurfaceVariant,
} from "@/lib/client-directory-surface";

assert.equal(isBusinessCentralClientDirectorySurface("client-directory"), true);
assert.equal(isBusinessCentralClientDirectorySurface("legacy"), false);

const dashboard = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InternalOperationsDashboard.tsx"),
  "utf8",
);
assert.match(
  dashboard,
  /surfaceVariant=\{\s*isBrowserAbhiSurface\(\) \? "legacy" : "client-directory"/,
  "Internal dashboard must gate Client Directory UX by ABHI surface",
);

const wrapper = readFileSync(
  join(process.cwd(), "src/components/testflighthub/ClientManagementWorkspace.tsx"),
  "utf8",
);
assert.match(wrapper, /surfaceVariant = "legacy"/, "default surface must be legacy for safety");

console.log("ok  client-directory-surface");
