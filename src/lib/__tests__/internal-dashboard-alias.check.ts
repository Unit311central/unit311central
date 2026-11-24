import assert from "node:assert/strict";

import { mapInternalHostDashboardAlias } from "@/lib/app-domains";

assert.equal(
  mapInternalHostDashboardAlias("/dashboard", "?view=operations-dashboard"),
  "/?view=operations-dashboard",
);
assert.equal(
  mapInternalHostDashboardAlias(
    "/dashboard",
    "?view=sales-management&tab=dashboard&salesContext=wolf",
  ),
  "/?view=sales-management&tab=dashboard&salesContext=wolf",
);
assert.equal(
  mapInternalHostDashboardAlias("/dashboard", "?view=productivity-dashboard"),
  "/?view=productivity-dashboard",
);
assert.equal(mapInternalHostDashboardAlias("/dashboard", ""), "/");
assert.equal(
  mapInternalHostDashboardAlias("/dashboard/executive-assistant", ""),
  "/?view=executive-assistant",
);
assert.equal(mapInternalHostDashboardAlias("/", "?view=operations-dashboard"), null);
assert.equal(mapInternalHostDashboardAlias("/internaldashboard", "?view=assets"), null);

console.log("ok  internal dashboard alias");
