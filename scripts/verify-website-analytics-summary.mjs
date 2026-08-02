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
    if (!value || value === "[SENSITIVE]") continue;
    if (!process.env[key] || process.env[key] === "[SENSITIVE]") {
      process.env[key] = value;
    }
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.deploy.pull"));
loadEnv(resolve(process.cwd(), ".env.vercel.production"));
loadEnv(resolve(process.cwd(), ".env.unit311central.prod"));
loadEnv(resolve(process.cwd(), ".env.unit311.live"));

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const fromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const eventsRes = await fetch(
  `${url}/rest/v1/website_marketing_events?select=event_type,path,meta,occurred_at&occurred_at=gte.${fromIso}&order=occurred_at.desc&limit=5000`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
const events = await eventsRes.json();
if (!Array.isArray(events)) {
  console.error(events);
  process.exit(1);
}

const visitors = new Set();
const sessions = new Set();
const countries = new Map();
const devices = new Map();
const browsers = new Map();
const pages = new Map();
let pageViews = 0;

for (const row of events) {
  const meta = row.meta || {};
  if (meta.visitorId) visitors.add(meta.visitorId);
  if (meta.sessionId) sessions.add(meta.sessionId);
  if (row.event_type === "page_view") {
    pageViews += 1;
    pages.set(row.path, (pages.get(row.path) || 0) + 1);
    if (meta.country) countries.set(meta.country, (countries.get(meta.country) || 0) + 1);
    if (meta.device) devices.set(meta.device, (devices.get(meta.device) || 0) + 1);
    if (meta.browser) browsers.set(meta.browser, (browsers.get(meta.browser) || 0) + 1);
  }
}

const sortMap = (m) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

console.log(
  JSON.stringify(
    {
      clarityApiTokenConfigured: Boolean(process.env.CLARITY_API_TOKEN),
      clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || null,
      eventRows: events.length,
      evidence: {
        visitors: visitors.size,
        sessions: sessions.size,
        pageViews,
        countries: sortMap(countries),
        devices: sortMap(devices),
        browsers: sortMap(browsers),
        pages: sortMap(pages),
      },
    },
    null,
    2,
  ),
);
