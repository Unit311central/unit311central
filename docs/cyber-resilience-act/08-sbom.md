# Software Bill of Materials (SBOM)

| Field | Value |
|---|---|
| Document ID | CRA-08 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-07 Supply Chain; CRA-12 Release Management; CRA-11 Security Update Policy; CRA-18 Evidence Register |

## 1. Purpose

Define Unit311’s SBOM requirements under CRA transparency expectations. This document records the **current absence** of SBOM tooling and the target operating model tied to releases from GitHub `main` to Vercel project `unit311central`.

## 2. Current state (audit)

| Item | Status |
|---|---|
| SBOM tooling in repo / CI | **Not present** |
| SBOM artifact per release | **Not produced** |
| Dependency pin file | `package-lock.json` present (input to future SBOM) |
| Known stack components | Next.js 16.2.9, React 19.2.4, `@supabase/supabase-js`, Vercel hosting |

**Compliance gap — no SBOM:** Unit311 cannot currently produce a machine-readable inventory of software components for customers, regulators, or vulnerability correlation. Recommendation: implement SBOM generation before December 2027 and attach artifacts to each production release (CRA-02 Phase B).

## 3. Target SBOM standard

| Attribute | Target choice |
|---|---|
| Format | CycloneDX 1.5+ JSON (primary); SPDX 2.3 optional export |
| Scope | Production npm dependencies and direct application package metadata |
| Generation point | CI on release / deploy of `main`, and on-demand for hotfix tags |
| Storage | Versioned artifact in GitHub Release or dedicated evidence store; index in CRA-18 |
| Naming | `unit311central-sbom-<gitsha>.cdx.json` |

## 4. Minimum SBOM content

Each SBOM SHALL include:

- Component name, version, and package URL (purl) for npm components.
- Hash of the lockfile or resolved dependency set where tooling supports it.
- Tool name/version that generated the SBOM.
- Document timestamp and git commit SHA of `Unit311central/unit311central`.
- Relationship to the deployed Vercel build when available (deployment ID recorded in CRA-18).

## 5. Generation workflow (target)

1. On merge to `main` (or release tag): `npm ci` using `package-lock.json`.
2. Run SBOM generator (e.g., `@cyclonedx/cyclonedx-npm` or equivalent approved tool).
3. Fail the release job if SBOM generation fails (**Compliance gap** until CI exists — today only `build-android-apk.yml` runs in Actions).
4. Upload artifact; record path in CRA-18 Evidence Register.
5. Optionally diff against previous SBOM for unexpected component changes (supply-chain anomaly signal — CRA-07).

## 6. Operational uses

| Use | Description |
|---|---|
| Vulnerability correlation | Map CVE/GHSA to components (CRA-09) |
| Customer / auditor request | Provide SBOM for a named release |
| Update policy proof | Show component versions covered by security updates (CRA-11) |
| Incident scope | Identify affected versions during IR (CRA-10) |

## 7. Exclusions and limitations

- Vercel and Supabase managed service internals are out of application SBOM scope; list them as platform processors in CRA-18 instead.
- Android APK build workflow is separate; if mobile artifacts ship independently, produce a distinct SBOM for that pipeline when applicable.
- Dev-only dependencies may be omitted from the production SBOM if clearly labeled; do not omit packages that ship in the Vercel serverless/edge bundles.

## 8. Roles

| Role | Duty |
|---|---|
| Platform Engineering | Implement generator in CI; fix breakages |
| Release manager | Ensure SBOM attached before production promote (CRA-12) |
| Security owner | Respond to SBOM requests; keep CRA-18 index current |

## 9. Acceptance criteria

- [ ] Automated SBOM on every production deploy from `main`
- [ ] CRA-18 lists SBOM locations for last N releases
- [ ] Vulnerability process (CRA-09) references SBOM lookup steps
- [ ] Gap AUTH/supply-chain items in CRA-17 updated when SBOM goes live

## 10. Interim compensating control

Until SBOM tooling ships, retain and archive `package-lock.json` per release commit as a **manual inventory surrogate**. This is explicitly a compensating control, not CRA-equivalent SBOM, and remains logged as a **Compliance gap** in CRA-17 / CRA-19.
