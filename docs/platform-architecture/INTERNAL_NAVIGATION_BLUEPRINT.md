# Internal Operations Navigation Blueprint

| Field | Value |
| --- | --- |
| **Status** | **APPROVED / IMPLEMENTED / FROZEN** (supersedes prior 2026-07 tree) |
| **Host** | `internal.unit311central.com` |
| **Scope** | Navigation architecture — **no further structural sidebar changes** without explicit architecture approval |
| **Not in scope** | Module redesign · customer workspace nav · multi-tenancy redesign |
| **Depends on** | [PRM-001](./PRM-001-CLIENT.md), [PRM-002](./PRM-002-WORKSPACE.md) |
| **Tracker** | [PLATFORM_MODULE_REGISTER.md](./PLATFORM_MODULE_REGISTER.md) |

---

## Governing statement

This document records the **product-owner-approved** navigation for the Unit311 Internal Operations Workspace.

**Navigation is frozen** to the tree in §1.  
All future work is **module-centric** via the Platform Module Register.  
Do not change the sidebar unless a future architecture review explicitly authorises it.

---

## Platform Information Architecture Principles

1. Every top-level section represents a business domain.
2. Dashboards summarise; workspaces perform work.
3. Multiple nav entries may be operational views of **one system** (e.g. Projects).
4. UI consolidation must not collapse capability ownership (APIs/services/tables stay per capability).
5. Provider names must not leak into platform terminology (e.g. Bank, not Wise, in nav).
6. Navigation reflects business capabilities, not implementation details.
7. **Every business capability must have one canonical location within the navigation. Duplicate capabilities across multiple sections should be avoided.**
8. Platform administration (Unit311 Details / Module Go-Live) stays separate from company master data (Corporate Information).
9. Deep links and legacy view ids remain redirected when IA evolves.
10. Structural sidebar changes require architecture approval, then re-freeze.

---

## 1. Target architecture (authoritative)

```
Home
└── Dashboard

Executive Assistant

Business Central
├── Clients
│   ├── Dashboard
│   └── Client Directory
├── CRM
│   ├── Pipeline
│   ├── Discovery & Demo Sessions
│   ├── Client Onboarding
│   └── Potential Clients
├── Partners
├── Projects
│   ├── Dashboard
│   ├── Internal Projects
│   └── External Projects
└── Grants

Financials
├── Overview
├── General Ledger
├── Accounts Receivable
├── Accounts Payable
├── Expenses
├── Bank                         ← UI label; Internal implementation may remain Wise
└── Reports

Human Resources
├── Dashboard
├── Employees
├── Leave
├── Performance
└── Recruitment

Corporate Information
├── Dashboard
├── Corporate Information        ← ONE workspace with tabs (below)
└── Unit311 Details              ← platform admin (separate)
    ├── Overview
    └── Module Go-Live

Assets
├── Assets
├── Inventory Management
└── Logistics

Business Productivity
├── File Explorer
│   ├── Internal Files
│   ├── External Files
│   └── Client Explorer
├── Calendar
├── Email
├── Messaging
├── Social
└── Support Desk

Training
├── Dashboard
├── Staff Training
└── QMS Training

QMS
└── Quality Management System

Engineering
├── Dashboard
└── Engineer / Resource Breakdown

Tools
├── Website Management
├── Testing
├── Telemetry
└── Users

External Client Access
├── Dashboard
└── External Users

Settings
├── Profile
├── General
└── Platform Billing

Workspaces
├── Workspace Overview
└── New Workspace
```

### Corporate Information tabs (single workspace)

| Tab | Module ID | Notes |
| --- | --- | --- |
| Company Details | MOD-081 | Own API/service/table |
| Office Locations | MOD-082 | Own data |
| Bank Accounts | MOD-083 | Own capability (placeholder until built) |
| Professional Advisors | MOD-084 | Own capability (placeholder until built) |
| Software & Licences | MOD-085 | Own API/service/table |
| Contracts | MOD-086 | Own capability (placeholder until built) |

Route: `?view=corporate-information&tab=<tab-key>`  
Legacy leaves (`corporate-company-details`, `office-locations`, etc.) redirect into this workspace.

### Explicit product rules

| Rule | Detail |
| --- | --- |
| Unit311 Details | Under Corporate Information section; **not** inside the tabbed company workspace; **not** under File Explorer |
| Module Go-Live | Under Unit311 Details only |
| Discovery & Demo Sessions | Correct CRM name (not Executive Strategy Sessions) |
| Client Onboarding | Under CRM |
| Projects | **One system**, three operational views (Dashboard / Internal / External) |
| Logistics | Under Assets |
| Bank | Platform terminology; Wise may remain the Internal implementation |
| Financials / HR / Corporate Information | Top-level sections (not nested under Business Central) |

---

## 2. Implementation notes

- View id for Bank remains `wise` (bookmarks / APIs); nav and crumbs show **Bank**.
- Projects behavioural filters are a later enhancement; nav views already exist.
- Insurance is **not** in the production navigation tree.

---

## Related

- [PLATFORM_MODULE_REGISTER.md](./PLATFORM_MODULE_REGISTER.md)
- [PRM-002](./PRM-002-WORKSPACE.md)
