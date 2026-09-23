import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function sharpLoadedInCache(): boolean {
  return Object.keys(require.cache).some((key) => /node_modules[/\\]sharp[/\\]/.test(key));
}

async function main() {
  assert.equal(sharpLoadedInCache(), false, "sharp must not be loaded before import");

  await import("@/lib/accounting/sales-quotes-core");

  assert.equal(
    sharpLoadedInCache(),
    false,
    "importing sales-quotes-core must not load sharp",
  );

  console.log("ok  sales-quotes-core-no-sharp");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
