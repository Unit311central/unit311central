# Authentication and Access Control

| Field | Value |
|---|---|
| Document ID | CRA-05 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-04 Secure Coding; CRA-06 Cryptography; CRA-13 Architecture; CRA-14 Risk Assessment |

## 1. Purpose

Document Unit311’s observed authentication and authorization model, enumerate uneven enforcement findings, and define remediation required for CRA alignment by December 2027.

## 2. Authentication mechanisms (audit-verified)

| Mechanism | Detail |
|---|---|
| Session cookie | `dc_platform_session` |
| Cookie flags | httpOnly; sameSite `lax`; `secure` in production |
| Integrity | HMAC-SHA256 using `AUTH_SECRET` |
| Password hashing | scrypt |
| Password salt | Deterministic `${username}-salt-v1` |
| MFA | **Not implemented** for login |
| Machine / cron auth | Bearer `CRON_SECRET` on cron routes |
| Roles | `internal` / `external` |
| Admin elevation | `internal_operators` |
| Workspace auth | Workspace authorization checks on protected surfaces |

## 3. Access control flow (observed)

```mermaid
sequenceDiagram
  participant U as User Browser
  participant MW as Next.js Middleware
  participant API as API Route Handler
  participant Auth as Session HMAC verify
  participant DB as Supabase

  U->>MW: Request (Host apex/internal/demo/slug)
  MW->>MW: Host routing + cache-control private no-store
  MW->>API: Forward (no global auth gate)
  API->>Auth: Read dc_platform_session
  alt Valid HMAC session
    Auth-->>API: Identity + role claims
    API->>API: Role / workspace authorization
    API->>DB: Query (RLS often using true)
    DB-->>API: Rows
    API-->>U: Response
  else Missing/invalid session
    API-->>U: 401/redirect (when route enforces auth)
  end
  Note over API: Uneven: some routes open (e.g. competitors); WhatsApp secret optional
```

## 4. Authorization model

| Control | Behavior |
|---|---|
| Role gate | Distinguishes internal vs external capabilities |
| Admin | Privileged operations gated by `internal_operators` membership |
| Workspace | Resource access constrained by workspace authorization where implemented |
| Database RLS | Most tables RLS enabled with `using(true)` — not a strong server-side tenant fence |
| EA tables | Migrations 101/102: locked (no open policies); service-role only |

**Implication:** Application-layer checks are the primary authorization boundary for most data. Missing checks on a route are high-impact because RLS does not compensate for many tables.

## 5. Enforcement coverage

| Surface | Observation |
|---|---|
| API handlers (~196) | Per-route auth; **no global auth middleware** |
| Competitors-related routes | Observed open (unauthenticated) |
| WhatsApp support integration | Shared secret optional |
| Cron | Protected by `CRON_SECRET` bearer |
| Middleware | Host routing + `cache-control: private, no-store`; does **not** authenticate |

## 6. Compliance gaps and recommendations

| ID | Gap | Risk | Recommendation (→ Dec 2027) |
|---|---|---|---|
| AUTH-01 | **Compliance gap — no login MFA** | Credential stuffing / phishing impact | Deploy MFA for `internal_operators` and Admin paths first; expand to all internal users |
| AUTH-02 | **Compliance gap — deterministic salt** | Cross-user salt predictability | Migrate to per-user random salt; dual-verify during transition |
| AUTH-03 | **Compliance gap — uneven route auth** | Unauthorized data/function access | Inventory all ~196 handlers; deny-by-default wrapper; close or formally classify public routes |
| AUTH-04 | **Compliance gap — WhatsApp secret optional** | Spoofed inbound webhooks | Require secret in all environments; fail closed |
| AUTH-05 | **Compliance gap — no CSRF tokens** | Cross-site state-changing requests via cookie session | Origin check + CSRF token for POST/PUT/PATCH/DELETE |
| AUTH-06 | **Compliance gap — no app rate limiting** | Brute force / abuse | Rate-limit login and sensitive APIs at Vercel/WAF or application layer |
| AUTH-07 | **Compliance gap — RLS using(true)** | Defense-in-depth failure | Tighten RLS to user/workspace predicates; keep EA locked pattern for sensitive domains |

## 7. Session lifecycle requirements (target)

| Event | Required control |
|---|---|
| Login success | Issue HMAC-signed cookie; regenerate session identifier |
| Logout | Clear cookie; invalidate server-side session record if introduced |
| Privilege change | Re-issue session; revoke old |
| Suspected compromise | Force logout; rotate `AUTH_SECRET` with coordinated redeploy |

## 8. Public route policy

Public routes are allowed only when:

1. Listed in the route inventory (CRA-18 evidence).
2. Free of sensitive tenant data.
3. Protected by rate limiting once AUTH-06 lands.
4. Reviewed quarterly under CRA-09 / CRA-14.

Competitors openness must be confirmed as intentional product behavior or closed under AUTH-03.

## 9. Acceptance criteria for CRA readiness

- MFA enforced for privileged internal access.
- Deterministic salt retired.
- Global deny-by-default auth with audited exceptions.
- CSRF and rate limiting on cookie-authenticated mutating routes.
- WhatsApp (and similar) webhooks fail closed without secret.
- Residual risks documented in CRA-14 and tracked in CRA-19.
