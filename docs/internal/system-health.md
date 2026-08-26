# System Health (internal operations)

## What this does

System Health gives Unit311 operators a simple view of production readiness on **internal.unit311central.com → Analytics → System Health**. It complements GitHub Actions, which independently probes the public health endpoint every five minutes.

## Public endpoint: `GET /api/health`

Checks **critical** components only:

1. Application runtime (handler is responding).
2. Supabase API reachability (configured URL responds).
3. Database connectivity (lightweight `select 1`, or REST read against `workspaces` limit 1).

Response is intentionally minimal:

- Healthy: HTTP **200** — `{ "status": "ok" }`
- Critical failure: HTTP **503** — `{ "status": "unavailable" }`

No credentials, customer data, stack traces, or SQL errors are exposed.

Production URL monitored by GitHub Actions:

`https://client.unit311central.com/api/health`

## Critical vs non-critical

| Critical | Non-critical |
|----------|----------------|
| Application | OpenAI / Executive Assistant AI |
| Database (PostgreSQL) | Storage (reported on internal page) |
| Supabase API | GitHub Actions status (external probe metadata) |

If OpenAI is down, `/api/health` still returns **200** when database and Supabase are healthy.

## Internal dashboard

Path: **Analytics → System Health** (internal host only, internal operators).

Shows component status, external monitoring metadata, and recent incidents recorded when internal checks detect state changes.

## GitHub Actions monitor

Workflow: `.github/workflows/unit311-health-check.yml`

- Schedule: every **5 minutes**
- Manual run: **workflow_dispatch**
- Target: `https://client.unit311central.com/api/health`
- Expects HTTP **200** and JSON `status: "ok"`
- Read-only — does not modify Unit311, Supabase, or customer data

## GitHub failure notifications

When the workflow fails, GitHub marks the run failed. GitHub delivers notifications according to the **GitHub account notification settings** for the repository (typically email to the account owner, e.g. paul@unit311central.com).

Do not put notification email addresses in application source code. Configure notifications in GitHub: **Settings → Notifications** and repository watch settings.

Unit311 does **not** send alert email from Vercel when production is down.

## Manual workflow run

GitHub → **Actions** → **Unit311 production health check** → **Run workflow**.

## Investigating an alert

1. Open **internal.unit311central.com → Analytics → System Health** and refresh.
2. Check which critical component failed (Application, Database, Supabase).
3. If the dashboard is unreachable, check **Vercel** deployment status and logs.
4. If database/Supabase failed, check **Supabase** project status and connection limits.
5. Review GitHub Actions run logs for the health-check workflow (HTTP status and response body).

## If Vercel is down

- GitHub Actions health check fails (cannot reach endpoint).
- Internal dashboard may be unreachable.
- Use Vercel dashboard and GitHub deployment history; restore service on Vercel.

## If Supabase is down

- `/api/health` returns **503**.
- Internal System Health shows Database and/or Supabase failed.
- Use Supabase dashboard; core app functions depending on DB will fail for all customers.

## If OpenAI is down

- `/api/health` remains **200** if critical services are OK.
- Internal page may show OpenAI as **Degraded**.
- Executive Assistant AI features may fail; core Unit311 modules continue.
