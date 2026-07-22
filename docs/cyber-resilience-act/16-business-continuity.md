# Business Continuity

| Field | Value |
|---|---|
| Document ID | CRA-16 |
| Version | 1.0 |
| Status | Draft — evidence-based baseline |
| Owner | Unit311 Platform Engineering / Security |
| Last updated | 2026-07-22 |
| Related documents | CRA-15 Disaster Recovery; CRA-10 Incident Response; CRA-11 Security Update Policy; CRA-14 Risk Assessment |

## 1. Purpose

Define business continuity (BCP) expectations for Unit311 operations that depend on the Unit311central platform. The audit found **no formal BCP** and **no formal RTO/RPO**; recovery today relies on Vercel Instant Rollback and ad-hoc notes (`RELEASE_NOTES_RECOVERY_2026-07.md`). This document establishes a draft BCP shell to be completed before December 2027.

## 2. Business activities in scope

| Activity | Platform dependency | Continuity criticality |
|---|---|---|
| Internal operator workflows | Authenticated internal host / workspace | High |
| External customer workspace access | External role sessions | High |
| API integrations / cron jobs | Route handlers + `CRON_SECRET` | Medium–High |
| File access | `internal-files`, `assistant-artifacts` signed URLs | High |
| Executive Assistant features | Service-role / locked EA tables | Medium–High |
| Marketing / public site | Apex host pages | Medium |
| Android APK distribution | `build-android-apk.yml` | Low–Medium (separate from web BCP) |

## 3. Continuity objectives (draft)

| Objective | Draft target | Status |
|---|---|---|
| Maximum tolerable downtime (workspace) | Align to CRA-15 proposed RTO 4 hours | **Unapproved — Compliance gap** |
| Maximum data loss | Align to CRA-15 proposed RPO | **Unapproved — Compliance gap** |
| Communications to stakeholders | Initial notice within 1 hour of Sev-1 declaration | Process not evidenced |
| Manual workaround catalog | Documented per critical workflow | **Missing — Compliance gap** |

## 4. Continuity strategies

| Strategy | When used | Unit311 lever |
|---|---|---|
| Technical restore | Deploy or data failure | Instant Rollback; Supabase restore (CRA-15) |
| Degrade gracefully | Partial outage | Disable non-critical routes/integrations; keep auth paths healthy |
| Manual workaround | Extended outage | Offline procedures for priority operator tasks (to be written) |
| Alternate communication | App down | Status email/chat tree (to be named) |

## 5. Dependencies and single points of failure

| Dependency | Failure mode | Continuity note |
|---|---|---|
| Vercel | App unavailable | No alternate host documented — **Compliance gap** |
| Supabase | Data/API unavailable | Workspaces non-functional; EA locked tables inaccessible |
| GitHub `main` | Cannot ship fixes | Hotfix path blocked; still may Instant Rollback prior build |
| Auth secrets | Mis-rotation locks users out | Coordinate communications; dual-key transition target (CRA-06) |
| npm supply chain | Bad dependency on deploy | Rollback + lockfile pin (CRA-07) |

## 6. Roles during continuity events

| Role | Continuity duty |
|---|---|
| Incident Commander | Declares BCP mode; severity (CRA-10) |
| Platform Engineering | Executes DR runbooks (CRA-15) |
| Business owner | Prioritizes which workflows must return first |
| Communications | Status updates to internal/external users |
| Security | Secret rotation; auth incident handling |

**Compliance gap:** Named deputies and contact roster not attached. Recommendation: maintain a living contact list in CRA-18.

## 7. Continuity playbooks (to complete)

1. **Vercel platform outage:** Monitor provider status; pause nonessential deploys; communicate ETA; no false claims of multi-cloud failover.
2. **Auth outage / mass logout** (e.g., `AUTH_SECRET` rotation): Publish operator guidance; prioritize `internal_operators` restoration; verify cookie flags remain correct.
3. **Integration failure:** Disable optional WhatsApp ingestion if secret/config unstable; fail closed rather than optional-secret mode (aligns with CRA-05 gap closure).
4. **Data restore in progress:** Read-only mode message; block writes that could diverge from restore point.

## 8. Testing and maintenance

| Activity | Frequency (target) | Evidence |
|---|---|---|
| Tabletop BCP+DR | 2× / year | CRA-18 |
| Instant Rollback drill | Annual minimum | CRA-15 / CRA-18 |
| Contact tree verification | Quarterly | CRA-18 |
| Full BCP document review | Annual + post Sev-1 | This file version bump |

**Compliance gap — no formal BCP tests.** Recommendation: first tabletop in 2026 covering Instant Rollback + secret rotation + communications.

## 9. Relationship to CRA obligations

CRA expects products to handle vulnerabilities and maintain security over the support period; organizational continuity ensures Unit311 can **actually deliver** security updates (CRA-11) and incident handling (CRA-10) during disruption. Absence of BCP is therefore both an operational and compliance readiness issue (CRA-17).

## 10. Compliance gaps summary

| Gap | Recommendation → Dec 2027 |
|---|---|
| **Compliance gap — no formal BCP** | Complete playbooks, owners, contact tree |
| **Compliance gap — no RTO/RPO** | Approve with CRA-15 |
| **Compliance gap — no workaround catalog** | Document top 5 operator workflows offline |
| **Compliance gap — single-cloud hosting undocumented risk** | Explicit risk acceptance or alternate static status page |

## 11. Exit criteria for “BCP established”

- Approved RTO/RPO.
- Named roles and contacts.
- Linked DR runbooks tested.
- Lessons learned filed to CRA-19 after each exercise.
