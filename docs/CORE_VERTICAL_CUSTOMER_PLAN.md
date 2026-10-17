# Core → Vertical → Customer — Refactor Plan

> **Status:** Planning / proposal. Non-destructive. Nothing here changes behaviour until individually scheduled.
> **Goal:** Evolve the current single multi-tenant app into a clean **Core → Vertical → Customer** layering so new customers (drone/UAV, 3D printing, etc.) are *decorated onto* a shared core instead of forked from it.

This document maps the target architecture onto the **actual files in this repo today**.

---

## 1. The one rule that matters

> **Dependencies point one way: `customer → vertical → core`. Core never imports a vertical or a customer. A vertical never imports a customer.**

Today this is violated — core files inline-`require()` customer code:

- `src/lib/app-domains.ts` → `require("@/lib/saec-surface")`, `require("@/lib/wolf/...")`
- `src/lib/workspace-context.ts` → imports `abhi`, `greendesert`, `talanton`, `portals`
- `src/lib/workspace-enabled-views.ts` → imports `pailex`, `wolf`, `greendesert`

Fixing this inversion (via a registry, see §5) is the backbone of the whole plan.

---

## 2. Target layering

| Tier | What it is | Reused by |
| --- | --- | --- |
| **1 — Core** | Horizontal product every business needs: the 22 modules, the AI Executive Assistant engine, auth, tenancy, billing, platform infra. | Everyone |
| **2 — Vertical packs** | Industry modules. e.g. **Drone/UAV** (telemetry, WebODM, flight ops, survey). **Conservation** (WOLF animals/containment/environment/fleet). **3D Printing** (future). | All customers in that vertical |
| **3 — Customer packs** | Mostly a typed manifest (branding, currency, enabled modules/verticals, nav, custom fields, EA tools). Code only for genuinely bespoke behaviour. | One customer |

---

## 3. Proposed package layout

Monorepo (single git repo), enforced package boundaries:

```
packages/
  core/                     # Tier 1 — the product. No customer/vertical names anywhere.
    platform/               # app-domains, workspace-*, middleware, platform-*, supabase/
    modules/                # the 22 core modules (financials, crm, hr, board, …)
    ea/                     # ai-operating-assistant, central-application-model, central-capabilities
    registry/               # extension-point registry (new — see §5)
  verticals/
    drone-uav/              # Tier 2
    conservation/           # Tier 2 (extracted from WOLF specialist modules)
    three-d-printing/       # Tier 2 (future)
  customers/
    onwardair/              # Tier 3 — thin, mostly manifest
    talanton/
    abhi/
    ...
apps/
  platform/                 # the deployable Next.js app that assembles core + verticals + customers
```

> Short term you can keep this as folders under `src/` with path-based boundaries; the names above are the logical targets. The CI boundary rule (§6) is what makes it real, not the folder move.

---

## 4. File mapping (today → target)

### 4.1 Tier 1 — CORE (the bulk stays here)

**Platform / infra** (`core/platform`)

| Today | Notes |
| --- | --- |
| `src/middleware.ts` | Host routing. Must be de-coupled from client names. |
| `src/lib/app-domains.ts` | Remove inline `require()` of saec/wolf → registry. |
| `src/lib/workspace-host.ts`, `workspace-context.ts`, `workspace-authorization.ts`, `workspace-brand*.ts`, `workspace-tenant-*.ts`, `workspace-prefetch.ts`, `workspace-session-rebind.ts`, `runtime-surface.ts` | De-couple from client names → registry. |
| `src/lib/platform-*.ts` (auth, session, signup, billing, users, pricing, performance) | Core identity/auth/billing. |
| `src/lib/platform-workspaces/**` | Module catalogue + provisioning — **the heart of config-driven enablement**. |
| `src/lib/supabase/**` | DB clients + tenancy. |
| `src/lib/access-presets.ts`, `operator-entitlements-*.ts`, `internal-role-views.ts` | AuthZ / role model. |

**AI Executive Assistant engine** (`core/ea`) — your biggest powerhouse

| Today | Notes |
| --- | --- |
| `src/lib/ai-operating-assistant/**` (208 files) | The engine. Keep generic; customer/vertical tools register in. |
| `src/lib/central-application-model/**` | Evidence/planner/synthesis/registry. |
| `src/lib/central-capabilities/**` | Capability definitions. |
| `src/lib/ea-acceptance/**`, `executive-assistant-*.ts` | Acceptance harness + UI context. |

**Core modules** (`core/modules`) — the 22

| Module | Representative files |
| --- | --- |
| Financials / Accounting | `accounting/**`, `financials-*.ts`, `financial-*.ts`, `treasury/**`, `wise-service.ts`, `payroll/**`, `expenses-*.ts`, `expense-management/**` |
| Business Central / CRM / Sales | `crm-*.ts`, `sales-management-*.ts`, `target-clients*.ts`, `client-management-data.ts`, `clients-dashboard-insights.ts`, `potential-clients-data.ts`, `competitors-*.ts` |
| Board & Governance | `board-*.ts`, `board/**`, `executive-board-pack-types.ts` |
| Corporate Information | `corporate-information/**`, `company-details-*.ts`, `office-locations-data.ts`, `org-chart-data.ts` |
| HR | `hr-*.ts`, `human-resources/**`, `career*-data.ts`, `representatives-*.ts` |
| Projects | `project-management-*.ts`, `project-*.ts`, `internal-projects/**`, `internal-project-tasks-service.ts` |
| Operations | `operations/**`, `procurement-*.ts`, `inventory-*.ts`, `asset-management-data.ts`, `logistics-data.ts`, `shipping-provider-registry.ts` ⚠️(confirm core vs vertical) |
| Marketing & Events | `marketing/**`, `marketing-*.ts`, `marketing-events/**` |
| Technology Management | `technology-management-*.ts`, `technology-telecom/**` |
| Business Productivity | `business-productivity/**`, `whiteboard-*.ts`, `files-*.ts`, `internal-files-*.ts` |
| Support Desk | `support-*.ts`, `support-desk/**`, `unit311-support/**`, `whatsapp/**` |
| Training / QMS | `training/**`, `lms/**`, `qms*.ts`, `tqms-*.ts`, `guided-tutorials/**` |
| Engineering | `engineering-*.ts`, `engineering/**`, `engineering-sop/**`, `engineering-technical-files/**` |
| Intelligence | `intelligence/**` (generic registry), `sector-*.ts` |
| Fundraising | `fundraising/**`, `grants-data.ts`, `workspace-fundraising-data.ts` |
| Email / Calendar / Messaging | `email/**`, `calendar-*.ts`, `internal-messaging-*.ts`, `messaging-*.ts`, `cronofy/**` |
| External Client Access / Portals | `external-client-access-*.ts`, `external-*.ts`, `portals/**` (framework), `client-onboarding-*.ts` |
| Settings / Tools / Integrations | `settings/**`, `tools/**`, `integrations-*.ts`, `integration-*.ts` |
| Home / Dashboards | `home/**`, `home-*.ts`, `executive-home-*.ts`, `command-centre-*.ts`, `dashboard-framework/**`, `view-dashboard-tile-catalogs.ts` |

**Public marketing site** (`core/platform` or its own `apps/marketing`) — `src/app/about|book|contact|faq|industries|...`, `components/sections|marketing|about|faq|legal`.

---

### 4.2 Tier 2 — VERTICAL PACKS

**`verticals/drone-uav`** (you already own ~90% of this)

| Today | Notes |
| --- | --- |
| `src/lib/webodm-client.ts`, `webodm-config.ts`, `webodm-deliverables.ts`, `webodm-env.ts` | Photogrammetry pipeline. |
| `src/lib/flight-simulation.ts`, `mission-management-data.ts`, `mission-replay.ts` | Flight ops. |
| `src/lib/telemetry.ts`, `telemetry-dashboard-utils.ts` | Fleet telemetry. |
| `src/lib/map-tiles.ts`, `elevation-colormap.ts`, `weather-data.ts` | Geospatial. |
| `src/lib/survey-operations-mock-data.ts`, `mining-sector-data.ts` | Survey vertical. |
| `src/lib/realtime-video-pipeline/**`, `realtime-video-workbench-nav.ts` | Live video/drone. |
| `src/app/(survey-operations)/**`, `app/api/webodm`, `app/api/weather`, `app/api/telemetry` | Routes. |
| `components/dashboard/aerial-intelligence/**`, `components/telemetry/**` | UI. |
| `src/app/surveying|inspection|commercial-imaging` | Drone-service marketing (could be customer-level). |

**`verticals/conservation`** (extract from WOLF)

| Today | Notes |
| --- | --- |
| WOLF specialist modules 23–28: `wolf-animals`, `wolf-containment`, `wolf-environment`, `wolf-fleet`, `wolf-drone-operations`, `wolf-shark` (in `src/lib/wolf/**`, `components/wolf/**`) | These are a **vertical**, currently trapped inside a customer. `wolf-drone-operations` overlaps `drone-uav`. |

**`verticals/three-d-printing`** — *new, future.* Machines, materials, print queue, job costing. No code yet.

---

### 4.3 Tier 3 — CUSTOMER PACKS

Each = `{client}-surface.ts` + `src/lib/{client}/**` + `components/{client}/**` + `app/api/{client}/**`.

| Customer | lib files / folders | Status to confirm |
| --- | --- | --- |
| **OnwardAir** | `onwardair-*.ts` (3), `lib/onwardair/**` (41), `components/onwardair/**`, `api/onwardair` | Active (frozen `/overview`) |
| **Talanton** | `talanton-*.ts` (3), `lib/talanton/**` (84), `components/talanton/**`, `api/talanton` | Active (frozen Home) |
| **ABHI** | `abhi-*.ts` (17), `lib/abhi/**` (60), `components/abhi/**`, `api/abhi` | Active |
| **WOLF** | `lib/wolf/**` (49), `components/wolf/**`, `api/wolf` | Active — *split: customer config vs conservation vertical* |
| **Pailex** | `lib/pailex/**` (14), `components/pailex/**`, `api/pailex` | Active — consumes conservation vertical |
| **Green Desert** | `greendesert-surface.ts`, `lib/greendesert/**` (33), `components/greendesert/**`, `api/greendesert` | Active? confirm |
| **SAEC** | `saec-surface.ts`, `lib/saec/**` (50), `lib/saec-discovery/**` (10), `components/saec/**`, `api/saec`, `api/saec-discovery` | Active? confirm |
| **Interface Worx** | `interface-worx-*.ts` (3), `components/interface-worx-website/**` | Active? confirm |
| **MAM** | `lib/mam/**`, `components/mam-website/**` | Marketing site only — confirm |
| **Corpcentre** | `corpcentre-*.ts` (5) | ⚠️ Demo/legacy? confirm |
| **Venturi** | `venturi-*.ts` (2) | ⚠️ Demo/legacy? confirm |
| **Amanah** | `amanah-surface.ts` | ⚠️ Stub — confirm |
| **BCD / Barcelona Drone** | `bcd-training-data.ts`, `legacy-bcn-nav.ts` | ⚠️ **Legacy — deletion candidate** |

---

### 4.4 Special: Demo / Internal

| Today | Target |
| --- | --- |
| `src/lib/demo/**` (81), `demo-enterprise/**`, `components/demo/**`, `components/testflighthub/**` | Treat **Demo as a "reference customer"** built entirely on the new contract — it becomes the canonical example of config-driven decoration. |
| `src/lib/internal/**`, `internal-*.ts`, Internal Ops shell | **Unit311 itself = customer #0.** Its own ops run on core like any tenant. |

---

## 5. The extension contract (new code to add in `core/registry`)

```ts
// Customer/vertical capabilities are DECLARED, not imported by core.
export interface CustomerManifest {
  slug: string;
  displayName: string;
  branding: { logo: string; accent: string; loginArt?: string };
  locale: { currency: string; dateFormat: string; timezone: string };
  verticals: VerticalId[];              // ["drone-uav"]
  modules: ModuleId[];                  // subset of the 22 (today: workspace_modules rows)
  featureFlags?: Record<string, boolean>;
  customFields?: CustomFieldDef[];      // JSONB-backed; no per-customer tables
  eaTools?: EAToolRegistration[];       // which EA tools this tenant exposes
}

export interface VerticalPack {
  id: VerticalId;
  modules: ModuleDefinition[];          // vertical-specific modules
  navContributions: NavSection[];
  eaTools: EAToolRegistration[];
  routes?: RouteSpec[];
}

// Core exposes registration; packs push in at boot. Core never pulls packs.
export function registerVertical(pack: VerticalPack): void;
export function registerCustomer(manifest: CustomerManifest): void;
```

This replaces the per-client copy-paste of `nav.ts`, `login-branding.ts`, `*-ea-orchestration.ts`, `*-surface.ts`, `*-nav-order.ts`, `*-financials.ts`.

---

## 6. CI boundary enforcement (do this FIRST)

Add `dependency-cruiser` (or an ESLint boundaries rule) that **fails CI** on:

- `core/**` importing `verticals/**` or `customers/**`
- `verticals/**` importing `customers/**`
- any customer importing another customer

Running it today will light up every current violation — that output *is* your debt backlog.

---

## 7. Migration sequence (mapped to real files)

| Phase | Action | Primary files |
| --- | --- | --- |
| **0** | Add CI boundary rule (expected to fail) → produces debt map. | new config |
| **1** | Build `core/registry` + `CustomerManifest`/`VerticalPack`. | new |
| **2** | De-invert core: remove inline client `require()`s. | `app-domains.ts`, `workspace-context.ts`, `workspace-enabled-views.ts`, `middleware.ts` |
| **3** | Extract **Drone/UAV vertical** (lowest risk, you own it). | §4.2 drone files |
| **4** | Convert **one simple customer** (NOT frozen OnwardAir/Talanton/homepage) to manifest+registry as reference. | e.g. Green Desert or Interface Worx |
| **5** | Split **WOLF** → conservation vertical + thin WOLF/Pailex customer packs. | `lib/wolf/**`, `lib/pailex/**` |
| **6** | Migrate remaining customers to manifests. | §4.3 |
| **7** | Harden tenancy: RLS + `workspace_id` query scoping. | `supabase/**`, migrations |
| **8** | Split mega-files. | `internal-operations-data.ts` (79KB), `*-mock-store.ts` (78–82KB), `internal-db-migrations.ts` (112KB) |

Guardrail throughout: the existing `prove:*` / `test:*` acceptance suites (~160 scripts). Run the relevant `prove:*` before/after each phase; never touch frozen surfaces without owner sign-off.

---

## 8. Open questions for the owner

1. **Active vs legacy customers?** Confirm status of Corpcentre, Venturi, Amanah, Interface Worx, MAM, SAEC, Green Desert. BCD/`legacy-bcn` looks deletable.
2. **Deploy topology:** stay single multi-tenant deploy for now (recommended) vs per-customer deploys later?
3. **`logistics` / `shipping` / `asset-management`:** core Operations, or part of a vertical?
4. **WOLF/Pailex:** confirm the conservation modules are a reusable vertical (not one-off).
5. **First reference customer** to convert in Phase 4?
