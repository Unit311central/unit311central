import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "src/components/testflighthub/ClientManagementClientDirectoryView.tsx"),
  "utf8",
);

assert.match(source, /min-w-0 max-w-full/, "directory view must constrain width in the flex chain");
assert.match(source, /table-fixed/, "directory table must use fixed layout");
assert.match(source, /overflow-x-auto/, "table wrapper must scroll internally when narrow");
assert.match(source, /break-words/, "long directory cells must wrap");
assert.match(source, /ClientDirectoryBusinessContextSelector/, "business context selector must be prominent");

const selector = readFileSync(
  join(process.cwd(), "src/components/testflighthub/client-directory/ClientDirectoryBusinessContextSelector.tsx"),
  "utf8",
);
assert.match(selector, /relative z-20/, "context selector must stack above filters");
assert.match(selector, /min-w-\[12rem\]/, "context selector needs width for long labels");

console.log("ok  client-directory-layout");
