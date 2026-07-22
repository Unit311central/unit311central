# Release Management

| Field | Value |
|---|---|
| Document ID | CRA-12 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-03 SDL; CRA-08 SBOM; CRA-11 Security Update Policy; CRA-15 Disaster Recovery |

## 1. Purpose

Describe how Unit311 builds and releases the web application to production, based on audit evidence, and define CRA-oriented release gates still missing.

## 2. Observed release pipeline

| Stage | Mechanism |
|---|---|
| Source of truth | GitHub `Unit311central/unit311central` |
| Production branch | `main` |
| Web deploy | Vercel Git integration → project `unit311central` |
| CI (GitHub Actions) | `build-android-apk.yml` only — **does not gate web release** |
| Lockfile | `package-lock.json` committed |
| Rollback | Vercel Instant Rollback |
| Ad-hoc recovery notes | `RELEASE_NOTES_RECOVERY_2026-07.md` |

```text
Developer → PR → merge to main → Vercel build/deploy → Production
                                      ↘ Instant Rollback (if needed)
```

## 3. Release types

| Type | Trigger | Extra controls (target) |
|---|---|---|
| Standard | Feature/fix merge to `main` | Checklist below; SBOM artifact |
| Security | CRA-11 emergency/scheduled | Expedited review; post-deploy verify |
| Rollback | Production defect / incident | Instant Rollback; notify IC if Sev-1/2 |
| Mobile APK | Android workflow | Separate from web; do not conflate evidence |

## 4. Pre-merge expectations (current vs target)

| Check | Current | Target |
|---|---|---|
| Peer review | Engineering practice (assumed) | Required for auth/crypto/RLS |
| Lint / typecheck / tests | Not enforced by observed web CI | Required GitHub Action on PRs |
| `npm audit` / dependency review | **Compliance gap** | Required for production deps |
| Auth impact note | Informal | Mandatory for API route changes (~196 handlers) |
| SBOM | **Compliance gap** | Generate on release (CRA-08) |

## 5. Production release checklist (target)

- [ ] Change description includes security impact (none / auth / data / deps).
- [ ] New or changed API routes list auth method (session / `CRON_SECRET` / public exception).
- [ ] No secrets in client bundle or logs.
- [ ] Migrations reviewed for RLS (`using(true)` discouraged).
- [ ] Storage policy changes reviewed for `internal-files` / `assistant-artifacts`.
- [ ] `package-lock.json` updated if dependencies changed.
- [ ] SBOM artifact produced and indexed in CRA-18 (**Compliance gap** until tooling exists).
- [ ] Deploy verified on Vercel; Instant Rollback owner identified.

## 6. Environment and configuration

| Concern | Practice |
|---|---|
| Secrets | `AUTH_SECRET`, `INTEGRATION_CREDENTIALS_SECRET`, `CRON_SECRET` in Vercel env — never in git |
| Host routing | Middleware routes apex / internal / demo / slug — validate after host-affecting releases |
| Cache headers | Middleware `private, no-store` — regression-test authenticated pages |
| Security headers | **Compliance gap:** CSP/HSTS/X-Frame not configured — releases must not claim they are present |

## 7. Compliance gaps

| Gap | Recommendation → Dec 2027 |
|---|---|
| **Compliance gap — web CI absent** | Add Actions workflow gating PRs to `main` |
| **Compliance gap — SBOM not in release** | Integrate CRA-08 generation into deploy pipeline |
| **Compliance gap — no formal CAB/security sign-off** | Lightweight security acknowledgement on high-risk PRs |
| **Compliance gap — recovery mostly ad-hoc** | Promote Instant Rollback + recovery notes into tested CRA-15 procedure |

## 8. Hotfix procedure

1. Branch from `main`; minimal diff.
2. Expedited review by Platform Engineering / Security.
3. Merge to `main`; confirm Vercel deploy.
4. Monitor console / boundary errors; prepare Instant Rollback.
5. File CRA-19 follow-ups for any deferred hardening.

## 9. Evidence to retain (CRA-18)

- Git SHA and PR URL
- Vercel deployment ID / URL
- SBOM path (when available)
- Rollback events and `RELEASE_NOTES_RECOVERY_*` references

## 10. Success criteria for CRA readiness

Releases are repeatable, gated by automated checks, accompanied by SBOMs, and reversible via practiced Instant Rollback — with residual risks accepted only through CRA-14.
