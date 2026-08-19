import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./test-server-only-loader.mjs", pathToFileURL("./scripts/"));
