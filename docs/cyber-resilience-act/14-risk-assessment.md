# Security Risk Assessment

| Field | Value |
|---|---|
| Document ID | CRA-14 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-13 Architecture; CRA-05 Authentication; CRA-17 Gap Analysis; CRA-19 Action Tracker |

## 1. Purpose

Provide an initial risk assessment for Unit311central grounded exclusively in audit-verified findings. Likelihood and impact ratings are qualitative (High / Medium / Low) for prioritization toward the December 2027 CRA deadline.

## 2. Assessment context

| Factor | Value |
|---|---|
| System | Unit311 web platform (Next.js 16.2.9 / React 19.2.4) |
| Hosting | Vercel `unit311central` |
| Data store | Supabase (Postgres + storage) |
| Auth model | Cookie session HMAC; roles internal/external; Admin via `internal_operators` |
| Primary concern | Unauthorized access, credential abuse, supply-chain compromise, weak recovery formality |

## 3. Risk register (baseline)

| ID | Risk | Cause (audit) | Impact | Likelihood | Rating | Treatment |
|---|---|---|---|---|---|---|
| R-01 | Unauthorized API access | Per-route auth; open competitors routes; no global deny-by-default | High | Medium | **High** | Mitigate — CRA-05 AUTH-03 |
| R-02 | Account takeover | No MFA; deterministic salt `${username}-salt-v1`; no rate limiting | High | Medium | **High** | Mitigate — MFA, salt migration, rate limits |
| R-03 | CSRF on state-changing requests | Cookie session + no CSRF tokens | High | Medium | **High** | Mitigate — CSRF/origin checks |
| R-04 | Webhook spoofing | WhatsApp secret optional | Medium–High | Medium | **High** | Mitigate — fail closed |
| R-05 | Tenant data exposure via DB | RLS `using(true)` on most tables | High | Medium | **High** | Mitigate — tighten RLS; keep EA locked pattern |
| R-06 | File/object exposure | Historically permissive storage policies on private buckets | High | Low–Medium | **Medium** | Mitigate — policy hardening |
| R-07 | Session/crypto blast radius | `AUTH_SECRET` used for HMAC and AES field encryption | High | Low | **Medium** | Mitigate — split keys (CRA-06) |
| R-08 | Clickjacking / XSS amplification | No CSP / X-Frame | Medium | Medium | **Medium** | Mitigate — headers (CRA-13) |
| R-09 | Missing HSTS downgrade risk | No HSTS in app config | Medium | Low | **Medium** | Mitigate — enable HSTS |
| R-10 | Vulnerable dependency in prod | No Dependabot; thin CI | High | Medium | **High** | Mitigate — CRA-07/08/12 |
| R-11 | Delayed detection of incidents | No Sentry; console-only | High | Medium | **High** | Mitigate — CRA-10 monitoring |
| R-12 | Prolonged outage / unclear recovery | No formal RTO/RPO/BCP; ad-hoc recovery notes only | High | Low | **Medium** | Mitigate — CRA-15/16 |
| R-13 | Cron abuse | If `CRON_SECRET` leaked | Medium | Low | **Medium** | Control: bearer secret; rotate on leak |
| R-14 | Supply-chain malicious package | npm + auto-deploy from `main` | High | Low | **Medium** | Mitigate — CI gates, rollback, CRA-07 |

## 4. Assets and threat actors (summary)

| Asset | Sensitivity | Relevant risks |
|---|---|---|
| User credentials & sessions | High | R-02, R-03, R-07 |
| Workspace / tenant business data | High | R-01, R-05 |
| Integration credentials (AES-GCM) | High | R-07, R-14 |
| Files in `internal-files` / `assistant-artifacts` | High | R-06 |
| Availability of Vercel deployment | Medium–High | R-12, R-14 |

Threat actors considered: external attackers (internet), opportunistic API abuse, malicious dependency authors, and credential phishing against operators (elevated by lack of MFA).

## 5. Inherent vs residual risk

| Area | Inherent (no app controls) | Current residual (with observed controls) | Target residual (post CRA-02) |
|---|---|---|---|
| AuthN/AuthZ | Critical | High (uneven enforcement) | Low–Medium |
| Crypto in transit | High | Low–Medium (Vercel TLS; no HSTS) | Low |
| Crypto at rest (selected fields) | High | Medium (AES-GCM present; key dual-use) | Low |
| Supply chain | High | High | Medium |
| Detect/respond | High | High | Medium |
| Recover | High | Medium (Instant Rollback helps) | Low–Medium |

## 6. Risk acceptance rules

A risk may be **accepted** only when:

1. Documented in this register with owner and review date.
2. Linked compensating control exists (e.g., Instant Rollback for deploy risk).
3. Tracked in CRA-19 with a CRA deadline-aligned revisit (no open-ended Critical/High without treatment plan past Dec 2027 readiness gate).

**No Critical/High audit findings are accepted in this baseline revision** — all are marked Mitigate.

## 7. Methodology notes

- Evidence-only: controls not observed are treated as absent.
- EA tables 101/102 locked posture **reduces** R-05 for that subdomain only; do not extrapolate to the whole schema.
- Cookie flags (httpOnly, sameSite lax, secure in prod) **reduce** but do not eliminate R-02/R-03.

## 8. Review cadence

| Event | Action |
|---|---|
| Quarterly | Refresh ratings from CRA-19 progress |
| After Sev-1/2 incident | Immediate re-assess related IDs |
| Pre-Dec 2027 gate | Leadership sign-off on residual risks |

## 9. Outputs

Prioritized input to **CRA-17 Compliance Gap Analysis** and sequencing in **CRA-02 Roadmap**. Detailed control design remains in CRA-05, CRA-06, CRA-07, CRA-10, CRA-13, CRA-15, and CRA-16.
