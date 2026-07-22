# Secure Development Lifecycle (SDL)

| Field | Value |
|---|---|
| Document ID | CRA-03 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-04 Secure Coding; CRA-07 Supply Chain; CRA-12 Release Management; CRA-08 SBOM |

## 1. Purpose

Describe the current Unit311 software development practices against CRA expectations for secure-by-design and secure-by-default development, and record gaps requiring remediation before December 2027.

## 2. Observed development topology

| Stage | Current practice (audit) |
|---|---|
| Source control | GitHub `Unit311central/unit311central`, default branch `main` |
| Application stack | Next.js 16.2.9, React 19.2.4 |
| Data changes | SQL migrations under `supabase/migrations` |
| Web delivery | Vercel Git deploy from `main` (project `unit311central`) |
| CI | GitHub Actions workflow `build-android-apk.yml` only |
| Dependency lock | `package-lock.json` present |
| Automated dependency scanning | Not configured (no Dependabot) |
| SBOM generation | Not present |
| Error handling in UI | `WorkspaceErrorBoundary`; logging via `console` |
| Central APM / Sentry | Not present |

## 3. SDL stages — current vs target

| SDL stage | Current state | Target for CRA readiness |
|---|---|---|
| Requirements | Feature-driven; security requirements not formalized | Security requirements checklist per epic (auth, data class, third-party) |
| Design | Host middleware routing (apex/internal/demo/slug); per-route API auth | Threat models for auth, storage, integrations (see CRA-13, CRA-14) |
| Implementation | App Router + ~196 route handlers | Enforce CRA-04 coding standards; deny-by-default auth |
| Verification | Limited automated web CI | PR checks: lint, typecheck, tests, dependency audit |
| Release | Vercel from `main`; Instant Rollback available | CRA-12 release checklist + SBOM (CRA-08) |
| Maintenance | Ad-hoc patches | CRA-09 / CRA-11 vulnerability & update processes |

## 4. Secure-by-default expectations (Unit311-specific)

Given audit findings, the following defaults are required for new work:

1. **Authentication:** New API routes must declare an explicit auth policy (session cookie `dc_platform_session`, cron `CRON_SECRET`, or documented public). Unclassified routes are non-compliant.
2. **Authorization:** Workspace and role checks (`internal` / `external`, Admin via `internal_operators`) must be applied before data access.
3. **Secrets:** Integration credentials must use AES-256-GCM with `INTEGRATION_CREDENTIALS_SECRET`; software-asset passwords with `AUTH_SECRET`. Never commit secrets.
4. **Database:** Prefer least-privilege RLS; avoid new `using(true)` policies. EA-style locked tables (migrations 101/102 pattern) for sensitive domains.
5. **Storage:** Use private buckets and signed URLs; do not broaden storage policies without review.
6. **Headers / abuse controls:** New surfaces must not regress planned CSP/HSTS/X-Frame, CSRF, and rate-limit work (see CRA-05, CRA-13).

## 5. Compliance gaps

| Gap | Evidence | Recommendation (→ Dec 2027) |
|---|---|---|
| **Compliance gap — CI coverage** | Only `build-android-apk.yml`; web relies on Vercel Git | Add GitHub Actions for web: install, lint, test, `npm audit` on PRs to `main` |
| **Compliance gap — dependency automation** | No Dependabot | Enable Dependabot or Renovate against `package-lock.json` (CRA-07) |
| **Compliance gap — SBOM** | No SBOM tooling | Generate CycloneDX/SPDX on release (CRA-08) |
| **Compliance gap — observability** | Console + `WorkspaceErrorBoundary` only | Introduce structured error reporting (e.g., Sentry) for production incidents (CRA-10) |
| **Compliance gap — formal SDL gates** | No documented security gate on merge | Require security checklist on PRs touching auth, crypto, storage, or RLS |

## 6. Roles

| Role | Responsibility |
|---|---|
| Platform Engineering | Implement SDL tooling, CI, coding standards |
| Security (designated owner) | Review auth/crypto/RLS changes; maintain this pack |
| Product owners | Accept residual risk via CRA-14 when deferring fixes |

## 7. Definition of done for a secure change

A change is SDL-complete when:

- Auth and authorization behavior is documented in the PR for any new/changed API route.
- Migrations include intentional RLS (not default-open unless explicitly justified).
- Secrets use existing encryption helpers; no plaintext credentials in DB or logs.
- Related CRA docs / CRA-19 actions updated if a gap is closed or a new gap introduced.

## 8. Relationship to release and operations

SDL feeds **CRA-12 Release Management** (what must be true before promoting to `main` / Vercel production) and **CRA-09 / CRA-10 / CRA-11** for post-release security maintenance. Until CI and SBOM gaps close, releases remain only partially assurable for CRA purposes.
