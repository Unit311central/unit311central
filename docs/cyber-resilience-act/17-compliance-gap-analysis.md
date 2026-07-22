# CRA Compliance Gap Analysis

| Field | Value |
|---|---|
| Document ID | CRA-17 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-01 Overview; CRA-02 Roadmap; CRA-14 Risk Assessment; CRA-18 Evidence Register; CRA-19 Action Tracker |

## 1. Purpose

Consolidate Unit311central audit findings into a single CRA-oriented gap analysis. Only controls verified in the audit are treated as present. Target closure aligns with the December 2027 deadline (CRA-02).

## 2. Method

| Step | Description |
|---|---|
| 1 | Inventory observed controls from stack/auth/API/middleware/crypto/DB/storage/CI/logging/DR |
| 2 | Map to CRA themes (secure development, vulnerability handling, transparency, updates, resilience) |
| 3 | Rate gap severity High / Medium / Low |
| 4 | Link treatment to CRA docs and CRA-19 actions |

## 3. Present controls (credit)

| Control | Evidence summary |
|---|---|
| Session cookie hardening | `dc_platform_session` httpOnly, sameSite lax, secure in prod |
| Session integrity | HMAC-SHA256 with `AUTH_SECRET` |
| Password hashing | scrypt |
| Role model | internal/external; Admin via `internal_operators`; workspace auth on many paths |
| Field encryption | AES-256-GCM for software-asset passwords and integration credentials |
| Transport TLS | Via Vercel |
| Cron auth | `CRON_SECRET` bearer |
| Cache control | Middleware `private, no-store` |
| EA data lock | Migrations 101/102 — no open RLS policies; service-role only |
| Private storage buckets | `internal-files`, `assistant-artifacts` + signed URLs |
| Dependency pin | `package-lock.json` |
| Deploy rollback | Vercel Instant Rollback |
| Host isolation routing | apex / internal / demo / slug |

## 4. Gap inventory

| Gap ID | Theme | Finding | Severity | Owner doc | Roadmap phase |
|---|---|---|---|---|---|
| G-01 | Auth | No login MFA | High | CRA-05 | A |
| G-02 | Auth | Deterministic salt `${username}-salt-v1` | High | CRA-05/06 | A |
| G-03 | Auth | Per-route auth only; uneven (competitors open) | High | CRA-05 | A |
| G-04 | Auth | WhatsApp secret optional | High | CRA-05 | A |
| G-05 | Auth | No CSRF tokens | High | CRA-05 | A |
| G-06 | Auth | No application rate limiting | Medium–High | CRA-05 | A |
| G-07 | Headers | No CSP / HSTS / X-Frame in next.config, vercel.json, or middleware | Medium | CRA-13 | A |
| G-08 | Data | Most RLS `using(true)` | High | CRA-05/13 | A/C |
| G-09 | Data | Historically permissive storage policies | Medium–High | CRA-13 | A/C |
| G-10 | Crypto | `AUTH_SECRET` dual-use (HMAC + AES) | Medium | CRA-06 | A/B |
| G-11 | Supply chain | No Dependabot | Medium | CRA-07 | B |
| G-12 | Supply chain | No SBOM tooling | Medium–High | CRA-08 | B |
| G-13 | CI/CD | GitHub Actions only `build-android-apk.yml`; web via Vercel Git ungated | Medium | CRA-03/12 | B |
| G-14 | Vuln Mgmt | No formal vulnerability process / disclosure | High | CRA-09 | C |
| G-15 | IR | No formal incident response; no Sentry | High | CRA-10 | C |
| G-16 | Updates | No formal security update policy | Medium | CRA-11 | C |
| G-17 | DR | No formal RTO/RPO; ad-hoc recovery notes only | High | CRA-15 | C |
| G-18 | BCP | No formal business continuity plan | High | CRA-16 | C |
| G-19 | Logging | console + WorkspaceErrorBoundary only | Medium | CRA-10 | C |

## 5. Coverage matrix (simplified)

| CRA theme | Baseline posture | Primary gaps |
|---|---|---|
| Secure by design / default | Partial | G-03–G-09, G-13 |
| Vulnerability handling | Weak | G-11, G-12, G-14, G-19 |
| Security updates | Informal | G-16, G-11 |
| Transparency (SBOM) | Missing | G-12 |
| Incident & resilience | Weak | G-15, G-17, G-18 |

## 6. Scoring snapshot

| Metric | Value |
|---|---|
| High gaps | 11 (G-01–G-05, G-08, G-14, G-15, G-17, G-18 + dual-count G-12 as Med-High) |
| Medium gaps | Remaining items in §4 |
| Controls credited | 13 rows in §3 |
| Overall readiness | **Early baseline** — not CRA-ready |

Exact numeric CRA scoring schemes are out of scope; this snapshot is for internal prioritization.

## 7. Dependencies between gaps

- Closing G-03 (global auth) before expanding public APIs prevents new High risk.
- G-11/G-12 unlock credible G-14 (vulnerability management).
- G-15 monitoring improves G-17/G-18 response times.
- G-02 salt migration should precede broad MFA enforcement messaging to avoid parallel login regressions.

## 8. Recommendations toward Dec 2027

1. Execute CRA-02 Phase A (auth, headers, CSRF, rate limits) without delay.
2. Enable Dependabot + SBOM + web CI (Phase B).
3. Formalize vuln, IR, update, DR, BCP (Phase C) with evidence in CRA-18.
4. Track every gap ID in CRA-19 until Closed or Risk-accepted per CRA-14 rules.

## 9. Re-assessment trigger

Re-run this gap analysis quarterly and after any Sev-1 incident. Update Version and Last updated fields; retain prior snapshots in CRA-18.
