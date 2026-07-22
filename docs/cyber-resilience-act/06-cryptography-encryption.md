# Cryptography and Encryption

| Field | Value |
|---|---|
| Document ID | CRA-06 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-05 Authentication; CRA-04 Secure Coding; CRA-13 Architecture; CRA-15 Disaster Recovery |

## 1. Purpose

Record cryptographic controls verified in the Unit311 audit and identify weaknesses that must be remediated for CRA-aligned protection of confidentiality and integrity.

## 2. Cryptographic inventory (observed)

| Use case | Algorithm / mechanism | Key / secret material | Notes |
|---|---|---|---|
| Session integrity | HMAC-SHA256 | `AUTH_SECRET` | Signs `dc_platform_session` cookie |
| Password storage | scrypt | Deterministic salt `${username}-salt-v1` | Hashing present; salt design weak |
| Software-asset passwords at rest | AES-256-GCM | `AUTH_SECRET` | Application-level field encryption |
| Integration credentials at rest | AES-256-GCM | `INTEGRATION_CREDENTIALS_SECRET` | Application-level field encryption |
| Transport | TLS | Vercel-managed certificates | TLS via Vercel edge / hosting |
| Cookie transport flag | `secure` in production | N/A | Reduces cleartext cookie risk on HTTPS |

## 3. Transport security

- Client-to-application traffic relies on **TLS provided by Vercel** for the `unit311central` project.
- **Compliance gap — HSTS:** HSTS is not configured in `next.config.ts`, `vercel.json`, or middleware. Recommendation: enable HSTS (with appropriate `max-age` and preload readiness) before December 2027.
- Middleware sets `cache-control: private, no-store` for relevant responses, reducing shared-cache retention of authenticated content; this complements but does not replace TLS or HSTS.

## 4. Data at rest

### 4.1 Application-encrypted fields

AES-256-GCM is used for:

1. Software-asset passwords (key material: `AUTH_SECRET`).
2. Integration credentials (key material: `INTEGRATION_CREDENTIALS_SECRET`).

Operational rules:

- Decrypt only in server-side code paths that need the plaintext.
- Never log ciphertext with keys, or plaintext secrets.
- Rotate secrets via coordinated environment variable update on Vercel and re-encryption plan where ciphertext is bound to a specific key version (key versioning is a target improvement — see gaps).

### 4.2 Database and storage

| Store | Encryption posture |
|---|---|
| Supabase Postgres | Platform-managed storage encryption (provider responsibility); app RLS mostly `using(true)` — access control ≠ encryption |
| Storage buckets `internal-files`, `assistant-artifacts` | Private buckets; access via signed URLs; historically permissive policies |

**Compliance gap:** Permissive storage policies reduce the value of private buckets. Tighten policies and keep signed URL TTLs short (CRA-13, CRA-19).

## 5. Password and salt handling

| Control | Status |
|---|---|
| scrypt password hashing | Present |
| Per-user random salt | **Absent** — deterministic `${username}-salt-v1` |
| MFA second factor | **Absent** |

**Compliance gap — deterministic salt:** Predictable salts weaken resistance to precomputation for known usernames. Recommendation: generate cryptographically random per-credential salts; store salt with the hash; migrate existing users on next successful login or via batch job; track in CRA-19.

## 6. Key management practices (current vs target)

| Practice | Current | Target (CRA readiness) |
|---|---|---|
| Secret storage | Vercel / environment secrets (assumed operational practice) | Document ownership, access list, rotation cadence |
| `AUTH_SECRET` dual use | Session HMAC + AES for software-asset passwords | Prefer discrete keys per purpose to limit blast radius |
| `INTEGRATION_CREDENTIALS_SECRET` | Dedicated for integration credentials | Retain separation; add key version field |
| Rotation drill | Not formalized | Annual rotation + emergency rotation runbook (CRA-10 / CRA-15) |
| Key in git | Must never occur | Pre-commit / secret scanning (CRA-07) |

## 7. Prohibited practices

- Custom or homemade ciphers.
- AES modes other than GCM without security review (stick to existing AES-256-GCM helpers).
- MD5/SHA1 for password hashing.
- Disabling TLS verification for production integrations.
- Embedding secrets in client bundles or public env vars.

## 8. Compliance gaps summary

| Gap | Recommendation toward Dec 2027 |
|---|---|
| **Compliance gap — no HSTS** | Configure HSTS at middleware or Vercel headers |
| **Compliance gap — deterministic password salt** | Random per-user salt + migration |
| **Compliance gap — AUTH_SECRET dual purpose** | Split session signing key from field-encryption key |
| **Compliance gap — no documented key rotation** | Publish rotation procedure linked from CRA-11 / CRA-15 |
| **Compliance gap — storage policy permissiveness** | Least-privilege storage RLS/policies |

## 9. Verification checklist

- [ ] Confirm production cookie `secure` flag
- [ ] Confirm AES-256-GCM helpers used for new credential fields
- [ ] Confirm no new deterministic salt usage
- [ ] Confirm TLS on all production hostnames (apex/internal/demo/slug)
- [ ] Evidence of secret rotation stored in CRA-18 when performed
