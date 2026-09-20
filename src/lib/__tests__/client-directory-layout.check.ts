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

console.log("ok  client-directory-layout");
