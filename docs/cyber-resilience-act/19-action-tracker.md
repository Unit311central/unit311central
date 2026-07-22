# CRA Action Tracker

| Field | Value |
|---|---|
| Document ID | CRA-19 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-02 Roadmap; CRA-17 Gap Analysis; CRA-18 Evidence Register; CRA-14 Risk Assessment |

## 1. Purpose

Track remediation actions that close CRA-17 gaps for Unit311central. All items originate from the 2026-07 audit baseline. Status values: `Open`, `In progress`, `Blocked`, `Closed`, `Risk accepted`.

## 2. Priority legend

| Priority | Meaning |
|---|---|
| P0 | High risk auth/data exposure — Phase A |
| P1 | Supply chain / assurance enablers — Phase B |
| P2 | Process resilience (IR/DR/BCP/updates) — Phase C |
| P3 | Hardening / key hygiene follow-ons |

## 3. Action backlog

| Action ID | Priority | Gap | Action | Owner | Target | Status | Evidence |
|---|---|---|---|---|---|---|---|
| ACT-001 | P0 | G-03 | Inventory ~196 API routes; classify auth; implement deny-by-default guard | Platform Eng | 2026-11 | Open | EV-030, EV-031 |
| ACT-002 | P0 | G-03 | Close or formally document competitors public routes | Platform Eng | 2026-10 | Open | EV-034 |
| ACT-003 | P0 | G-04 | Require WhatsApp shared secret in all environments (fail closed) | Platform Eng | 2026-09 | Open | EV-035 |
| ACT-004 | P0 | G-01 | Deploy MFA for `internal_operators` / Admin login paths | Platform Eng / Security | 2026-11 | Open | EV-015 |
| ACT-005 | P0 | G-02 | Replace deterministic `${username}-salt-v1` with random per-user salt + migration | Platform Eng | 2026-12 | Open | EV-014 |
| ACT-006 | P0 | G-05 | Implement CSRF (or strict Origin) for cookie-authenticated mutating routes | Platform Eng | 2026-12 | Open | EV-019 |
| ACT-007 | P0 | G-06 | Add rate limiting for login and abuse-prone APIs | Platform Eng | 2026-12 | Open | EV-020 |
| ACT-008 | P0 | G-08 | Tighten RLS away from `using(true)` on tenant tables; preserve EA 101/102 lock | Platform Eng / Data | 2027-03 | Open | EV-044, EV-045 |
| ACT-009 | P0 | G-09 | Audit and least-privilege storage policies for `internal-files` and `assistant-artifacts` | Platform Eng | 2027-01 | Open | EV-047 |
| ACT-010 | P0 | G-07 | Configure CSP (report-only→enforce), HSTS, and frame protections | Platform Eng | 2026-10 | Open | EV-036 |
| ACT-011 | P1 | G-11 | Enable Dependabot (or Renovate) for npm / `package-lock.json` | Platform Eng | 2026-11 | Open | EV-051 |
| ACT-012 | P1 | G-12 | Implement CycloneDX/SPDX SBOM generation on `main` releases | Platform Eng | 2027-02 | Open | EV-052 |
| ACT-013 | P1 | G-13 | Add GitHub Actions web CI: install, lint, test, audit/dependency review | Platform Eng | 2027-01 | Open | EV-050, EV-053 |
| ACT-014 | P3 | G-10 | Split session HMAC key from AES field-encryption key (stop `AUTH_SECRET` dual-use) | Platform Eng | 2027-03 | Open | EV-040, EV-012 |
| ACT-015 | P2 | G-14 | Publish vulnerability intake SLAs and security contact (CRA-09) | Security | 2027-03 | Open | EV-066 |
| ACT-016 | P2 | G-15 | Adopt IR plan; name IC roster; run first tabletop | Security | 2027-04 | Open | EV-063 |
| ACT-017 | P2 | G-19 | Deploy centralized error/security monitoring (e.g., Sentry) | Platform Eng | 2027-04 | Open | EV-054 |
| ACT-018 | P2 | G-16 | Approve and publish Security Update Policy (CRA-11) | Security / Leadership | 2027-03 | Open | EV-065 |
| ACT-019 | P2 | G-17 | Approve RTO/RPO; formalize Instant Rollback + restore runbooks; drill | Platform Eng | 2027-06 | Open | EV-060–EV-062 |
| ACT-020 | P2 | G-18 | Complete BCP contact tree, workaround catalog, and tabletop with CRA-15 | Ops / Security | 2027-07 | Open | EV-064 |
| ACT-021 | P1 | G-12 | Interim: archive `package-lock.json` per release as SBOM surrogate | Platform Eng | 2026-10 | Open | EV-005 |
| ACT-022 | P2 | — | Populate CRA-18 with Vercel deploy IDs for security releases | Platform Eng | Continuous | Open | CRA-12 |
| ACT-023 | P0 | G-01 | Expand MFA from operators to all internal users after ACT-004 | Platform Eng | 2027-02 | Open | EV-015 |
| ACT-024 | P2 | — | Quarterly refresh of CRA-17 gap analysis | Security | Quarterly | Open | CRA-17 |

## 4. Suggested sequencing (near term)

1. ACT-003 (WhatsApp fail closed) — small blast radius, High gap.
2. ACT-001/002 (route inventory + competitors).
3. ACT-010 (security headers).
4. ACT-006/007 (CSRF + rate limits).
5. ACT-005/004 (salt migration then MFA).
6. Parallel Phase B: ACT-011, ACT-013, ACT-012/021.

## 5. Status workflow

```text
Open → In progress → Closed
                 ↘ Blocked (record blocker in notes)
Open → Risk accepted (only with CRA-14 entry + expiry date)
```

Update **Status** and **Evidence** in the same change that merges the fix. Bump this document’s Version when multiple actions change state.

## 6. Definition of Closed

An action is `Closed` only when:

- Production behavior matches the action outcome on Vercel `unit311central`.
- CRA-18 evidence Status is Observed (or Partial with explicit follow-up).
- Related CRA control document section updated if behavior changed.
- Corresponding CRA-17 gap marked mitigated or residual-only.

## 7. Reporting

| Report | Content |
|---|---|
| Monthly | Count Open P0/P1; blockers |
| Quarterly | Gap score movement (CRA-17); risk residual (CRA-14) |
| Pre-Dec 2027 | All P0/P1 Closed or Risk accepted with expiry; P2 exercised |

## 8. Baseline note

All actions are **Open** as of 2026-07-22. This tracker is the operational backlog for CRA readiness; it does not assert that remediation has started.
