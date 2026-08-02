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
    const weak =
      !value ||
      value === "[SENSITIVE]" ||
      value.includes("SENSITIVE");
    if (weak) continue;
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.deploy.pull"));
loadEnv(resolve(process.cwd(), ".env.vercel.production"));

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;
if (!token || !projectRef) {
  console.error("Missing management API credentials");
  process.exit(1);
}

async function query(sql) {
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
  if (!response.ok) {
    throw new Error(`${response.status} ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

const evidence = await query(`
select
  count(*)::int as total_events,
  count(*) filter (where event_type = 'page_view')::int as page_views,
  count(distinct meta->>'visitorId') filter (where meta ? 'visitorId')::int as visitors,
  count(distinct meta->>'sessionId') filter (where meta ? 'sessionId')::int as sessions,
  count(*) filter (where event_type = 'cta_click')::int as cta_clicks,
  count(*) filter (where event_type = 'contact_submit')::int as contact_submissions,
  count(*) filter (where event_type = 'demo_request')::int as demo_requests
from public.website_marketing_events
where occurred_at >= now() - interval '30 days';
`);

const dims = await query(`
select
  coalesce(meta->>'country', 'Unknown') as country,
  coalesce(meta->>'device', 'Unknown') as device,
  coalesce(meta->>'browser', 'Unknown') as browser,
  path,
  count(*)::int as views
from public.website_marketing_events
where event_type = 'page_view'
  and occurred_at >= now() - interval '30 days'
group by 1,2,3,4
order by views desc
limit 30;
`);

const snapshots = await query(`
select id, fetched_at, error, num_of_days,
  jsonb_typeof(payload) as payload_type,
  case when jsonb_typeof(payload) = 'array' then jsonb_array_length(payload) else 0 end as payload_len
from public.website_clarity_snapshots
order by fetched_at desc
limit 5;
`);

console.log(
  JSON.stringify(
    {
      clarityApiTokenConfigured: Boolean(process.env.CLARITY_API_TOKEN),
      evidence,
      dimensionRows: dims,
      snapshots,
    },
    null,
    2,
  ),
);
