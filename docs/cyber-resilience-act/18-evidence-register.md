# Evidence Register

| Field | Value |
|---|---|
| Document ID | CRA-18 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-01 Overview; CRA-17 Gap Analysis; CRA-19 Action Tracker; All CRA-02–CRA-16 control docs |

## 1. Purpose

Index artifacts that substantiate Unit311 CRA documentation claims. Entries distinguish **Observed in audit (2026-07)** from **To be collected** as gaps close. Do not list evidence that does not exist.

## 2. How to use

| Column | Meaning |
|---|---|
| Evidence ID | Stable handle for citations |
| Claim | What the artifact proves |
| Location / pointer | Path, URL, system, or “TBD” |
| Status | Observed / Partial / Missing |
| Related CRA | Document IDs |

## 3. Platform and stack evidence

| Evidence ID | Claim | Location / pointer | Status | Related CRA |
|---|---|---|---|---|
| EV-001 | Next.js 16.2.9 / React 19.2.4 | `package.json` / lockfile | Observed | CRA-01, CRA-13 |
| EV-002 | Vercel project `unit311central` | Vercel dashboard | Observed | CRA-01, CRA-12 |
| EV-003 | Supabase JS client in use | `@supabase/supabase-js` dependency | Observed | CRA-13 |
| EV-004 | GitHub repo and `main` branch | `Unit311central/unit311central` | Observed | CRA-07, CRA-12 |
| EV-005 | `package-lock.json` present | Repository root | Observed | CRA-07, CRA-08 |

## 4. Authentication and session evidence

| Evidence ID | Claim | Location / pointer | Status | Related CRA |
|---|---|---|---|---|
| EV-010 | Cookie name `dc_platform_session` | Auth/session implementation | Observed | CRA-05 |
| EV-011 | httpOnly, sameSite lax, secure in prod | Cookie set options | Observed | CRA-05, CRA-06 |
| EV-012 | HMAC-SHA256 with `AUTH_SECRET` | Session signing code | Observed | CRA-05, CRA-06 |
| EV-013 | scrypt password hashing | Auth password module | Observed | CRA-05 |
| EV-014 | Deterministic salt `${username}-salt-v1` | Password salt construction | Observed (gap) | CRA-05, CRA-17 |
| EV-015 | No login MFA | Login flow | Observed (gap) | CRA-05 |
| EV-016 | Roles internal/external; `internal_operators` | AuthZ code / DB | Observed | CRA-05 |
| EV-017 | Workspace authorization | Workspace guards | Observed (partial coverage) | CRA-05 |
| EV-018 | `CRON_SECRET` bearer on cron | Cron route handlers | Observed | CRA-05 |
| EV-019 | CSRF tokens | Application | Missing (gap) | CRA-05 |
| EV-020 | App rate limiting | Application / edge config | Missing (gap) | CRA-05 |

## 5. API and middleware evidence

| Evidence ID | Claim | Location / pointer | Status | Related CRA |
|---|---|---|---|---|
| EV-030 | ~196 API route handlers | `src/app/api/**` | Observed | CRA-05, CRA-13 |
| EV-031 | Per-route auth (no global auth middleware) | Middleware vs handlers | Observed (gap) | CRA-05 |
| EV-032 | Host routing apex/internal/demo/slug | Middleware | Observed | CRA-13 |
| EV-033 | cache-control private no-store | Middleware | Observed | CRA-13 |
| EV-034 | Competitors routes open | Specific API routes | Observed (gap) | CRA-05 |
| EV-035 | WhatsApp secret optional | WhatsApp support flow/API | Observed (gap) | CRA-05 |
| EV-036 | CSP/HSTS/X-Frame config | `next.config.ts`, `vercel.json`, middleware | Missing (gap) | CRA-13 |

## 6. Cryptography and data evidence

| Evidence ID | Claim | Location / pointer | Status | Related CRA |
|---|---|---|---|---|
| EV-040 | AES-256-GCM software-asset passwords | Crypto helpers / `AUTH_SECRET` | Observed | CRA-06 |
| EV-041 | AES-256-GCM integration credentials | `INTEGRATION_CREDENTIALS_SECRET` | Observed | CRA-06 |
| EV-042 | TLS via Vercel | Vercel hosting | Observed | CRA-06 |
| EV-043 | Migrations path | `supabase/migrations` | Observed | CRA-13 |
| EV-044 | RLS using(true) majority | Migration/policy SQL | Observed (gap) | CRA-05, CRA-17 |
| EV-045 | EA tables 101/102 locked | Migrations 101/102 | Observed | CRA-13 |
| EV-046 | Private buckets + signed URLs | Storage config / code | Observed | CRA-13 |
| EV-047 | Storage policies historically permissive | Storage policies | Observed (gap) | CRA-13 |

## 7. CI, supply chain, SBOM, logging

| Evidence ID | Claim | Location / pointer | Status | Related CRA |
|---|---|---|---|---|
| EV-050 | GitHub Action `build-android-apk.yml` | `.github/workflows` | Observed | CRA-03, CRA-12 |
| EV-051 | Dependabot config | `.github/dependabot.yml` | Missing (gap) | CRA-07 |
| EV-052 | SBOM artifacts | CI / releases | Missing (gap) | CRA-08 |
| EV-053 | Web security CI on PRs | GitHub Actions | Missing (gap) | CRA-12 |
| EV-054 | Sentry / APM | Application config | Missing (gap) | CRA-10 |
| EV-055 | console + WorkspaceErrorBoundary | Application code | Observed | CRA-10 |

## 8. DR / BCP / process evidence

| Evidence ID | Claim | Location / pointer | Status | Related CRA |
|---|---|---|---|---|
| EV-060 | Vercel Instant Rollback capability | Vercel product feature / ops practice | Observed | CRA-15 |
| EV-061 | Ad-hoc recovery notes | `RELEASE_NOTES_RECOVERY_2026-07.md` | Observed | CRA-15 |
| EV-062 | Formal RTO/RPO approval | Signed decision record | Missing (gap) | CRA-15, CRA-16 |
| EV-063 | IR tabletop records | Exercise notes | Missing (gap) | CRA-10 |
| EV-064 | BCP contact tree | Ops doc | Missing (gap) | CRA-16 |
| EV-065 | Published security update policy | External/internal page | Missing (gap) | CRA-11 |
| EV-066 | Vulnerability disclosure contact | Public security page | Missing (gap) | CRA-09 |

## 9. Evidence handling rules

1. Prefer immutable pointers (git SHA, Vercel deployment ID, dated export).
2. When a gap closes, flip Status from Missing → Observed and link the PR/deploy in CRA-19.
3. Never store live secrets in this register — only secret **names** and rotation **dates**.
4. Quarterly review aligned with CRA-17.

## 10. Baseline statement

As of 2026-07-22, this register confirms a **partial technical control set** with **significant process and assurance evidence missing**. It is suitable as an audit baseline, not as a CRA conformity declaration.
