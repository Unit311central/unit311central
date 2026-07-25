# Demo release model

**Rule:** Demo is not a fork and not a second application.

Demo is a **permanent second workspace** on the **same Git commit, same Vercel deployment, same codebase** as Internal. Application changes ship once and appear on both hosts. Business data is isolated by `workspace_id`.

---

## Architecture (one build)

| Layer | Internal | Demo |
| --- | --- | --- |
| Code | `Unit311central/unit311central` `main` | **Same** |
| Deploy | Vercel project `unit311central` | **Same deployment** |
| Host | `internal.unit311central.com` | `demo.unit311central.com` |
| Workspace | slug `unit311` (live ops data) | slug `demo` — **Unit311 Central Demo** |
| UI | Internal Operations | **Same Internal Operations UI** |
| Login | Existing Internal operators | Internal operators **or** `demo@unit311central.com` (Demo Owner) |

Host → surface → workspace is resolved in:

- `src/lib/app-domains.ts` / `src/lib/runtime-surface.ts`
- `src/middleware.ts`
- `src/lib/workspace-context.ts` (host-authoritative)
- `src/lib/workspace-authorization.ts`
  - Internal operators may access Demo (`internal_demo`)
  - Demo-primary users (Demo Owner) cannot auto-access Internal

Optional Demo-only visibility (not a code fork):

```bash
DEMO_VISIBLE_MODULES=clients,crm,file-explorer
DEMO_WORKSPACE_SLUG=demo
```

Unset `DEMO_VISIBLE_MODULES` ⇒ Demo shows the same modules as Internal.

---

## Shared application vs isolated business data

| Shared (one app) | Isolated (per workspace) |
| --- | --- |
| UI, modules, nav, APIs, schema | Customers, leads, projects, invoices |
| Bug fixes and feature commits | Employees, messages, calendar, files |
| One deploy to both hosts | Support tickets, financial transactions |

There is **no** synchronisation process between Internal and Demo for application code — deploy once.

Business records **never** synchronise between workspaces.

---

## Demo Owner

| Field | Value |
| --- | --- |
| Email / username | `demo@unit311central.com` |
| Role | Owner (`workspace_users.is_owner` + Admin Ops entitlements) |
| Primary workspace | `demo` only |

Seeded by migration `119_dual_demo_workspace_tenancy.sql` (password stored as scrypt hash only).

---

## Provisioning

- `provision_workspace(company_name, slug)` clones **config only** from `unit311` (settings, modules, empty file folders).
- Reserved slug `demo` is **idempotent** via `ensure_demo_workspace()` / `ensure_workspace_foundation()`.
- Never copies clients, invoices, employees, messages, or other business rows.

TS helper: `ensureDemoWorkspace()` in `src/lib/workspace-provisioning-service.ts`.

---

## Promotion / development workflow

```
Edit the shared application (while viewing Internal or Demo)
    → Commit / push main
    → One production deploy
    → Both internal.* and demo.* receive the same build
```

Before a customer presentation:

1. Deploy the latest approved `main` (if not already live).
2. Confirm Demo Owner login on `https://demo.unit311central.com`.
3. (Optional) refresh curated Demo sample content when a content script exists — never copy live Internal business data.

Synthetic Demo data generation targets workspace `demo` only.

### Enterprise Demo seed (Meridian Atlas Group)

```bash
npm run demo:enterprise:seed
# alias: npm run demo:refresh
```

- Wipes **Demo** business rows only (`workspace_id = demo`), never Internal.
- Seeds ~100 employees, ~100 clients, projects, CRM, support, calendar, GL/invoices/expenses, payroll, software assets, messaging.
- Writes [`src/lib/demo-enterprise/fixtures.generated.json`](../src/lib/demo-enterprise/fixtures.generated.json) for Demo-host mock modules + simulated Wise.
- Framework: [`scripts/demo-enterprise/`](../scripts/demo-enterprise/).

**Simulated Wise (Demo only):** Demo treasury uses an in-app simulator (`src/lib/treasury/providers/demo-wise-simulator.ts`). No Wise API keys or external calls. Internal continues to use live Wise when configured.

**Deferred (do not implement now):** [Authentication hardening](./TECHNICAL_DEBT.md#authentication-hardening) — redirect unauthenticated visitors on `internal.*` / `demo.*` to login instead of serving the Ops shell. Current API-gated behaviour is accepted.

---

## Ops checklist

- [ ] DNS / Vercel domain: `demo.unit311central.com` → same project as Internal
- [ ] Migrations `097_demo_workspace.sql` and `119_dual_demo_workspace_tenancy.sql` applied
- [ ] `npm run demo:verify` passes
- [ ] Demo Owner can log in; Internal operators still work on Internal and Demo
