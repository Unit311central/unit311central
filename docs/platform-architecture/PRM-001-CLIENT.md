# Platform Reference Model 001 – Client

| Field | Value |
| --- | --- |
| **ID** | PRM-001 |
| **Title** | Platform Reference Model 001 – Client |
| **Status** | **LOCKED** |
| **Approved** | 2026-07-19 |
| **Canonical business object** | Client |
| **Owning module** | Client Directory |
| **Canonical store (current)** | `public.internal_clients` |
| **Supersedes** | Informal / fragmented client identity across CRM notes, `client_name` strings, and parallel onboarding rows |

---

## Governing statement

**Client Directory is the canonical business object for Unit311 Central.**

From approval of this document:

- Client Directory is the **reference architecture** for the remainder of the platform review.
- All future module reviews **must conform** to this document and cite **PRM-001** where they touch customers.
- If a later module conflicts with this specification, the conflict must be **identified explicitly** rather than silently accepted.
- **Do not implement** changes that violate this document.
- Implementation begins only after the **entire** platform architecture is approved, then module by module in priority order.

This PRM is the first approved Platform Reference Model. It incorporates the approved Client Directory Functional Design Review (sections 1–8), with **Section 8 – Business Object Definition** as the binding contract.

---

## 1. Definition

### What a Client is

A **Client** is a first-class business object of Unit311 Central: the **commercial customer** of Unit311 — the party we contract with, bill, provision a customer workspace for, and deliver projects and support to.

After conversion from CRM (or qualifying signup / admin create), **no other entity may redefine who the customer is**.

### Distinctions

| Term | Definition | System of record | Is a Client? |
| --- | --- | --- | --- |
| **Prospect** | A possible future customer identified in market or outreach, not yet a qualified sales object. May appear in CRM early qualification or market-sizing tools (e.g. Potential Clients analytics). No commercial commitment. | CRM / Discovery (not Directory) | **No** |
| **Lead** | A named company + contact in the sales pipeline. Pipeline stage, owner, activity history. Not billable; not provisioned. | CRM (`crm_leads`) | **No** |
| **Opportunity** | A Lead in active commercial pursuit (proposal / negotiation). Still CRM-owned. Same Lead record with commercial stage — not a separate Client. | CRM (Lead at Proposal/Negotiation) | **No** |
| **Client** | Converted commercial customer. Master identity, contacts, lifecycle, commercial profile. Created at Won / convert / admin create / paid signup activation. All delivery and billing hang off this record. | **Client Directory** | **Yes** |
| **Workspace** | Multi-tenant runtime container (slug, modules, users, data isolation) for a Client’s platform access. Not the customer itself. | Workspace module (`workspaces`) | **No** — child of Client |

### Boundary rule

Prospect → Lead → Opportunity live in Discovery/CRM. The first Client Directory row is created at conversion (Won / explicit convert / qualifying signup). From that instant, **Client Directory is authoritative for customer identity**.

---

## 2. Ownership

| Role | Module | Allowed operations on Client master data |
| --- | --- | --- |
| **Owner** | **Client Directory** | Create Client; update master profile, contacts, lifecycle, commercial fields, notes, AI pins; retire/archive |
| Lineage writer (once) | CRM (convert only) | May create the Client row and set `crm_lead_id` at conversion. After convert: **read-only lineage** |
| Activation writer (constrained) | Signup / Payment activation | May create/update Client only for billing profile + lifecycle transitions tied to payment; must not invent parallel identity |
| Link writer (constrained) | Workspace Provisioning | May set customer workspace link and provisioning fields only — never rename or re-key the Client |
| Stage writer (constrained) | Client Onboarding | May advance onboarding stage on the same Client id — does not own profile fields |
| **Consumers only** | Projects, Financials, HR, Files, Calendar, Support, Inventory, Messaging, AI/EA, Reporting, Client Dashboard | Read Client; write only their own child entities keyed by `client_id`; may display derived metrics |

**No module except Client Directory owns client master data.** Constrained writers may touch specifically delegated fields only.

---

## 3. Lifecycle

| Stage | Meaning | Automatic? | User action required? |
| --- | --- | --- | --- |
| Discovery | Market / inbound interest; no CRM Lead yet (or analytics only) | Optional auto-capture from web forms | Yes — qualify into Lead |
| Lead | CRM record created; pursuit begins | Yes if form/API creates Lead | Yes — progress pipeline |
| Proposal | Opportunity: proposal issued / negotiation | No (stage change) | Yes — CRM user sets stage |
| Won | Commercial decision to take the customer | No | Yes — CRM user marks Won (may auto-trigger convert) |
| **Client Created** | Client Directory row exists; CRM lineage linked | Yes on Won promote / signup activation; or manual Add Client | Manual create if not from CRM/signup |
| Workspace Provisioned | Customer workspace created and linked (1:1) | Yes when provisioning succeeds after gates | Yes to approve/start if gated; retry on failure |
| Onboarding | Modules, users, questionnaire, go-live checklist | Stage advances may auto on checklist completion | Yes for human checklist steps and approvals |
| Active | Live customer: billable, workspace live, normal ops | Yes when payment + provision + onboarding complete (policy) | Yes to override; yes for commercial exceptions |
| Dormant | Still a Client but commercially quiet | Optional auto after inactivity policy | Yes to set/clear Dormant |
| Archived | Relationship ended; retained for audit/finance; no new work | No | Yes — explicit archive; never hard-delete if financial history exists |

### Lifecycle ownership

- Pre-Client stages (Discovery → Won) are owned by **CRM**.
- From **Client Created** onward, lifecycle status is owned by **Client Directory**.
- Child modules may **propose** transitions (e.g. payment matched → suggest Active); Directory (or a single orchestration service acting for Directory) **commits** the status change.

---

## 4. Canonical relationships

```
Client
├── Workspace          (1:1)
├── Contacts           (1:N)   — one marked primary
├── Users              (1:N)   — portal/platform logins FK → client_id
├── Projects           (1:N)
├── Financial Accounts (1:N)   — invoices, subscriptions, ledger refs
├── Files              (1:1 root → N documents)
├── Calendar           (1:N)
├── Support            (1:N)
├── Inventory          (1:N)
├── Messaging          (1:N)
├── AI Context         (1:1)
└── Audit History      (1:N)
```

| Parent | Child | Cardinality | Rule |
| --- | --- | --- | --- |
| Client | Workspace | 1 : 1 | One Client ↔ one customer Workspace (target model) |
| Client | Contacts | 1 : N | People at the customer; one primary |
| Client | Users | 1 : N | Each user FK → `client_id` |
| Client | Projects | 1 : N | Project FK → `client_id` |
| Client | Financial Accounts | 1 : N | Financial docs FK → `client_id` |
| Client | Files | 1 : 1 root (1 : N docs) | One root folder; documents beneath |
| Client | Calendar | 1 : N | Events tagged `client_id` / `project_id` |
| Client | Support | 1 : N | Tickets FK → `client_id` |
| Client | Inventory | 1 : N | Assets/jobs optionally tagged `client_id` |
| Client | Messaging | 1 : N | Channels bound to `client_id` / workspace |
| Client | AI Context | 1 : 1 | Pinned facts + generated summary pack |
| Client | Audit History | 1 : N | Append-only events |
| Lead (CRM) | Client | 0..1 : 0..1 | Lineage only after convert; Lead does not own Client |

---

## 5. Source of Truth Matrix

Client Directory may **display** any of these on the Client Record. **Display ≠ ownership.** Derived values are **never** manually editable on the Client form.

| Business concept | Owning module | On Client Directory |
| --- | --- | --- |
| Client legal / trading name | Client Directory | Owns (editable) |
| Industry, tax ID, addresses | Client Directory | Owns (editable) |
| Lifecycle status (from Client Created) | Client Directory | Owns (controlled transitions) |
| Primary contact + contacts | Client Directory | Owns (editable) |
| Commercial profile (contract type, owner, SLA) | Client Directory | Owns (editable) |
| Operator notes / AI pinned facts | Client Directory | Owns (editable) |
| CRM Lead lineage id | CRM (immutable after convert) | Displays / stores FK only |
| Customer Workspace slug & runtime status | Workspace | Displays link + delegated provision fields |
| Project count / project list | Projects | **Derived display** |
| Outstanding balance / invoices / payments | Financials | **Derived display** |
| Subscription plan / renewal / MRR | Financials / Billing | **Derived display** |
| Support tickets / open P1s | Support | **Derived display** |
| Account owner person record | HR (internal staff) | Owner assignment refs HR |
| Documents / folder tree | Files | **Derived display** + root link |
| Calendar events | Calendar | **Derived display** |
| Inventory / assets on client jobs | Inventory | **Derived display** |
| Messaging threads | Messaging | **Derived display** |
| Portal users & auth | Users / Auth | **Derived display**; users FK Client |
| Onboarding checklist progress | Client Onboarding (delegated) | Stage on Client; checklist detail in Onboarding |
| Health score / at-risk | Shared rules (Directory + Dashboard + EA) | **Derived display** |
| Audit trail | Platform audit | **Derived display** |

---

## 6. Architectural principles

| # | Principle | Rule |
| --- | --- | --- |
| 1 | **One Client** | A commercial customer has exactly one Client master record in Unit311 Central. |
| 2 | **One Workspace** | A Client has exactly one customer Workspace. Unit311’s internal workspace is not a Client workspace. |
| 3 | **One Master Record** | Client Directory is the only owner of client master data. No parallel “customer” tables for identity. |
| 4 | **Everything references the Client** | Child entities store `client_id` (hard FK). No free-text `client_name` as source of truth. |
| 5 | **No duplicated business data** | Modules must not copy name, contacts, tax ID, or status into their own writable fields. |
| 6 | **Calculated values are never manually editable** | Project counts, AR, ticket counts, MRR, health — display only; owned by source modules. |
| 7 | **Every module consumes the Client record** | Dashboard, Projects, Finance, Support, EA, Reporting all resolve the customer via Client. |
| 8 | **CRM stops at conversion** | After Client Created, CRM is lineage and history — not a second master. |
| 9 | **Constrained writers are not owners** | Provisioning, Onboarding, and Payment activation may update delegated fields only under Directory policy. |
| 10 | **Archive, don’t invent a second identity** | Churned customers are Archived Clients — not deleted and not recreated for the same legal entity without explicit merge policy. |

---

## 7. Requirements for future module reviews

Every subsequent Functional Design Review must answer:

1. How does this module **reference** Client (`client_id`)?
2. What does this module **own**?
3. What does it only **derive** for display?
4. Does any proposal create a **second customer identity** or an **editable copy** of Client master data?

Any “yes” to (4), or any conflict with sections 1–6 above, must be logged as an **explicit PRM-001 conflict** in that module’s review — not accepted silently.

---

## 8. Approved FDR context (non-binding for implementation order)

The following were reviewed and approved as the Client Directory Functional Design Review that produced this PRM. They guide future design but **do not authorise implementation** until the full platform architecture is approved:

- Current implementation inventory (`internal_clients`, `/api/clients*`, `ClientManagementWorkspace`)
- Gaps (dual CRM link, four status fields, soft FKs, flat UI)
- Target operating model and information architecture (list + Client Record sections)
- Field-level data ownership and Lead → Client → Workspace → Projects → Financials → Support → Ongoing workflow
- Quick / medium / structural recommendations (deferred until implementation phase)

Interactive review artifact (design session): Cursor canvas `client-directory-fdr.canvas.tsx` — **LOCKED** as PRM-001 companion.

---

## Document control

| Event | Date | Note |
| --- | --- | --- |
| FDR approved; PRM-001 locked | 2026-07-19 | First Platform Reference Model |
| Implementation | — | **Not started** — await full platform architecture approval |
