/**
 * Production auth smoke test for Engineering Technical Files (Demo / Northstar).
 * Verifies session cookie → workspace context → API 200 for authenticated users.
 */
import http from "node:http";
import https from "node:https";

const DEMO_HOST = process.env.DEMO_PROD_HOST ?? "https://demo.unit311central.com";
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: opts.method || "GET",
        headers: opts.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          }),
        );
      },
    );
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function parseCookies(setCookie) {
  const arr = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return arr.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  const unauth = await request(`${DEMO_HOST}/api/engineering/technical-files`);
  if (unauth.status !== 401) {
    throw new Error(`Expected unauthenticated GET to return 401, got ${unauth.status}: ${unauth.body}`);
  }

  const loginBody = JSON.stringify({ username: USERNAME, password: PASSWORD });
  const login = await request(`${DEMO_HOST}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginBody),
    },
    body: loginBody,
  });
  if (login.status !== 200) {
    throw new Error(`Demo login failed (${login.status}): ${login.body}`);
  }

  const cookie = parseCookies(login.headers["set-cookie"]);
  if (!cookie.includes("unit311_platform_session")) {
    throw new Error("Login did not return platform session cookie.");
  }

  const whoami = await request(`${DEMO_HOST}/api/auth/whoami`, { headers: { Cookie: cookie } });
  if (whoami.status !== 200) {
    throw new Error(`whoami failed (${whoami.status}): ${whoami.body}`);
  }
  const whoamiJson = JSON.parse(whoami.body);
  if (whoamiJson.workspaceSlug !== "demo") {
    throw new Error(`Expected demo workspace slug, got ${whoamiJson.workspaceSlug}`);
  }

  const tf = await request(`${DEMO_HOST}/api/engineering/technical-files`, {
    headers: { Cookie: cookie },
  });
  if (tf.status !== 200) {
    throw new Error(`technical-files failed (${tf.status}): ${tf.body}`);
  }
  const tfJson = JSON.parse(tf.body);
  if (!Array.isArray(tfJson.files)) {
    throw new Error("technical-files response missing files array.");
  }

  const masters = await request(`${DEMO_HOST}/api/engineering/masters`, {
    headers: { Cookie: cookie },
  });
  if (masters.status !== 200) {
    throw new Error(`masters failed (${masters.status}): ${masters.body}`);
  }

  console.log(
    JSON.stringify({
      ok: true,
      host: DEMO_HOST,
      workspaceSlug: whoamiJson.workspaceSlug,
      fileCount: tfJson.files.length,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
