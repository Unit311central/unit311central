/**
 * Demo host navigation base path must stay on /dashboard — not / — so Link prefetch
 * does not hit demo apex middleware that clears dc_platform_session.
 */
import assert from "node:assert/strict";

import {
  getInternalNavHref,
  resolveInternalOperationsBasePath,
} from "@/lib/internal-operations-data";

assert.equal(
  resolveInternalOperationsBasePath("demo.unit311central.com"),
  "/dashboard",
  "Demo host must use /dashboard base path",
);

assert.equal(
  resolveInternalOperationsBasePath("internal.unit311central.com"),
  "/",
  "Internal host keeps / base path",
);

assert.equal(
  getInternalNavHref("grants", resolveInternalOperationsBasePath("demo.unit311central.com")),
  "/dashboard?view=grants",
  "Demo nav links must not target /?view= (session-clearing apex)",
);

console.log("ok  demo-base-path checks passed\n");
