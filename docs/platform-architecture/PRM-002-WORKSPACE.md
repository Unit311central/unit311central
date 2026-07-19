# Platform Reference Model 002 – Workspace

| Field | Value |
| --- | --- |
| **ID** | PRM-002 |
| **Title** | Platform Reference Model 002 – Workspace |
| **Status** | **LOCKED** |
| **Approved** | 2026-07-19 |
| **Depends on** | [PRM-001 – Client](./PRM-001-CLIENT.md) (**LOCKED** / immutable) |
| **Canonical business object** | Workspace |
| **Owning module** | Workspace Provisioning / Workspace |
| **Canonical store (current)** | `public.workspaces` (+ foundation tables) |
| **Companion FDR** | Cursor canvas `workspace-provisioning-fdr.canvas.tsx` |

---

## Governing statement

**Workspace is the operational environment of a Client — not the commercial customer.**

PRM-001 remains immutable for Client identity and master data. This document defines the Workspace business object, the provisioning lifecycle, the mandatory `ensureWorkspace(client_id)` contract, and **Workspace Identity** (Client Identity vs Workspace Runtime).

This PRM is **LOCKED**. All future module reviews must conform to PRM-001 and PRM-002. Conflicts must be identified explicitly. **Do not implement** changes that violate these documents until the full platform architecture is approved and an implementation phase begins.

---

## Architecture vs current operating policy

These layers must not be collapsed.

### Architecture (immutable under PRM-002)

| Rule | Statement |
| --- | --- |
| A | Every **Workspace** belongs to **exactly one Client**. |
| B | A **Client** is the commercial entity (PRM-001). |
| C | A **Workspace** is the operational / runtime environment (tenancy, host, modules, settings, membership). |
| D | Workspace must never become a second customer identity. |
| E | Commercial master data remains owned by Client Directory (PRM-001). |

**Cardinality (architecture):** `Workspace → Client` is **N : 1** (required). The architecture does **not** forbid a Client from having more than one Workspace in the future.

### Current operating policy (Unit311 Central — this release)

| Policy | Statement |
| --- | --- |
| P1 | Unit311 Central currently provisions **one primary Workspace** per Client. |
| P2 | **Multiple Workspaces per Client are not supported** in the current release. |
| P3 | Under this policy, `ensureWorkspace(client_id)` returns that single primary Workspace. |
| P4 | A later PRM may explicitly introduce additional Workspaces per Client; until then, creating a second Workspace for the same Client is a **policy violation**. |

### Relationship to PRM-001 “One Workspace”

PRM-001’s “One Client · One Workspace” principle is adopted here as **Current Operating Policy (P1–P4)**, not as a forever architectural ceiling. Client ownership rules in PRM-001 are unchanged. If multi-workspace is introduced later, it requires an **explicit PRM** — not a silent change.

---

## 1. Definition

### What a Workspace is

A **Workspace** is the multi-tenant **runtime container** for platform access: identity (`workspace_id`, slug), host routing, enabled modules, settings/branding, membership, provision state, and the `workspace_id` isolation key for operational data.

It is **not** the party Unit311 contracts with or bills. That party is the **Client** (PRM-001).

### Distinctions (unchanged from PRM-001)

| Term | Role |
| --- | --- |
| Client | Commercial customer — Client Directory |
| Workspace | Operational environment belonging to one Client |
| Internal Workspace (`unit311`) | Platform ops tenant — **not** a Client Workspace |

### What belongs to a Workspace

- Runtime identity: `workspace_id`, slug, `workspace_type`, status  
- Host / domain binding (slug host; future custom domain)  
- Configuration: timezone, locale, display defaults  
- Branding for tenant UX chrome  
- Module enablement flags  
- Membership (`workspace_users`) — not Client Contacts  
- Isolation key for operational rows  
- Provision run state, health, audit of provision events  
- Customer onboarding wizard completion (runtime UX flag)

### What never belongs to a Workspace

- Legal / trading name, tax ID, industry → **Client Directory**  
- Contacts → **Client Directory**  
- Commercial lifecycle (Active / Dormant / Archived) → **Client Directory**  
- Contract, SLA, account owner → **Client Directory**  
- AR / invoices / subscriptions as master → **Financials** (`client_id`)  
- Projects as master → **Projects** (`client_id`)  
- Support tickets as master → **Support** (`client_id`)  
- CRM pipeline → **CRM**

### Immutable vs mutable

| Class | Attributes |
| --- | --- |
| Immutable after create | `workspace_id`; `workspace_type`; **owning `client_id`**; `created_at`; Internal `unit311` |
| Mutable with governance | slug (rare); status; modules; settings/branding; onboarding UX flag |
| System-managed | provisioning stage, health, last error, `updated_at`, audit |
| Never Workspace-owned | Client legal name (UI may display Client name; Client remains SoT) |

---

## 2. Core architectural principle — `ensureWorkspace(client_id)`

### Mandatory contract

```
ensureWorkspace(client_id) → Workspace
```

This is a **platform architectural requirement**, not an implementation suggestion.

### Rules

1. **`ensureWorkspace(client_id)` is the only entry point that may create a Workspace.**  
   No signup path, verify path, admin button, RPC, or script may insert a Customer Workspace except by calling this contract (or a thin wrapper that solely invokes it).

2. **If a Workspace already exists for the Client (under current policy: the primary Workspace), return it.**  
   Do not create another.

3. **If provisioning previously failed, resume safely from the last completed stage.**  
   Do not restart destructively unless an explicit rollback/reprovision command is issued.

4. **Never create duplicate Workspaces** for the same provision intent.  
   Under current operating policy: never create a second Workspace for the same Client.

5. **Never leave orphan Workspaces** (Workspace without a valid owning Client).

6. **The operation must be safe to retry** (idempotent at the contract level).

7. **All provisioning stages must be observable and auditable**  
   (stage, timestamps, actor/system, success/failure, error detail).

### Future multi-workspace

If a later PRM introduces multiple Workspaces per Client, the contract may be extended (e.g. `ensureWorkspace(client_id, workspace_key)`). Until that PRM exists, `ensureWorkspace(client_id)` implies the **single primary** Workspace (policy P1–P4).

---

## 3. Provisioning lifecycle

Requires a Client (PRM-001: Client Created / Client Approved). Provisioning is a **constrained writer** on Client link / provisioning fields only.

| Stage | Meaning | Failure / retry |
| --- | --- | --- |
| Client Approved | `client_id` known; Client not Archived | Block |
| Workspace Created | Workspace row + `client_id` link; slug reserved | Rollback / retry; no orphan |
| Schema Ready | Shared-schema tenancy usable | Platform migrate; retry |
| Default Configuration | `workspace_settings` seeded | Idempotent upsert |
| Default Users | Owner membership for primary portal user | Ensure membership |
| Module Provisioning | Module template applied | Retry; never leave zero required modules |
| Financial Seed | Per product policy (tenant CoA/treasury and/or defer); Unit311 AR stays on Internal keyed by `client_id` | Retry or explicit defer |
| Storage | Categories + root folders | Idempotent ensure |
| AI Context | Stub linked to Client (readable in Workspace) | Retry stub |
| Ready | Required stages green; may await payment gate | — |
| Active | Host/login usable per policy | Suspend / reactivate |

**Failure states:** `provisioning` · `failed` · `rolled_back` · `orphan` (forbidden) · `suspended`

---

## 4. Provisioning contract by module

| Module | Automatic | Optional | Deferred | Derived later |
| --- | --- | --- | --- | --- |
| Client Directory | Link + provisioning fields only | — | — | Health |
| Workspace core | Row, settings, modules, audit via `ensureWorkspace` | Custom slug | Custom domain | Health |
| Users / Auth | Owner membership | Invites | Invite email / SSO | User count |
| Modules | Template enablement | Plan subset | Wizard toggles | Usage |
| Financials (Unit311 AR) | First invoice (orchestration) | — | Payment match | Outstanding on Client |
| Financials (tenant GL) | Seed if required | Opening balances | Import | Tenant P&L |
| Files | Categories + roots | Templates | Migration | Storage usage |
| Projects / CRM / Support / Calendar / Inventory / Messaging | Module flag | Samples | Real data | Counts on Client |
| AI | Context stub | Pins | Model bindings | Summaries |
| Branding / Domains | Defaults + slug host | Logo / custom domain | DNS | — |

---

## 5. Source of Truth

| Concept | Owner |
| --- | --- |
| Workspace runtime record | Workspace |
| Workspace → Client link | Required FK; set only via `ensureWorkspace` / constrained provisioner |
| Domains / slug / host | Workspace |
| Branding (portal chrome) | Workspace settings |
| Configuration (tz, locale, display) | Workspace settings |
| Modules enabled | Workspace |
| Storage roots | Files (scoped by workspace; Client Documents derive) |
| Permissions / membership | Workspace + Auth |
| AI Context pack | Client / AI (1:1 Client); Workspace may display |
| Commercial identity / lifecycle | **Client Directory (PRM-001)** |

---

## 6. Relationships

| Relationship | Cardinality (architecture) | Current policy |
| --- | --- | --- |
| Workspace → Client | **N : 1** (required) | Each Customer Workspace has one Client |
| Client → Workspace | **1 : N** (allowed by architecture) | **1 : 1 primary** in this release |
| Workspace → Users | 1 : N | Membership |
| Workspace → Projects / Files / Calendar / Inventory | 1 : N (isolation) | Also `client_id` for commercial parent |
| Workspace ↔ Financials | Split | Tenant GL by `workspace_id`; Unit311 AR by `client_id` on Internal |
| Workspace → Support | 1 : N optional isolation | Tickets prefer `client_id` |
| Internal `unit311` | Platform singleton | Not a Client Workspace |

```
Client (commercial)
 └── Workspace(s)     architecture: 1:N allowed
       └── (current policy: exactly one primary)
             ├── Users
             ├── Modules / Settings / Domains
             ├── Files / Projects / … (runtime)
             └── …
```

---

## 7. Operational rules

| Rule | Definition |
| --- | --- |
| **Idempotency** | **Mandatory.** Only via `ensureWorkspace(client_id)` — see §2. |
| Rollback | Failure before Ready: mark failed; compensate or quarantine; **never** orphan |
| Retry | Resume from last completed stage; upsert/ensure semantics |
| Versioning | Record provision template / platform schema version on Workspace |
| Migration | Platform-wide shared schema; no per-tenant DDL |
| Module enablement | Template at provision; later toggles under plan entitlement |
| Workspace health | Derived: stages ok, modules present, owner exists, Client link present, host resolvable, payment gate if required |

---

## 8. Explicit conflicts with current implementation

These violate the refined PRM-002 rules and/or PRM-001. They are **not** accepted as target architecture.

| ID | Conflict | Rule violated | Evidence |
| --- | --- | --- | --- |
| **W-01** | No `workspaces.client_id` (or equivalent required ownership FK) | Architecture A — every Workspace belongs to exactly one Client | Schema: only `internal_clients.workspace_id` |
| **W-02** | Multiple entry points create Workspaces (`signup` + `verify-email` + raw `provision_workspace` RPC) | `ensureWorkspace` is the only create entry point | `crm-signup-conversion`, `post-email-verification-onboarding`, SQL RPC |
| **W-03** | Provision is not idempotent by `client_id`; duplicate slug only guarded | Never create duplicates; safe retry by Client | `provision_workspace` throws on slug clash; no ensure-by-client |
| **W-04** | Dual call-sites can leave **orphan** Customer Workspaces | Never leave orphans | Signup provision without binding; verify may provision again |
| **W-05** | No durable stage machine / resume-from-last-stage | Resume failed runs safely; stages observable | RPC is all-or-nothing foundation only; TS steps not a single auditable run |
| **W-06** | Provision/signup writers mutate broad Client master fields | PRM-001 constrained writer | `ensurePendingPaymentClientFromLead` / signup conversion |
| **W-07** | Client Directory rows bound to **customer** `workspace_id` | PRM-001 Directory is Internal master; Workspace ≠ customer store | `bindWorkspaceIds` on `internal_clients` |
| **W-08** | `workspaces.name` treated as company identity | Commercial name owned by Client (PRM-001) | `provision_workspace(company_name)` |
| **W-09** | Parallel identities (org slug, workspace slug, `platform_subdomain`) | One commercial master (PRM-001); clear Workspace domain SoT | Org + subdomain services |
| **W-10** | Admin Add Client creates Client with no Workspace path through `ensureWorkspace` | Lifecycle Client → ensure Workspace (policy) | `POST /api/clients` |

---

## 9. Workspace Identity

The purpose of this section is to define exactly what a Workspace **is** and **is not**. This distinction is part of the platform architecture. All future modules must honour it.

### 9.1 Identity

A **Workspace** is an **operational boundary**.

It is **not**:

- the customer  
- the legal entity  
- the commercial account  
- the billing account  

Those belong to the **Client** ([PRM-001 – Client](./PRM-001-CLIENT.md)).

### 9.2 Workspace responsibilities

A Workspace **owns**:

| Responsibility | Notes |
| --- | --- |
| Configuration | Locale, timezone, display defaults, operational settings |
| Module enablement | Which product modules are on for this tenant |
| Branding | Portal chrome (logo, colours) — not legal identity |
| Storage | Tenant file roots / isolation scope |
| Memberships | Who can access this Workspace (`workspace_users`) |
| Permissions | Roles and access within the Workspace |
| Operational settings | Runtime behaviour of the environment |
| AI runtime context | Runtime AI execution scope within the Workspace (Client still owns pinned commercial AI facts per PRM-001) |
| Audit scope | Provision and runtime events for this Workspace |

### 9.3 Client responsibilities

A Client **owns** (PRM-001):

| Responsibility | Notes |
| --- | --- |
| Commercial identity | Who we serve |
| Legal organisation | Legal / trading entity |
| Contracts | Commercial agreements |
| Lifecycle | From Client Created through Active / Dormant / Archived |
| Primary contacts | People at the customer |
| Customer metadata | Industry, tax ID, addresses, commercial profile |

**Workspace must never become the source of truth for these.**

### 9.4 Naming

| Attribute | Rule |
| --- | --- |
| **Workspace Name** | A **display attribute** of the operational environment only |
| Canonical organisation name | **Always** from the **Client** record (PRM-001) |

Workspace Name must **never** become the canonical company name. UI may show Client legal/trading name alongside or instead of Workspace Name for clarity; the Client remains authoritative.

*(Current conflict W-08 — `workspaces.name` / `provision_workspace(company_name)` treated as company identity — violates this section and is not accepted as target architecture.)*

### 9.5 Architectural principle

| Question | Answered by |
| --- | --- |
| **Who are we serving?** | **Client** (PRM-001) |
| **Where are we delivering the service?** | **Workspace** (PRM-002) |

Every module must be able to determine **both independently** (typically via `client_id` and `workspace_id`). Collapsing them into a single ambiguous “tenant” that mixes commercial identity with runtime is out of compliance.

### 9.6 Reference

- Cross-reference: **[PRM-001 – Client](./PRM-001-CLIENT.md)** (LOCKED) — commercial identity and master data.  
- Cross-reference: this document **PRM-002** — operational boundary, provisioning, `ensureWorkspace`.  

**All future platform modules must distinguish between Client Identity and Workspace Runtime.** This distinction is now part of the platform architecture.

---

## 10. Recommendations (implementation backlog only)

Not authorised for implementation yet.

| Tier | Items |
| --- | --- |
| Quick | Route all creates through `ensureWorkspace`; stop silent swallow; surface provision status on Client Record; align docs; stop using Workspace Name as company name |
| Medium | Required `client_id` on Workspace; provision run/stage audit table; CoA seed policy; admin retry UI |
| Structural | Reorder Client → `ensureWorkspace` → Activate; enforce constrained writers; dual-key `client_id` + `workspace_id` on operational entities |

---

## Document control

| Event | Date | Note |
| --- | --- | --- |
| FDR drafted | 2026-07-19 | Initial review |
| Architecture vs policy + `ensureWorkspace` refined | 2026-07-19 | Pending approval |
| Approved and LOCKED | 2026-07-19 | PRM-002 locked |
| Section 9 Workspace Identity added | 2026-07-19 | Client Identity vs Workspace Runtime |
| Implementation | — | Deferred until full platform architecture approved |
