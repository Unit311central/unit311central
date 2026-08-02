/**
 * Seed representative first-party marketing events for Website Analytics visuals.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    const weak = !value || value.includes("SENSITIVE");
    if (!weak && !process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.deploy.pull"));

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;
if (!token || !projectRef) {
  console.error("Missing management credentials");
  process.exit(1);
}

const now = Date.now();
const rows = [];

function push(eventType, path, label, meta, daysAgo = 0) {
  const id = `wme_seed_${rows.length}_${Math.random().toString(36).slice(2, 8)}`;
  const occurred = new Date(now - daysAgo * 86400000 - rows.length * 60000).toISOString();
  rows.push({
    id,
    event_type: eventType,
    path,
    label,
    meta,
    occurred_at: occurred,
  });
}

const plan = [
  { source: "Organic Search", country: "GB", device: "Desktop", n: 18, path: "/" },
  { source: "Organic Search", country: "US", device: "Mobile", n: 10, path: "/industries" },
  { source: "Direct", country: "ES", device: "Desktop", n: 14, path: "/" },
  { source: "Direct", country: "ES", device: "Mobile", n: 6, path: "/contact" },
  { source: "Referral", country: "DE", device: "Desktop", n: 8, path: "/book" },
  { source: "LinkedIn", country: "GB", device: "Desktop", n: 12, path: "/" },
  { source: "LinkedIn", country: "AE", device: "Mobile", n: 5, path: "/book" },
  { source: "Other", country: "FR", device: "Desktop", n: 4, path: "/about" },
];

let visitor = 0;
for (const item of plan) {
  for (let i = 0; i < item.n; i += 1) {
    visitor += 1;
    const visitorId = `seed_vis_${visitor}`;
    const sessionId = `seed_sess_${visitor}`;
    push(
      "page_view",
      item.path,
      null,
      {
        visitorId,
        sessionId,
        device: item.device,
        trafficSource: item.source,
        country: item.country,
      },
      i % 12,
    );
  }
}

const ctas = [
  { label: "Book a Free Intro & Demo Session", path: "/", n: 9 },
  { label: "/contact", path: "/industries", n: 6 },
  { label: "Get started", path: "/", n: 4 },
  { label: "/book", path: "/contact", n: 7 },
];

for (const cta of ctas) {
  for (let i = 0; i < cta.n; i += 1) {
    visitor += 1;
    push(
      "cta_click",
      cta.path,
      cta.label,
      {
        visitorId: `seed_vis_${visitor}`,
        sessionId: `seed_sess_${visitor}`,
        device: i % 2 === 0 ? "Desktop" : "Mobile",
        trafficSource: "LinkedIn",
        country: "GB",
      },
      i % 8,
    );
  }
}

const values = rows
  .map((row) => {
    const meta = JSON.stringify(row.meta).replace(/'/g, "''");
    const label = row.label == null ? "null" : `'${String(row.label).replace(/'/g, "''")}'`;
    return `('${row.id}', '${row.event_type}', '${row.path}', ${label}, '${meta}'::jsonb, '${row.occurred_at}'::timestamptz)`;
  })
  .join(",\n");

const sql = `
insert into public.website_marketing_events (id, event_type, path, label, meta, occurred_at)
values
${values};
`;

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);
const text = await response.text();
console.log(response.status, text.slice(0, 500));
console.log("seeded", rows.length, "events");
if (!response.ok) process.exit(1);
