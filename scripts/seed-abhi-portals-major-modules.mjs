/**
 * Overwrite ABHI /portals column-2 major modules on a live host.
 * Preserves custom modules (column 3) from the current saved content.
 *
 * Usage:
 *   node --experimental-strip-types scripts/seed-abhi-portals-major-modules.mjs
 *   node --experimental-strip-types scripts/seed-abhi-portals-major-modules.mjs https://abhi.unit311central.com
 */
import {
  DEFAULT_CUSTOM_MODULES,
  DEFAULT_MAJOR_MODULES,
} from "../src/lib/abhi/portals-demo.ts";

const host = (process.argv[2] || "https://abhi.unit311central.com").replace(/\/$/, "");
const username = "admin@abhi.org.uk";
const password = "London1999$";

function cookieJarFromResponse(response, jar) {
  const raw = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const entry of raw) {
    const part = entry.split(";")[0];
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!name) continue;
    if (!value) jar.delete(name);
    else jar.set(name, value);
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function main() {
  const majorModules = DEFAULT_MAJOR_MODULES.map((row) => ({ ...row }));
  const defaultCustom = DEFAULT_CUSTOM_MODULES.map((row) => ({ ...row }));
  const jar = new Map();

  const loginRes = await fetch(`${host}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      username,
      password,
      next: "/portals",
      returnTo: host,
    }),
  });
  cookieJarFromResponse(loginRes, jar);
  const loginJson = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    throw new Error(`Login failed (${loginRes.status}): ${loginJson.error ?? loginRes.statusText}`);
  }

  const getRes = await fetch(`${host}/api/abhi/portals-content`, {
    headers: { Accept: "application/json", Cookie: cookieHeader(jar) },
  });
  cookieJarFromResponse(getRes, jar);
  const current = await getRes.json().catch(() => ({}));
  if (!getRes.ok) {
    throw new Error(`GET portals-content failed (${getRes.status}): ${current.error ?? getRes.statusText}`);
  }

  const customModules =
    Array.isArray(current.content?.customModules) && current.content.customModules.length > 0
      ? current.content.customModules
      : defaultCustom;

  const putRes = await fetch(`${host}/api/abhi/portals-content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({
      content: {
        majorModules,
        customModules,
      },
    }),
  });
  cookieJarFromResponse(putRes, jar);
  const putJson = await putRes.json().catch(() => ({}));
  if (!putRes.ok) {
    throw new Error(`PUT portals-content failed (${putRes.status}): ${putJson.error ?? putRes.statusText}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        host,
        majorModules: putJson.content?.majorModules?.length ?? majorModules.length,
        customModules: customModules.length,
        topLevel: (putJson.content?.majorModules ?? majorModules)
          .filter((row) => !row.indent)
          .map((row) => row.text),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
