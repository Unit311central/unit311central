# Secure Coding Standards

| Field | Value |
|---|---|
| Document ID | CRA-04 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-03 SDL; CRA-05 Authentication; CRA-06 Cryptography; CRA-13 Architecture |

## 1. Purpose

Define coding rules for Unit311 contributors based on the audited stack (Next.js 16.2.9 App Router, React 19.2.4, Supabase JS client, Vercel hosting). Standards reflect observed strengths and forbid patterns that reproduce known gaps.

## 2. Technology constraints

| Area | Standard |
|---|---|
| Runtime | Next.js route handlers and server components; client components only where UI requires |
| Auth session | Cookie `dc_platform_session` — httpOnly, sameSite `lax`, secure in production |
| Session integrity | HMAC-SHA256 with `AUTH_SECRET` |
| Passwords | scrypt; do not introduce weaker algorithms |
| Field encryption | AES-256-GCM only via approved helpers (`AUTH_SECRET` / `INTEGRATION_CREDENTIALS_SECRET`) |
| Cron / machine auth | `Authorization: Bearer <CRON_SECRET>` |
| Dependency installs | Respect `package-lock.json`; no unpinned production installs in CI |

## 3. Authentication and session coding rules

1. Validate session signature and expiry before reading identity claims.
2. Do not store secrets or password hashes in cookies.
3. Do not weaken cookie flags (`httpOnly`, `sameSite`, `secure` in prod).
4. **Compliance gap — MFA:** Login currently has no MFA. New login UX must reserve MFA enrollment hooks; do not ship additional password-only privilege paths without tracking CRA-19.
5. **Compliance gap — password salt:** Current deterministic salt `${username}-salt-v1` must not be copied to new identity stores. New hashing must use per-credential random salt; migrate legacy hashes under CRA-05.

## 4. API route handler rules (~196 handlers)

| Rule | Rationale |
|---|---|
| Explicit auth at handler entry | Audit: per-route auth, not global middleware |
| Document public exceptions | Competitors routes observed open; public must be intentional |
| Require secrets for webhooks | WhatsApp secret currently optional — treat missing secret as **Compliance gap** |
| No trust of client-supplied role | Roles derive from server session / DB (`internal` / `external`, `internal_operators`) |
| Authorize workspace scope | Workspace authorization required before tenant data access |

**Compliance gap — CSRF:** No CSRF tokens observed. State-changing cookie-authenticated routes must adopt a CSRF strategy (double-submit or origin checks) before CRA deadline.

**Compliance gap — rate limiting:** No application rate limiting. Brute-force and abuse-prone endpoints (login, signup, password reset if present, public APIs) require limits at edge or app layer.

## 5. Data access and Supabase

| Practice | Required behavior |
|---|---|
| Migrations | All schema changes via `supabase/migrations` |
| RLS | Do not add new `using(true)` policies without security review |
| Sensitive tables | Prefer EA 101/102 pattern: no open policies; service-role only |
| Client keys | Never expose service-role key to the browser |
| Errors | Do not return stack traces or SQL detail to clients |

## 6. Storage and files

- Use private buckets `internal-files` and `assistant-artifacts`.
- Prefer short-lived signed URLs.
- **Compliance gap:** Storage policies have been historically permissive — new policies must be least-privilege; review existing policies as a tracked action (CRA-19).

## 7. Cryptography (implementation)

- Use AES-256-GCM for encrypting software-asset passwords and integration credentials as already implemented.
- Do not invent custom crypto; do not log plaintext secrets or decrypted credentials.
- TLS is terminated by Vercel; do not disable HTTPS redirects in configuration.

## 8. Logging and error boundaries

| Allowed | Forbidden |
|---|---|
| `console` structured messages without secrets | Logging session cookies, `AUTH_SECRET`, decrypted credentials |
| `WorkspaceErrorBoundary` for UI isolation | Silent catch that swallows auth failures |

**Compliance gap — monitoring:** No Sentry. Prefer adding structured production error reporting rather than increasing ad-hoc `console` volume (CRA-10).

## 9. Frontend / React

- Treat all user input as untrusted; avoid `dangerouslySetInnerHTML` unless sanitized and reviewed.
- Do not persist session tokens in `localStorage`.
- Respect middleware host routing (apex / internal / demo / slug) — do not hardcode host assumptions that bypass intended isolation.

## 10. Security headers (coding implication)

**Compliance gap:** CSP, HSTS, and X-Frame-Options are not configured in `next.config.ts`, `vercel.json`, or middleware. Application code must not assume framing protection or CSP until those controls ship (CRA-13). Avoid introducing inline script patterns that will block a future strict CSP.

## 11. Review checklist (PR)

- [ ] Auth policy stated for each changed API route
- [ ] Role / workspace checks present where data is tenant-scoped
- [ ] No new deterministic salts or weakened cookie flags
- [ ] Secrets encrypted with approved AES-256-GCM helpers
- [ ] RLS/storage policy impact reviewed
- [ ] No secrets in logs
- [ ] CRA-19 updated if closing or opening a compliance gap
