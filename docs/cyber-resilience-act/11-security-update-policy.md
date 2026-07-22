# Security Update Policy

| Field | Value |
|---|---|
| Document ID | CRA-11 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-09 Vulnerability Management; CRA-12 Release Management; CRA-07 Supply Chain; CRA-08 SBOM |

## 1. Purpose

State Unit311’s commitments for delivering security updates to the Unit311central product hosted on Vercel. The audit did not find a formal security update policy; this document establishes a draft policy aligned to CRA maintenance expectations toward December 2027.

## 2. Product coverage

| Item | Value |
|---|---|
| Product | Unit311 web platform |
| Delivery | Continuous deploy from GitHub `main` to Vercel `unit311central` |
| Stack under maintenance | Next.js 16.2.9, React 19.2.4, Supabase JS client, first-party API routes |
| Mobile adjunct | Android APK via `build-android-apk.yml` (separate cadence) |

## 3. Update categories

| Category | Description | Typical trigger |
|---|---|---|
| Emergency | Actively exploited or Critical vulnerability | CRA-09 Sev Critical / CRA-10 incident |
| Scheduled security | High/Medium dependency or code fixes | Dependabot (target), advisory review |
| Hardening | Defense-in-depth (headers, CSRF, RLS) | CRA-17 gap closure |
| Feature | Non-security product change | Normal roadmap — must not weaken security |

## 4. Support window (target commitment)

**Compliance gap — no published support window.** Recommendation:

- Unit311 maintains security updates for the **currently deployed production revision** on Vercel and the prior Instant Rollback revision.
- Framework major upgrades (e.g., Next.js major) receive a documented migration window; security fixes on deprecated majors are best-effort only after the migration deadline announced to stakeholders.
- Publish this support statement on an internal/external security page before CRA readiness.

## 5. Cadence

| Cadence | Action |
|---|---|
| Continuous | Hotfix to `main` → Vercel for Emergency class |
| Weekly (target) | Review Dependabot/security PRs once enabled (CRA-07) |
| Monthly | Review open CRA-19 security actions |
| Per release | Produce/attach SBOM (CRA-08) — **Compliance gap until tooling exists** |

## 6. Deployment and rollback

| Control | Observed | Policy |
|---|---|---|
| Deploy path | Vercel Git from `main` | All security updates ship via this path unless emergency hotfix branch merged to `main` |
| Rollback | Vercel Instant Rollback | Use immediately if security fix causes Sev-1/2 regression |
| Recovery notes | `RELEASE_NOTES_RECOVERY_2026-07.md` (ad-hoc) | Reference during rollback; formalize under CRA-15 |

## 7. Prioritization rules

1. Auth bypass, secret exposure, and webhook forgery (e.g., WhatsApp secret optional) outrank cosmetic hardening.
2. Fixes that require user password re-hash (deterministic salt migration) may ship behind dual-verify logic but must not be deferred indefinitely past Dec 2027.
3. Dependency updates that break build must be mitigated (pin + backport) rather than left unpatched without CRA-14 risk acceptance.

## 8. Communication

| Audience | When | Channel |
|---|---|---|
| Internal engineering | All security merges | PR + deploy notification |
| Operators / Admins | MFA rollout, forced logout, secret rotation | Workspace banner / email (as available) |
| Customers | Confirmed data impact | Per CRA-10 communications role |
| Evidence archive | Every Emergency update | CRA-18 (PR, deploy ID, SBOM when available) |

## 9. Compliance gaps

| Gap | Recommendation → Dec 2027 |
|---|---|
| **Compliance gap — unpublished policy** | Approve and publish this policy |
| **Compliance gap — no Dependabot** | Required to sustain scheduled security updates |
| **Compliance gap — no SBOM** | Cannot prove component-level update coverage |
| **Compliance gap — thin web CI** | Security updates may ship without automated regression gates |

## 10. Exceptions

Risk-accepted delays require:

- Entry in CRA-14 Risk Assessment.
- CRA-19 action with due date.
- Compensating control (e.g., disable vulnerable route, Instant Rollback plan).

## 11. Policy review

Review at least annually and after any Sev-1 incident. Owner: Unit311 Platform Engineering / Security.
