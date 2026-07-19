# Internal Operations Workspace — Information Architecture

| Field | Value |
| --- | --- |
| **Status** | **SUPERSEDED** |
| **Superseded by** | [INTERNAL_NAVIGATION_BLUEPRINT.md](./INTERNAL_NAVIGATION_BLUEPRINT.md) (**APPROVED**) |

This draft classification exercise proposed an alternate navigation tree. The **product owner has defined the authoritative navigation**. Do not use this document for structure decisions.

Retain only for historical Category A/B/C discussion if useful; navigation must follow the Navigation Blueprint.


---

## Governing direction

**Immediate objective:** Perfect the **Unit311 Internal Operations Workspace**.

- `internal.unit311central.com` is the reference implementation for how Unit311 runs its own business.
- Future customer workspaces will **not** receive every internal module.
- Do **not** make every module tenant-safe or customer-facing at this stage.
- Once this internal IA is approved, decide which modules become customer workspace capabilities.

This document classifies every existing internal module and proposes an **internal-only** navigation structure.

---

## Category definitions

| Category | Meaning |
| --- | --- |
| **A – Internal Operations Only** | Only Unit311 staff will ever use. Never shipped to customer workspaces as a product module. |
| **B – Shared Platform Modules** | Used internally today; **may** later exist in customer workspaces. Document internal-only vs future-customer capabilities. |
| **C – Customer Workspace Modules** | Intended primarily for customer workspaces. Keep separate from the internal operating model; do not let them dominate internal nav. |

---

## Classification of every current module

Disposition: **Remain** · **Move** · **Merge** · **Split** · **Remove** (from internal nav; may keep URL for later).

### Top / Command

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Home | `home` | A | Remain | Internal ops home |
| Executive Assistant | `executive-assistant` | A | Remain | Unit311 AI ops — not a customer EA product yet |

### Clients & commercial

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Clients Dashboard | `clients-dashboard` | B | Remain | Internal view of Clients (PRM-001). Customers may later have their own “accounts” — different product. |
| Client Directory | `clients` | B | Remain | Master Client record for Unit311 (PRM-001) |
| Client Onboarding | `client-onboarding` | A | Remain (clarify) | Unit311 onboarding **its** customers — internal ops process. Not the same as a customer’s onboarding of their clients. |
| CRM Pipeline | `crm` | B | Remain | Shared sales pattern; Unit311’s pipeline today. Future customer CRM would be a subset. |
| Executive Strategy Session Meetings | `crm-meetings` | A | Remain | Unit311 founder/commercial product delivery — internal commercial ops |
| Potential Clients | `potential-clients` | A | Move | Market sizing / TAM — Discovery/intel, not Client Directory. Move under Strategy or CRM → Discovery |
| Partners | `representatives` | A | Remain + rename | Unit311 channel partners — internal. Rename label already “Partners”; consider id rename later |
| Projects | `projects` | B | Remain | Delivery work for Clients. Customers may get Projects later. |
| Grants | `grants` | A | Remain | Unit311 funding — internal |

**B capability split (Clients / CRM / Projects):**

| Capability | Internal now | Later customer? |
| --- | --- | --- |
| Client master directory (PRM-001) | Yes (Unit311’s customers) | Customers may get “their accounts” — separate product surface |
| Unit311 Client Onboarding checklist | Yes | No (unless white-labeled differently) |
| Sales pipeline | Yes | Possible |
| Founder strategy meetings | Yes | No (Unit311 service) |
| Projects / mobilisations | Yes | Possible |

### Financials

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Financials Overview | `financials` | B | Remain | Shared finance shell |
| General Ledger | `general-ledger` | B | Remain | Tenant GL pattern; Internal books today |
| Accounts Receivable | `accounts-receivable` | B | Remain | Unit311 AR vs Clients |
| Accounts Payable | `accounts-payable` | B | Remain | |
| Expenses | `expenses` | B | Remain | |
| Wise | `wise` | A | Remain | Unit311 payment ops / activation — not a customer module |
| Financial Reports | `financial-reports` | B | Remain | |
| Platform Billing | `billing` (internal) | A | Move | Move to Administration (not Settings “my subscription”) |

**B capability split (Financials):**

| Capability | Internal now | Later customer? |
| --- | --- | --- |
| GL / AP / Expenses / Reports | Yes | Possible (tenant books) |
| AR against Clients | Yes | Possible (their customers) |
| Wise reconcile / payment activation | Yes | No |
| Platform Billing (all customer subscriptions) | Yes | No — customers see tenant Billing only |

### HR & people

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| HR Dashboard | `hr-dashboard` | A | Remain | |
| Employees | `hr` | A | Remain | |
| Recruitment | `hr-recruitment` | A | Remain | Placeholder → build; do not ship to customers |
| Leave | `hr-leave` | A | Remain | Placeholder |
| Performance | `hr-performance` | A | Remain | Placeholder |
| Careers (module key only) | — | A | Merge into Recruitment | Seed key `careers` has no view — fold into HR Recruitment |

### Corporate Information

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Corporate Dashboard | `corporate-dashboard` | A | Remain | Placeholder |
| Company Details | `corporate-company-details` | A | Remain + Merge target | Merge Unit311 Details here when ready |
| Office Locations | `office-locations` | A | Remain | Implemented |
| Bank Accounts | `corporate-bank-accounts` | A | Remain | Placeholder — Company Banking |
| Professional Advisers | `corporate-advisers` | A | Remain | Placeholder |
| Insurance | `corporate-insurance` | A | Remain | Placeholder |
| Software & Licences | `corporate-software` | A | Remain | Implemented |
| Contracts | `corporate-contracts` | A | Remain | Placeholder |
| Unit311 Details | `unit311-details` | A | Move → Merge | Move from Files into Corporate → Company Details |

### Inventory & logistics

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Assets | `assets` | A* | Remain | *Category A for Unit311 fleet/ops content. Inventory **module pattern** is B for future customers — treat as A for internal IA until a customer Inventory PRM exists. |
| Logistics | `logistics` | A | Remain | Unit311 package/shipment ops |
| Fleet (orphan) | `fleet` | A | Remove from IA | URL-only; merge into Assets later or delete |
| Sector / WebODM / Missions (orphans) | `sector`, `webodm`, `recent-missions` | A | Remove | Survey leftovers — hide until productized under Engineering/Testing |

### Productivity

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Internal Files | `files-internal` | A | Remain | Unit311 staff files |
| External Files | `files-external` | B | Merge | Fold into Files with clear Internal vs Shared scopes |
| Client Files Explorer | `files-client` | B | Remain | Browse by Client (PRM-001) |
| Calendar | `calendar` | B | Remain | |
| Email | `info-email` | A | Remain | Unit311 shared mailboxes |
| Messaging | `messaging` | B | Remain | Internal chat now; customer messaging later possible |
| Social | `social` | A | Move | Unit311 marketing → Strategy or Corporate Marketing |
| Support desk | `support` | B | Remain | Unit311 support for Clients; customers may get their own desk later |
| WhatsApp Testing | href | A | Move | Under Platform Engineering / Testing — not Support |

**B capability split (Productivity):**

| Capability | Internal now | Later customer? |
| --- | --- | --- |
| Internal staff file repository | Yes | No |
| Client-linked folders | Yes | Possible |
| Calendar | Yes | Possible |
| Messaging | Yes | Possible |
| Support desk for Unit311 Clients | Yes | Customer support desk = separate later |
| Unit311 mailbox (info@) | Yes | No |

### Training & QMS

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Training Dashboard | `training-dashboard` | A | Remain or Merge | Placeholder — merge into Staff Training if empty |
| Staff Training | `training` | A | Remain | |
| QMS Training | `qms-training` | A | Remain | |
| Quality Management | `quality-management` | A | Remain | |

### Strategy

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Board deck | `board-pack` | A | Remain | |
| Strategy | `strategy` | A | Remain | |
| Competitors | `competitors` | A | Remain | |
| Whiteboard | `whiteboard` | A | Remain | |
| Potential Clients | (from CRM) | A | Move here or CRM Discovery | Per above |

### Engineering & platform product

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Engineering | `engineering` | A | Remain | |
| Website Management | `website-management` | A | Remain | |
| Testing | `testing` | A | Remain | |
| Telemetry | `telemetry` | A | Remain | |
| Design mockups / Media example / CRM questions test | orphans | A | Remove | Dev prototypes — hide from nav |

### Administration & access

| Module | View | Cat | Disposition | Notes |
| --- | --- | --- | --- | --- |
| Internal Users | `users` | A | Remain | Platform Administration |
| External Users | `users-external` | C* | Move | *Portal accounts for Clients — Category C concern living in internal admin. Keep in internal nav under Administration, not as a peer “External Client Access” product section. |
| External Client Access Dashboard | `external-client-access` | C | Remove / defer | Placeholder portal builder — do not centre internal ops around it. Park under Admin → “Portal (future)” or remove until ready. |
| Profile | `profile` | A | Remain | Personal |
| General Settings | `settings` | A | Remain | Internal workspace settings (PRM-002 runtime for `unit311`) |
| Billing (Platform) | `billing` | A | Move | To Administration / Finance as Platform Billing |

---

## Category summary counts (nav-relevant)

| Category | Role in internal IA |
| --- | --- |
| **A** | Majority of the tree — perfect these for Unit311 staff |
| **B** | Commercial + finance + delivery + shared productivity — build for Unit311 first; mark future customer surfaces later |
| **C** | Portal builder / external access — minimise in internal nav until explicitly designed |

---

## Recommended internal navigation structure

Goal: intuitive, efficient, complete for **Unit311 staff**. No customer nav. No multi-tenant filtering design.

```
Unit311 Internal Operations
│
├── Home
├── Executive Assistant
│
├── Commercial
│   ├── Clients
│   │   ├── Dashboard
│   │   ├── Directory          ← PRM-001 master
│   │   └── Onboarding         ← Unit311 onboards its Clients
│   ├── CRM
│   │   ├── Pipeline
│   │   └── Strategy Sessions  ← founder meetings
│   ├── Partners
│   ├── Projects
│   └── Grants
│
├── Finance
│   ├── Overview
│   ├── General Ledger
│   ├── Accounts Receivable
│   ├── Accounts Payable
│   ├── Expenses
│   ├── Wise                   ← internal payment ops
│   ├── Reports
│   └── Platform Billing       ← moved from Settings
│
├── Operations
│   ├── Assets
│   ├── Logistics
│   ├── Calendar
│   └── Support
│
├── Workspace
│   ├── Files
│   │   ├── Internal
│   │   └── By Client
│   ├── Email
│   └── Messaging
│
├── Organisation               ← Unit311 the company
│   ├── Corporate Information
│   │   ├── Dashboard
│   │   ├── Company Details    ← includes Unit311 Details (merged)
│   │   ├── Office Locations
│   │   ├── Bank Accounts
│   │   ├── Professional Advisers
│   │   ├── Insurance
│   │   ├── Software & Licences
│   │   └── Contracts
│   ├── People (HR)
│   │   ├── Dashboard
│   │   ├── Employees
│   │   ├── Recruitment
│   │   ├── Leave
│   │   └── Performance
│   └── Quality & Training
│       ├── Quality Management
│       ├── Staff Training
│       └── QMS Training
│
├── Strategy
│   ├── Board Deck
│   ├── Strategy
│   ├── Competitors
│   ├── Market / Potential Clients   ← moved
│   ├── Social                       ← moved (optional under Strategy or Marketing)
│   └── Whiteboard
│
├── Platform                         ← build Unit311 the product
│   ├── Engineering
│   ├── Website Management
│   ├── Testing
│   ├── Telemetry
│   └── WhatsApp Testing
│
└── Administration
    ├── Internal Users
    ├── External Users               ← portal accounts (C, admin’d here)
    ├── Portal Builder (future)      ← deferred placeholder, collapsed
    ├── Profile
    └── General Settings
```

### Structural moves (summary)

| From | To | Why |
| --- | --- | --- |
| Unit311 Details (under Files) | Organisation → Company Details | Corporate identity, not files |
| Platform Billing (Settings) | Finance | Commercial subscriptions console |
| Potential Clients (CRM) | Strategy (or CRM → Discovery) | Market intel ≠ pipeline |
| Social | Strategy / Marketing | Not productivity core |
| WhatsApp Testing | Platform | Engineering test tool |
| External Client Access section | Administration (collapsed) | Don’t dominate internal ops |
| External Files | Files scopes | One Files area |

### Remove / hide from internal nav

| Item | Reason |
| --- | --- |
| Fleet, WebODM, Recent Missions, Sector | Orphan survey views |
| CRM Questions Test, Media Example, Design Mockups | Prototypes |
| Empty Training Dashboard (optional) | Merge into Staff Training until real KPIs exist |
| Dead aliases (`debtors`, `creditors`, `opex`) | Already remapped — clean union later |

---

## Principles for this phase

1. **Internal first** — IA optimises Unit311 staff workflows.  
2. **PRM-001 / PRM-002 still apply** — Client = who we serve; Workspace `unit311` = where Unit311 delivers its own ops.  
3. **Category A is allowed to be deep and incomplete** — placeholders are fine if the nav structure is right.  
4. **Category B is not “make multi-tenant now”** — only mark future customer potential.  
5. **Category C stays out of the way** — portal work is secondary until internal ops IA is approved.  
6. **No implementation** until this IA is approved.

---

## Document control

| Event | Date | Note |
| --- | --- | --- |
| Draft IA | 2026-07-19 | Direction change: internal ops first |
| Approval | — | Awaiting decision |
| Implementation | — | Not started |
