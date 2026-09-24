import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function sharpLoadedInCache(): boolean {
  return Object.keys(require.cache).some((key) => /node_modules[/\\]sharp[/\\]/.test(key));
}

function resvgLoadedInCache(): boolean {
  return Object.keys(require.cache).some((key) => /node_modules[/\\]@resvg[/\\]/.test(key));
}

async function main() {
  assert.equal(sharpLoadedInCache(), false);
  assert.equal(resvgLoadedInCache(), false);

  await import("@/lib/accounting/sales-quotes-list-load");
  assert.equal(sharpLoadedInCache(), false, "list-load must not load sharp");
  assert.equal(resvgLoadedInCache(), false, "list-load must not load resvg");

  await import("@/lib/accounting/sales-quote-seller-profile");
  assert.equal(sharpLoadedInCache(), false, "seller-profile must not load sharp");
  assert.equal(resvgLoadedInCache(), false, "seller-profile must not load resvg");

  console.log("ok  sales-quotes-list-compose-no-sharp");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
