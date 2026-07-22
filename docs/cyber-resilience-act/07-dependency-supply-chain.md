# Dependency and Supply Chain Security

| Field | Value |
|---|---|
| Document ID | CRA-07 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-08 SBOM; CRA-03 SDL; CRA-09 Vulnerability Management; CRA-12 Release Management |

## 1. Purpose

Describe Unit311’s software supply-chain controls as observed in audit, and define the minimum CRA-oriented practices for third-party components through December 2027.

## 2. Supply-chain inventory (baseline)

| Element | Observed state |
|---|---|
| Application frameworks | Next.js 16.2.9, React 19.2.4 |
| Backend client | `@supabase/supabase-js` |
| Lockfile | `package-lock.json` present |
| Primary registry | npm (implied by lockfile / Node toolchain) |
| Source repository | GitHub `Unit311central/unit311central` |
| Default branch / deploy | `main` → Vercel project `unit311central` |
| GitHub Actions | `build-android-apk.yml` only |
| Dependabot / Renovate | **Not configured** |
| SBOM tooling | **Not present** (see CRA-08) |
| Secret scanning / dependency review Actions | **Not observed** |

## 3. What the lockfile provides

`package-lock.json` pins transitive dependency versions for reproducible installs. This is a necessary but insufficient supply-chain control: it does not alert on new CVEs, generate an SBOM, or block known-vulnerable versions at merge time.

## 4. Trust boundaries

| Boundary | Risk if compromised | Current mitigation |
|---|---|---|
| npm packages | Malicious or vulnerable code in runtime | Lockfile pin only |
| GitHub repository | Unauthorized code on `main` | Platform access controls (org/repo permissions — operational) |
| Vercel deploy from `main` | Production runs attacker build | Relies on GitHub → Vercel trust; Instant Rollback for recovery |
| Supabase client / project | Data exfiltration | Service-role isolation; EA tables locked; broader RLS weak |
| CI workflow (Android) | Supply-chain via Actions | Limited to APK build; web not gated by same CI |

## 5. Compliance gaps

| Gap | Impact | Recommendation (→ Dec 2027) |
|---|---|---|
| **Compliance gap — no Dependabot** | Delayed awareness of vulnerable deps | Enable Dependabot (or Renovate) for npm; auto-open PRs against `package-lock.json` |
| **Compliance gap — no SBOM** | Cannot fulfill CRA transparency expectations | Adopt CycloneDX or SPDX generation (CRA-08) |
| **Compliance gap — thin CI** | Vulnerable code can reach `main`/Vercel without automated checks | Add PR workflow: `npm ci`, lint, test, `npm audit --omit=dev` (or better advisory gate) |
| **Compliance gap — no dependency review on PRs** | Transitive risk on each upgrade | Enable GitHub Dependency Review Action for pull requests |
| **Compliance gap — no formal vendor assessment** | Third-party SaaS (Vercel, Supabase, GitHub) trust undocumented | Record processors and security contacts in CRA-18 |

## 6. Allowed dependency change process (target)

1. Prefer minimal version bumps addressing CVEs.
2. Run lockfile update via package manager; commit `package-lock.json`.
3. PR must pass security CI once introduced.
4. High/Critical advisories: treat under CRA-09 SLAs.
5. Attach updated SBOM artifact on release (CRA-08, CRA-12).

## 7. Direct platform dependencies (SaaS)

| Provider | Role | Notes |
|---|---|---|
| Vercel | Hosting, TLS, Instant Rollback | Web deploy authority |
| Supabase | Database, storage, auth-adjacent data plane | Migrations in-repo; RLS posture uneven |
| GitHub | Source and limited Actions | Branch protection recommended evidence |

**Compliance gap:** Formal third-party security review pack not present. Recommendation: collect SOC/ISO references and DPA status into CRA-18 before readiness gate G4 (CRA-02).

## 8. Malicious package / account compromise playbook (outline)

Until full IR (CRA-10) is mature, minimum steps:

1. Freeze deploys on Vercel; use Instant Rollback to last known-good.
2. Rotate `AUTH_SECRET`, `INTEGRATION_CREDENTIALS_SECRET`, `CRON_SECRET`, and DB credentials.
3. Pin/remove compromised package; regenerate lockfile.
4. Audit recent `main` commits and Vercel deployments.
5. Record incident in CRA-10 / evidence in CRA-18.

## 9. Metrics (once tooling lands)

| Metric | Target |
|---|---|
| Open Critical npm advisories in production deps | 0 |
| Median time to Dependabot PR merge (Critical) | ≤ 7 days |
| Releases with SBOM attached | 100% |

## 10. Relationship to other CRA documents

Supply-chain health is a prerequisite for credible **CRA-09 Vulnerability Management** and **CRA-11 Security Update Policy**. Without Dependabot and SBOM, Unit311 cannot systematically prove continuous CRA-relevant maintenance of third-party components.
