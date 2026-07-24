/**
 * Cleanup Acme / Site Survey test records via authenticated production APIs.
 */
import fs from "node:fs";
import https from "node:https";
import { URL } from "node:url";

const baseUrl = process.argv[2] || "https://unit311.vercel.app";
const creds = JSON.parse(fs.readFileSync(".tmp-qa-creds.json", "utf8"));

function request(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: {
          ...headers,
          ...(body
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            body: data,
            setCookie: res.headers["set-cookie"] || [],
          }),
        );
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

const login = await request(`${baseUrl}/api/auth/login`, {
  method: "POST",
  body: JSON.stringify({ username: creds.username, password: creds.password }),
});
if (login.status !== 200) {
  console.error("Login failed", login.status, login.body.slice(0, 200));
  process.exit(1);
}
const cookie = login.setCookie.map((c) => c.split(";")[0]).join("; ");

const clientsRes = await request(`${baseUrl}/api/clients`, { headers: { Cookie: cookie } });
const clientsJson = JSON.parse(clientsRes.body);
const clients = clientsJson.clients || clientsJson.items || [];
const targetNames = new Set([
  "acme engineering ltd",
  "acme engineering",
  "site survey",
]);
const targets = clients.filter((c) =>
  targetNames.has(String(c.companyName || c.company_name || "").trim().toLowerCase()),
);
console.log(
  "Clients matched:",
  targets.map((c) => `${c.companyName || c.company_name} (${c.id})`),
);

const projectsRes = await request(`${baseUrl}/api/projects`, { headers: { Cookie: cookie } });
let projects = [];
try {
  const pj = JSON.parse(projectsRes.body);
  projects = pj.projects || pj.items || [];
} catch {
  console.log("projects list status", projectsRes.status, projectsRes.body.slice(0, 120));
}
const targetClientIds = new Set(targets.map((c) => c.id));
const projectTargets = projects.filter((p) => {
  const name = String(p.name || "").trim().toLowerCase();
  const clientName = String(p.clientName || p.client_name || "").trim().toLowerCase();
  return (
    name === "site survey" ||
    targetNames.has(clientName) ||
    (p.clientId && targetClientIds.has(p.clientId)) ||
    (p.client_id && targetClientIds.has(p.client_id))
  );
});
console.log(
  "Projects matched:",
  projectTargets.map((p) => `${p.name} / ${p.clientName || p.client_name} (${p.id})`),
);

for (const p of projectTargets) {
  const del = await request(`${baseUrl}/api/projects/${p.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  console.log("DELETE project", p.id, del.status, del.body.slice(0, 120));
}

for (const c of targets) {
  const del = await request(`${baseUrl}/api/clients/${c.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  console.log("DELETE client", c.id, del.status, del.body.slice(0, 200));
}

console.log("CLEANUP VIA API DONE");
