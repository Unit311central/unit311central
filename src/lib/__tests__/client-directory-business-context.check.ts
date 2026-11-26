import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ClientDirectoryBusinessContextSelector } from "@/components/testflighthub/client-directory/ClientDirectoryBusinessContextSelector";
import { filterClientDirectoryDisplayRows } from "@/lib/client-directory-filter";
import {
  CLIENT_DIRECTORY_CONTEXT_OPTIONS,
  clientsListApiPath,
  clientsPlatformCacheKey,
} from "@/lib/client-directory-business-context";
import { createNewClientDraft } from "@/lib/client-management-data";
import {
  clientAllowedInRequestedSalesContext,
  readRequestedSalesBusinessContext,
} from "@/lib/sales-business-context";
import { requestTargetsWolfSentinel } from "@/lib/wolf/wolf-sentinel";

assert.deepEqual(
  CLIENT_DIRECTORY_CONTEXT_OPTIONS.map((o) => o.label),
  ["All Clients", "Unit311Central", "WOLF"],
);
assert.equal(clientsListApiPath("all"), "/api/clients");
assert.equal(clientsListApiPath("wolf"), "/api/clients?businessContext=wolf");
assert.equal(clientsPlatformCacheKey("wolf"), "platform:clients:wolf");

const rows = [
  { ...createNewClientDraft(), id: "a", companyName: "U", clientType: "unit311central" as const },
  { ...createNewClientDraft(), id: "b", companyName: "W", clientType: "wolf" as const },
];
const baseFilters = {
  search: "",
  industry: "all",
  country: "all",
  city: "all",
  status: "all" as const,
  contract: "all",
  clientType: "all" as const,
};
assert.equal(
  filterClientDirectoryDisplayRows(rows, { ...baseFilters, businessContext: "wolf" }).length,
  1,
);

const sentinelHeaders = new Headers({ host: "wolfsentinel.unit311central.com" });
assert.equal(requestTargetsWolfSentinel(sentinelHeaders), true);
assert.equal(
  readRequestedSalesBusinessContext(
    new Request("https://wolfsentinel.unit311central.com/api/clients", { headers: sentinelHeaders }),
  ),
  "wolf",
);
assert.equal(
  clientAllowedInRequestedSalesContext(
    { clientType: "unit311central" },
    "unit311",
    readRequestedSalesBusinessContext(
      new Request("https://wolfsentinel.unit311central.com/api/clients/1", { headers: sentinelHeaders }),
    ),
  ),
  false,
);

const directory = readFileSync(
  "src/components/testflighthub/ClientManagementClientDirectoryView.tsx",
  "utf8",
);
assert.match(directory, /ClientDirectoryBusinessContextSelector/);
assert.match(directory, /WOLF clients only/);
assert.doesNotMatch(directory, /All Clients[\s\S]*Client Type/);

const markup = renderToStaticMarkup(
  createElement(ClientDirectoryBusinessContextSelector, {
    value: "all",
    onChange: () => {},
  }),
);
assert.match(markup, /Business context/);
assert.match(markup, /data-client-directory-context="all"/);

console.log("ok  client-directory-business-context");