# Unit311 Core Module Inventory

Generated from the **current codebase** (`2026-09-26T15:40:05.439Z`). Inventory only — no architectural recommendations.

## Source of truth

| Concern | Location |
|---------|----------|
| 22-module Workspaces catalogue | `buildCentralProductNavSections()` in `src/lib/platform-workspaces/central-product-nav.ts` |
| Provisioning keys | `WORKSPACE_MODULE_CATALOGUE` in `src/lib/platform-workspaces/module-catalogue.ts` |
| Runtime nav (broader, host-specific) | `internalSurveyNavSections` in `src/lib/internal-operations-data.ts` |
| View router | `InternalOperationsView` + `activeView` in `InternalOperationsDashboard.tsx` |
| Canonical module registry (≥22) | `CANONICAL_MODULES` in `src/lib/central-application-model/canonical-modules.ts` |
| API handlers | `src/app/api/**/route.ts` |
| Database | `supabase/migrations/*.sql` |

## Routing model

- Primary shell: `/dashboard?view=<InternalOperationsView>` (also `/internaldashboard`, workspace hosts).
- **Sales Management:** `/dashboard?view=sales-management&tab=<SalesManagementTabId>` (`src/lib/sales-management-tabs.ts`).
- **Finances:** leaves use `tab`, `filter`, or `section` query params (`FINANCES_QUERY_PARAM_VIEWS` in `finances-nav.ts`).
- Legacy path redirects: `next.config.ts`.

## User expected 22 ↔ codebase catalogue

| # | User expected name | Code catalogue (`buildCentralProductNavSections`) |
|---|-------------------|-----------------------------------------------------|
| 1 | HOME | #1 HOME (`home`) |
| 2 | EXECUTIVE ASSISTANT | #2 EXECUTIVE ASSISTANT |
| 3 | BUSINESS CENTRAL | **#4** BUSINESS CENTRAL — code **#3 is INTELLIGENCE** (not in user list) |
| 4–21 | (see code order) | Sales #5, Finances #6, Fundraising #7, Board #8, Corporate #9, Operations #10, Marketing #11, Tech #12, HR #13, Business Prod #14, Support #15, PM #16, Engineering #17, Training #18, QMS #19, Tools #20 |
| — | EXTERNAL MANAGEMENT | #21 EXTERNAL CLIENT ACCESS (`external-client-access`) |
| — | SETTINGS | #22 SETTINGS |
| — | ASSETS, INVENTORY & LOGISTICS | **Not top-level** — Operations #10: Assets, Inventory, Procurement, Logistics |

**Home UI (established):** `ExecutiveHomeDashboard` in `WorkspacePane view="home"`; marketing explorer copy in `HomeWorkspaceExplorer.tsx` (capability cards, not live cross-module data feeds).

---

## 1. HOME

**Code id:** `home`  
**Maps to user expected-22 label:** HOME  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| HOME | home | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `NavImplementationNotice`
- `ExecutiveHomeDashboard`

### E. Backend

- `/api/internal/command-centre`
- `/api/strategy/items`
- `/api/strategy/items/[id]`
- `/api/telemetry`
- `/api/telemetry/records`

### F. Data model

- `public.platform_usage_events` (migration scan; may be shared)
- `public.strategy_items` (migration scan; may be shared)
- `public.internal_operators` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 2. EXECUTIVE ASSISTANT

**Code id:** `executive-assistant`  
**Maps to user expected-22 label:** EXECUTIVE ASSISTANT  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| EXECUTIVE ASSISTANT | executive-assistant | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `ExecutiveAssistantWorkspace`

### E. Backend

- `/api/abhi/ea-tests`
- `/api/demo/ea-tests`
- `/api/demo/ea-tests/pdf`
- `/api/demo/ea-tests/probe`
- `/api/demo/ea-tests/run-one`
- `/api/executive-assistant/actions`
- `/api/executive-assistant/actions/plans`
- `/api/executive-assistant/actions/plans/[id]`
- `/api/executive-assistant/artifacts/[id]`
- `/api/executive-assistant/chat`
- `/api/executive-assistant/conversations`
- `/api/executive-assistant/conversations/[id]`
- `/api/executive-assistant/conversations/resume`
- `/api/executive-assistant/feedback`
- `/api/executive-assistant/planning/goals`
- `/api/executive-assistant/planning/goals/[id]`
- `/api/executive-assistant/proactive`
- `/api/executive-assistant/tts`

### F. Data model

- `public.executive_assistant_conversations` (migration scan; may be shared)
- `public.executive_assistant_model_usage` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 3. INTELLIGENCE

**Code id:** `intelligence`  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Company Intelligence | demo-company-intelligence | 0 |
| Client Intelligence | demo-client-intelligence | 0 |
| Market Intelligence | demo-market-intelligence | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- NOT ESTABLISHED FROM CODEBASE (no direct activeView match for catalogue leaves)

### E. Backend

- `/api/competitors`
- `/api/competitors/[id]`
- `/api/intelligence/briefing`
- `/api/intelligence/domains`
- `/api/intelligence/records/[recordId]`
- `/api/intelligence/search`
- `/api/intelligence/sources`

### F. Data model

- `public.competitors` (migration scan; may be shared)
- `public.strategy_items` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 4. BUSINESS CENTRAL

**Code id:** `business-central`  
**Maps to user expected-22 label:** BUSINESS CENTRAL  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | business-central-dashboard | 0 |
| Clients | — | 3 |
| Management | — | 4 |
| Grants | grants | 0 |
| Information Repository | information-repository | 0 |

<details><summary>Clients</summary>

- Dashboard — `clients-dashboard` → /dashboard?view=clients-dashboard
- Client Directory — `clients` → /dashboard?view=clients
- Member Intelligence — `member-intelligence` → /dashboard?view=member-intelligence

</details>

<details><summary>Management</summary>

- Dashboard — `management` → /dashboard?view=management
- Meetings — `management` ({"section":"meetings"}) → /dashboard?view=management&section=meetings
- Function Packs — `management` ({"section":"function-packs"}) → /dashboard?view=management&section=function-packs
- Actions & Decisions — `management` ({"section":"actions-decisions"}) → /dashboard?view=management&section=actions-decisions

</details>

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `ManagementWorkspace`
- `InterfaceWorxInformationRepositoryWorkspace`

### E. Backend

- `/api/client-onboarding`
- `/api/client-onboarding/[id]`
- `/api/client-onboarding/[id]/advance`
- `/api/client-onboarding/[id]/payment-receipt`
- `/api/client-onboarding/[id]/questionnaire`
- `/api/clients`
- `/api/clients/[id]`
- `/api/clients/[id]/files-root`
- `/api/clients/[id]/reset-workspace-onboarding`
- `/api/clients/[id]/support-lounge`
- `/api/clients/support-lounge/ensure-all`
- `/api/crm/meetings`
- `/api/crm/meetings/[id]`
- `/api/crm/meetings/[id]/focus-pdf`
- `/api/crm/meetings/[id]/start`
- `/api/information-repository`
- `/api/information-repository/sections`
- `/api/internal-work-packages`
- `/api/internal-work-packages/[id]`
- `/api/internal-work-packages/[id]/members`
- `/api/internal-work-packages/[id]/tasks`
- `/api/internal-work-packages/[id]/tasks/[taskId]`
- `/api/internal/command-centre`
- `/api/strategy/items`
- `/api/strategy/items/[id]`

### F. Data model

- `public.internal_clients` (migration scan; may be shared)
- `public.client_onboarding_records` (migration scan; may be shared)
- `public.crm_leads` (migration scan; may be shared)
- `public.crm_connections` (migration scan; may be shared)
- `public.crm_contact_history` (migration scan; may be shared)
- `public.internal_work_packages` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 5. SALES MANAGEMENT

**Code id:** `sales-management`  
**Maps to user expected-22 label:** SALES MANAGEMENT  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | sales-management | 0 |
| Overview | — | 2 |
| Management | — | 5 |
| Sales | — | 7 |

<details><summary>Overview</summary>

- My Sales — `sales-management` ({"tab":"my-sales"}) → /dashboard?view=sales-management&tab=my-sales
- Sales Team — `sales-management` ({"tab":"sales-team"}) → /dashboard?view=sales-management&tab=sales-team

</details>

<details><summary>Management</summary>

- Targets & Forecast — `sales-management` ({"tab":"targets"}) → /dashboard?view=sales-management&tab=targets
- Performance — `sales-management` ({"tab":"performance"}) → /dashboard?view=sales-management&tab=performance
- Forecast — `sales-management` ({"tab":"forecast"}) → /dashboard?view=sales-management&tab=forecast
- Commissions — `sales-management` ({"tab":"commissions"}) → /dashboard?view=sales-management&tab=commissions
- Reports — `sales-management` ({"tab":"reports"}) → /dashboard?view=sales-management&tab=reports

</details>

<details><summary>Sales</summary>

- Prospects — `sales-management` ({"tab":"prospects"}) → /dashboard?view=sales-management&tab=prospects
- Opportunities — `sales-management` ({"tab":"opportunities"}) → /dashboard?view=sales-management&tab=opportunities
- Pipeline — `sales-management` ({"tab":"pipeline"}) → /dashboard?view=sales-management&tab=pipeline
- Discovery — `sales-management` ({"tab":"discovery"}) → /dashboard?view=sales-management&tab=discovery
- Activities — `sales-management` ({"tab":"activities"}) → /dashboard?view=sales-management&tab=activities
- Sales Quotes — `sales-management` ({"tab":"sales-quotes"}) → /dashboard?view=sales-management&tab=sales-quotes
- Partners — `sales-management` ({"tab":"partners"}) → /dashboard?view=sales-management&tab=partners

</details>

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `SalesManagementWorkspace`

### E. Backend

- `/api/crm/connections`
- `/api/crm/connections/[id]`
- `/api/crm/leads`
- `/api/crm/leads/[id]`
- `/api/crm/leads/[id]/approve-pdf`
- `/api/crm/leads/[id]/commit-discovery`
- `/api/crm/leads/[id]/discovery-questions`
- `/api/crm/leads/[id]/generate-pdf`
- `/api/crm/leads/[id]/generate-pptx`
- `/api/crm/leads/[id]/logo`
- `/api/crm/leads/[id]/promote-to-client`
- `/api/crm/leads/[id]/timeline`
- `/api/crm/meetings`
- `/api/crm/meetings/[id]`
- `/api/crm/meetings/[id]/focus-pdf`
- `/api/crm/meetings/[id]/start`
- `/api/crm/report-chat/[token]`
- `/api/financials/quotes`
- `/api/financials/quotes/[id]`
- `/api/financials/quotes/from-lead`
- `/api/sales-management/activities`
- `/api/sales-management/commission-rules`
- `/api/sales-management/dashboard`
- `/api/sales-management/targets`
- `/api/sales-management/workspace`

### F. Data model

- `public.sales_teams` (migration scan; may be shared)
- `public.sales_team_members` (migration scan; may be shared)
- `public.sales_targets` (migration scan; may be shared)
- `public.sales_commissions` (migration scan; may be shared)
- `public.sales_quotes` (migration scan; may be shared)
- `public.sales_quote_line_items` (migration scan; may be shared)
- `public.crm_leads` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 6. FINANCES

**Code id:** `financials`  
**Maps to user expected-22 label:** FINANCES  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | financials | 0 |
| General Ledger | — | 3 |
| Accounts Receivable | — | 5 |
| Accounts Payable | — | 5 |
| Expenses | — | 6 |
| Banking & Cash | — | 3 |
| Planning & Management | — | 6 |
| Financial Reports | financial-reports | 0 |

<details><summary>General Ledger</summary>

- Chart of Accounts — `general-ledger` ({"tab":"accounts"}) → /dashboard?view=general-ledger&tab=accounts
- Trial Balance — `general-ledger` ({"tab":"trial"}) → /dashboard?view=general-ledger&tab=trial
- Journals — `general-ledger` ({"tab":"journal"}) → /dashboard?view=general-ledger&tab=journal

</details>

<details><summary>Accounts Receivable</summary>

- Invoices — `accounts-receivable` → /dashboard?view=accounts-receivable
- Outstanding — `accounts-receivable` ({"filter":"outstanding"}) → /dashboard?view=accounts-receivable&filter=outstanding
- Overdue — `accounts-receivable` ({"filter":"overdue"}) → /dashboard?view=accounts-receivable&filter=overdue
- Collections — `finances-ar-collections` → /dashboard?view=finances-ar-collections
- AR Reporting — `finances-ar-reporting` → /dashboard?view=finances-ar-reporting

</details>

<details><summary>Accounts Payable</summary>

- Supplier Invoices — `accounts-payable` ({"section":"invoices"}) → /dashboard?view=accounts-payable&section=invoices
- Approvals — `accounts-payable` ({"section":"approvals"}) → /dashboard?view=accounts-payable&section=approvals
- Outstanding — `accounts-payable` ({"section":"outstanding"}) → /dashboard?view=accounts-payable&section=outstanding
- Due Dates — `accounts-payable` ({"section":"due-dates"}) → /dashboard?view=accounts-payable&section=due-dates
- Payments — `finances-ap-payments` → /dashboard?view=finances-ap-payments

</details>

<details><summary>Expenses</summary>

- My Expenses — `expenses` → /dashboard?view=expenses
- Add Expense — `expenses` ({"section":"add"}) → /dashboard?view=expenses&section=add
- All Expenses — `expenses` ({"section":"all"}) → /dashboard?view=expenses&section=all
- Approvals — `expenses` ({"section":"approvals"}) → /dashboard?view=expenses&section=approvals
- Expense Runs — `expenses` ({"section":"runs"}) → /dashboard?view=expenses&section=runs
- Configuration — `expenses` ({"section":"config"}) → /dashboard?view=expenses&section=config

</details>

<details><summary>Banking & Cash</summary>

- Bank — `wise` → /dashboard?view=wise
- Cash Position — `finances-banking-cash-position` → /dashboard?view=finances-banking-cash-position
- Reconciliation — `finances-banking-reconciliation` → /dashboard?view=finances-banking-reconciliation

</details>

<details><summary>Planning & Management</summary>

- Budget — `finances-planning-budget` → /dashboard?view=finances-planning-budget
- Actual vs Budget — `finances-planning-actual-vs-budget` → /dashboard?view=finances-planning-actual-vs-budget
- Cash Flow — `finances-planning-cash-flow` → /dashboard?view=finances-planning-cash-flow
- Forecast — `finances-planning-forecast` → /dashboard?view=finances-planning-forecast
- KPIs — `finances-planning-kpis` → /dashboard?view=finances-planning-kpis
- Management Accounts — `finances-planning-management-accounts` → /dashboard?view=finances-planning-management-accounts

</details>

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `GeneralLedgerWorkspace`
- `AccountsReceivableWorkspace`
- `AccountsPayableWorkspace`
- `ExpensesHubWorkspace`
- `WiseWorkspace`
- `FinancesBankingWorkspace`
- `FinancialReportsWorkspace`

### E. Backend

- `/api/expenses/[id]/approval-history`
- `/api/expenses/[id]/approve`
- `/api/expenses/[id]/reject`
- `/api/expenses/[id]/request-changes`
- `/api/expenses/[id]/submit`
- `/api/expenses/config`
- `/api/expenses/my`
- `/api/expenses/notifications`
- `/api/expenses/runs`
- `/api/expenses/runs/[id]`
- `/api/financials/activity`
- `/api/financials/clients/[id]/summary`
- `/api/financials/expenses`
- `/api/financials/expenses/[id]`
- `/api/financials/expenses/bulk`
- `/api/financials/invoices`
- `/api/financials/ledger/accounts`
- `/api/financials/ledger/accounts/[id]/transactions`
- `/api/financials/ledger/journals`
- `/api/financials/ledger/overview`
- `/api/financials/ledger/trial-balance`
- `/api/financials/payables`
- `/api/financials/quotes`
- `/api/financials/quotes/[id]`
- `/api/financials/quotes/from-lead`
- `/api/financials/supplier-invoices`
- `/api/financials/supplier-invoices/[id]`
- `/api/financials/treasury/activity`
- `/api/financials/treasury/approvals`
- `/api/financials/treasury/notifications`
- `/api/financials/treasury/notifications/[id]/read`
- `/api/financials/treasury/settings`
- `/api/financials/wise/balances`
- `/api/financials/wise/quotes`
- `/api/financials/wise/recipients`
- `/api/financials/wise/recipients/[id]`
- `/api/financials/wise/reconcile`
- `/api/financials/wise/sca-diagnostic`
- `/api/financials/wise/statements/[balanceId]`
- `/api/financials/wise/statements/[balanceId]/export`
- `/api/financials/wise/status`
- `/api/financials/wise/summary`
- `/api/financials/wise/transfers`
- `/api/financials/wise/transfers/[id]`
- `/api/financials/wise/transfers/[id]/fund`
- `/api/financials/wise/webhook`
- `/api/payroll/dashboard`
- `/api/payroll/employees/[id]/profile`
- `/api/payroll/runs`
- `/api/payroll/runs/[id]`
- `/api/payroll/runs/[id]/approve`
- `/api/payroll/runs/[id]/pay`
- `/api/payroll/settings`

### F. Data model

- `public.accounts` (migration scan; may be shared)
- `public.journal_entries` (migration scan; may be shared)
- `public.journal_lines` (migration scan; may be shared)
- `public.invoices` (migration scan; may be shared)
- `public.wise_payment_matches` (migration scan; may be shared)
- `public.financial_expenses` (migration scan; may be shared)
- `public.treasury_settings` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 7. FUNDRAISING

**Code id:** `fundraising`  
**Maps to user expected-22 label:** FUNDRAISING  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | fundraising-dashboard | 0 |
| Investors | fundraising-investors | 0 |
| Cap Table Management | fundraising-cap-table | 0 |
| Pipeline | fundraising-pipeline | 0 |
| Meetings | fundraising-meetings | 0 |
| Pitch Decks | fundraising-pitch-decks | 0 |
| Data Rooms | fundraising-data-rooms | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `FundraisingDashboardHost`
- `FundraisingInvestorsHost`
- `FundraisingCapTableHost`
- `FundraisingPipelineHost`
- `FundraisingMeetingsHost`
- `FundraisingPitchDecksHost`
- `FundraisingDataRoomsHost`

### E. Backend

- NOT ESTABLISHED FROM CODEBASE

### F. Data model

- NOT ESTABLISHED FROM CODEBASE (no dedicated fundraising tables in migration scan)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 8. BOARD

**Code id:** `board`  
**Maps to user expected-22 label:** BOARD  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | board-dashboard | 0 |
| Meetings | board-meetings | 0 |
| Minutes & Decisions | board-minutes | 0 |
| Board Members | board-members | 0 |
| Board deck | board-pack | 0 |
| Risk Register | corporate-risk-register | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `BoardGovernanceWorkspace`

### E. Backend

- `/api/abhi/board-deck`
- `/api/demo/board-deck`
- `/api/talanton/board-deck`

### F. Data model

- `public.board_directors` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 9. CORPORATE INFORMATION

**Code id:** `corporate-information`  
**Maps to user expected-22 label:** CORPORATE INFORMATION  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | corporate-dashboard | 0 |
| Company Information | corporate-company-details | 0 |
| Office Locations | office-locations | 0 |
| Bank Accounts | corporate-bank-accounts | 0 |
| Professional Advisors | corporate-advisers | 0 |
| Contracts | corporate-contracts | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- NOT ESTABLISHED FROM CODEBASE (no direct activeView match for catalogue leaves)

### E. Backend

- `/api/company-details`
- `/api/company-details/[id]`

### F. Data model

- `public.company_details` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 10. OPERATIONS

**Code id:** `operations`  
**Maps to user expected-22 label:** OPERATIONS  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | operations-dashboard | 0 |
| Assets | assets | 0 |
| Inventory | inventory-management | 0 |
| Procurement | procurement | 0 |
| Logistics | logistics | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `OperationsDashboardWorkspace`
- `div`
- `WorkspaceErrorBoundary`
- `LogisticsWorkspace`

### E. Backend

- `/api/procurement/dashboard`

### F. Data model

- `public.procurement_suppliers` (migration scan; may be shared)
- `public.procurement_purchase_orders` (migration scan; may be shared)
- `public.procurement_requisitions` (migration scan; may be shared)
- `public.procurement_goods_receipts` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 11. MARKETING AND EVENTS

**Code id:** `marketing-events`  
**Maps to user expected-22 label:** MARKETING & EVENTS  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | oa-marketing-dashboard | 0 |
| Digital Newsletter | marketing-newsletter | 0 |
| External Events | marketing-events | 0 |
| Event Management | marketing-event-management | 0 |
| Mailing List | marketing-mailing-list | 0 |
| Client Stories | portfolio-stories | 0 |
| Social | social | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- NOT ESTABLISHED FROM CODEBASE (no direct activeView match for catalogue leaves)

### E. Backend

- `/api/marketing/bundle`
- `/api/marketing/dashboard`
- `/api/marketing/resources/[resource]`
- `/api/website-analytics/events`
- `/api/website-analytics/refresh`
- `/api/website-analytics/summary`

### F. Data model

- `public.marketing_contacts` (migration scan; may be shared)
- `public.marketing_newsletters` (migration scan; may be shared)
- `public.marketing_campaigns` (migration scan; may be shared)
- `public.marketing_external_events` (migration scan; may be shared)
- `public.marketing_managed_events` (migration scan; may be shared)
- `public.marketing_stories` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 12. TECH MGMT

**Code id:** `technology-management`  
**Maps to user expected-22 label:** TECHNOLOGY MANAGEMENT  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | technology-dashboard | 0 |
| Architecture Diagrams | technology-architecture | 0 |
| Technology Assets | technology-devices | 0 |
| Software & SaaS Dashboard | technology-software-dashboard | 0 |
| Software & SaaS | technology-software | 0 |
| Telecommunications | technology-telecommunications | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `TechnologyArchitectureWorkspace`
- `div`
- `SoftwareSaasDashboardWorkspace`
- `TechnologySoftwareWorkspace`
- `TelecommunicationsWorkspace`

### E. Backend

- `/api/architecture-diagrams`
- `/api/software-assets`
- `/api/software-assets/[id]`
- `/api/software-assets/[id]/files`
- `/api/software-assets/[id]/reveal-password`
- `/api/technology/telecom`
- `/api/technology/telecom/[id]`

### F. Data model

- `public.system_architecture_diagrams` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 13. HUMAN RESOURCES

**Code id:** `human-resources`  
**Maps to user expected-22 label:** HUMAN RESOURCES  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | hr-dashboard | 0 |
| Employees | hr | 0 |
| Org Chart | hr-org-chart | 0 |
| Recruitment | hr-recruitment | 0 |
| Time & Attendance | hr-leave | 0 |
| Payroll | hr-payroll | 0 |
| Performance | hr-performance | 0 |
| HR Reports | hr-reports | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `HrWorkspace`
- `OrgChartWorkspace`
- `RecruitmentWorkspace`
- `LeaveManagementWorkspace`
- `PayrollWorkspace`
- `PerformanceHubWorkspace`
- `HrReportsWorkspace`

### E. Backend

- `/api/hr/employees`
- `/api/hr/employees/[id]`
- `/api/hr/employees/[id]/archive`
- `/api/hr/employees/[id]/compensation-history`
- `/api/hr/employees/[id]/documents`
- `/api/hr/employees/[id]/documents/[docId]`
- `/api/hr/employees/[id]/notes`
- `/api/hr/employees/[id]/payment-details`
- `/api/hr/employees/[id]/timeline`
- `/api/hr/employees/bulk-delete`
- `/api/payroll/dashboard`
- `/api/payroll/employees/[id]/profile`
- `/api/payroll/runs`
- `/api/payroll/runs/[id]`
- `/api/payroll/runs/[id]/approve`
- `/api/payroll/runs/[id]/pay`
- `/api/payroll/settings`

### F. Data model

- `public.hr_employees` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 14. BUSINESS PROD

**Code id:** `business-productivity`  
**Maps to user expected-22 label:** BUSINESS PRODUCTIVITY  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | productivity-dashboard | 0 |
| Content Studio | content-studio | 0 |
| Internal Work Packages | internal-work-packages | 0 |
| File Explorer | — | 3 |
| Email | info-email | 0 |
| Calendar | calendar | 0 |
| Messaging | messaging | 0 |
| Communications | communications | 0 |
| Whiteboard | whiteboard | 0 |

<details><summary>File Explorer</summary>

- Internal Files — `files-internal` → /dashboard?view=files-internal
- External Files — `files-external` → /dashboard?view=files-external
- Client Explorer — `files-client` → /dashboard?view=files-client

</details>

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `ProductivityDashboardWorkspace`
- `ContentStudioWorkspace`
- `InternalWorkPackagesWorkspace`
- `FileRepositoryWorkspace`
- `ClientFilesExplorerWorkspace`
- `WhiteboardWorkspace`

### E. Backend

- `/api/calendar/events`
- `/api/calendar/events/[id]`
- `/api/calendar/meetings/[eventId]`
- `/api/calendar/meetings/[eventId]/transcript`
- `/api/calendar/meetings/[eventId]/webrtc`
- `/api/email/accounts`
- `/api/email/attachments`
- `/api/email/calendar`
- `/api/email/credentials`
- `/api/email/messages`
- `/api/email/notifications/check`
- `/api/email/notifications/test`
- `/api/email/notifications/whatsapp`
- `/api/email/reply`
- `/api/email/send`
- `/api/email/test`
- `/api/files/browse`
- `/api/files/categories`
- `/api/files/categories/[id]`
- `/api/files/external/browse`
- `/api/files/folders`
- `/api/files/folders/[id]`
- `/api/files/objects/[id]`
- `/api/files/upload`
- `/api/files/upload/complete`
- `/api/files/upload/prepare`
- `/api/internal-work-packages`
- `/api/internal-work-packages/[id]`
- `/api/internal-work-packages/[id]/members`
- `/api/internal-work-packages/[id]/tasks`
- `/api/internal-work-packages/[id]/tasks/[taskId]`
- `/api/messaging/attachments`
- `/api/messaging/calls`
- `/api/messaging/calls/[sessionId]`
- `/api/messaging/calls/[sessionId]/daily`
- `/api/messaging/calls/[sessionId]/webrtc`
- `/api/messaging/channels`
- `/api/messaging/config`
- `/api/messaging/messages`
- `/api/messaging/operators`
- `/api/messaging/scheduled-calls`
- `/api/messaging/unread`

### F. Data model

- NOT ESTABLISHED FROM CODEBASE — verify domain lib + migrations

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 15. SUPPORT DESK

**Code id:** `support-desk`  
**Maps to user expected-22 label:** SUPPORT DESK  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Ticket Overview | support-overview | 0 |
| Tickets | support | 0 |
| My support tickets | support-mine | 0 |
| WhatsApp Integration | whatsapp-integration | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `SupportWorkspace`
- `WorkspaceErrorBoundary`

### E. Backend

- `/api/support/tickets`
- `/api/support/tickets/[id]`
- `/api/support/tickets/[id]/assign`
- `/api/support/tickets/[id]/client-update`
- `/api/support/tickets/[id]/close`
- `/api/support/tickets/[id]/lounge-messages`
- `/api/whatsapp/inbound`
- `/api/whatsapp/support-flow/assign`
- `/api/whatsapp/support/reset`

### F. Data model

- `public.support_tickets` (migration scan; may be shared)
- `public.whatsapp_support_sessions` (migration scan; may be shared)
- `public.support_lounge_messages` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 16. PROJECT MANAGEMENT

**Code id:** `project-management`  
**Maps to user expected-22 label:** PROJECT MANAGEMENT  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | projects-dashboard | 0 |
| Internal Projects | projects-internal | 0 |
| External Projects | projects-external | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- NOT ESTABLISHED FROM CODEBASE (no direct activeView match for catalogue leaves)

### E. Backend

- `/api/projects`
- `/api/projects/[id]`
- `/api/projects/[id]/tasks`
- `/api/projects/[id]/tasks/[taskId]`
- `/api/projects/bulk-delete`

### F. Data model

- `public.internal_projects` (migration scan; may be shared)
- `public.internal_project_tasks` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 17. ENGINEERING

**Code id:** `engineering`  
**Maps to user expected-22 label:** ENGINEERING  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | engineering-dashboard | 0 |
| Programs & Milestones | engineering-programs | 0 |
| Team & Capacity | engineering-capacity | 0 |
| Risks | engineering-risks | 0 |
| Technical Files | engineering-technical-files | 0 |
| SOPs | — | 7 |

<details><summary>SOPs</summary>

- Dashboard — `engineering-sops-dashboard` → /dashboard?view=engineering-sops-dashboard
- SOP Library — `engineering-sops-library` → /dashboard?view=engineering-sops-library
- My Tasks — `engineering-sops-tasks` → /dashboard?view=engineering-sops-tasks
- Active Runs — `engineering-sops-runs` → /dashboard?view=engineering-sops-runs
- Reviews & Approvals — `engineering-sops-reviews` → /dashboard?view=engineering-sops-reviews
- SOP Templates — `engineering-sops-templates` → /dashboard?view=engineering-sops-templates
- Reports — `engineering-sops-reports` → /dashboard?view=engineering-sops-reports

</details>

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `WorkspaceErrorBoundary`

### E. Backend

- `/api/engineering/masters`
- `/api/engineering/sops`
- `/api/engineering/sops/[id]`
- `/api/engineering/sops/[id]/actions`
- `/api/engineering/sops/[id]/run`
- `/api/engineering/sops/dashboard`
- `/api/engineering/sops/reports`
- `/api/engineering/sops/runs`
- `/api/engineering/sops/runs/[runId]`
- `/api/engineering/sops/runs/[runId]/steps/[stepId]`
- `/api/engineering/sops/tasks`
- `/api/engineering/sops/templates`
- `/api/engineering/technical-files`
- `/api/engineering/technical-files/[id]`
- `/api/engineering/technical-files/[id]/download`
- `/api/engineering/technical-files/[id]/versions`
- `/api/engineering/technical-files/[id]/versions/[versionId]/restore`
- `/api/engineering/technical-files/upload/prepare`

### F. Data model

- `public.engineering_technical_files` (migration scan; may be shared)
- `public.engineering_sops` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 18. TRAINING

**Code id:** `training`  
**Maps to user expected-22 label:** TRAINING  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | training-dashboard | 0 |
| Course Builder | course-builder | 0 |
| Courses | — | 3 |

<details><summary>Courses</summary>

- Staff Courses — `training` → /dashboard?view=training
- External Courses — `training-external` → /dashboard?view=training-external
- QMS Courses — `qms-training` → /dashboard?view=qms-training

</details>

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `CourseBuilderWorkspace`
- `ExternalTrainingWorkspace`
- `QmsTrainingWorkspace`

### E. Backend

- `/api/lms/assessment/draw`
- `/api/lms/assessment/submit`
- `/api/lms/assignments`
- `/api/lms/catalog`
- `/api/lms/certificates`
- `/api/lms/certificates/[number]/pdf`
- `/api/lms/certificates/verify`
- `/api/lms/complete`
- `/api/lms/courses`
- `/api/lms/courses/[slug]`
- `/api/lms/courses/[slug]/publish`
- `/api/lms/enrolments`
- `/api/lms/enrolments/[id]/progress`
- `/api/lms/generate-from-document`
- `/api/lms/reporting`

### F. Data model

- `public.lms_courses` (migration scan; may be shared)
- `public.lms_enrolments` (migration scan; may be shared)
- `public.lms_certificates` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 19. QMS

**Code id:** `qms`  
**Maps to user expected-22 label:** QMS  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | quality-management | 0 |
| Document Control | qms-document-control | 0 |
| CAPA | qms-capa | 0 |
| Internal Audits | qms-internal-audits | 0 |
| Management Review | qms-management-review | 0 |
| Reporting | qms-reports | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `QualityManagementWorkspace`
- `DocumentControlWorkspace`
- `CapaWorkspace`
- `InternalAuditsWorkspace`
- `ManagementReviewWorkspace`
- `TqmsReportsWorkspace`

### E. Backend

- NOT ESTABLISHED FROM CODEBASE

### F. Data model

- `public.qa_workspace_tasks` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 20. TOOLS

**Code id:** `tools`  
**Maps to user expected-22 label:** TOOLS  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Website Management | website-management | 0 |
| Integrations | integrations | 0 |
| Testing | testing | 0 |
| Telemetry | telemetry | 0 |
| Users | users | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `WebsiteManagementWorkspace`
- `WorkspaceErrorBoundary`
- `div`
- `TelemetryDashboard`
- `UserManagementWorkspace`

### E. Backend

- `/api/integrations/catalog`
- `/api/integrations/connections`
- `/api/integrations/connections/[providerCode]`
- `/api/integrations/connections/[providerCode]/test`
- `/api/integrations/providers`
- `/api/qa/tasks`
- `/api/qa/tasks/[id]`
- `/api/qa/tasks/export`
- `/api/telemetry`
- `/api/telemetry/records`
- `/api/users`
- `/api/users/[id]`
- `/api/website-analytics/events`
- `/api/website-analytics/refresh`
- `/api/website-analytics/summary`

### F. Data model

- `public.integrations` (migration scan; may be shared)
- `public.telemetry` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 21. EXTERNAL CLIENT ACCESS

**Code id:** `external-client-access`  
**Maps to user expected-22 label:** EXTERNAL MANAGEMENT  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Dashboard | external-client-access | 0 |
| External Users | users-external | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `ExternalUsersWorkspace`

### E. Backend

- `/api/external-users`
- `/api/external-users/[id]`

### F. Data model

- `public.platform_users` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## 22. SETTINGS

**Code id:** `settings`  
**Maps to user expected-22 label:** SETTINGS  

### A. Module

- **Route / entry:** /dashboard (SurveyOperations shell; leaf navigation via ?view=)
- **Main entry component:** `InternalOperationsDashboard`
- **Repository paths:** `src/lib/platform-workspaces/central-product-nav.ts`, `src/lib/internal-operations-data.ts`, `src/components/testflighthub/InternalOperationsDashboard.tsx`, `src/components/testflighthub/SurveyOperationsShell.tsx`, `src/app/(survey-operations)/internaldashboard/page.tsx`
- **Status:** IMPLEMENTED

### B–C. Features & sub-features

| Feature | View / tab | Sub-features |
|---------|------------|-------------|
| Profile | profile | 0 |
| General | settings | 0 |
| Billing | billing | 0 |
| Appearance | appearance | 0 |

### D. UI / routes

Components (from `InternalOperationsDashboard` `activeView` mapping where detected):

- `ProfileWorkspace`
- `AppearanceSettingsWorkspace`

### E. Backend

- `/api/auth/crm-invite-signup`
- `/api/auth/forgot-password`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/reset-password`
- `/api/auth/signup`
- `/api/auth/verify-email`
- `/api/auth/verify-reset-otp`
- `/api/auth/whoami`
- `/api/platform-billing`
- `/api/platform-billing/ensure`
- `/api/users`
- `/api/users/[id]`

### F. Data model

- `public.platform_organisations` (migration scan; may be shared)
- `public.workspace_admin_metadata` (migration scan; may be shared)

### G. Cross-module dependencies

- Reads: NOT ESTABLISHED FROM CODEBASE (exhaustive graph not computed)
- Writes: NOT ESTABLISHED FROM CODEBASE
- Auth: platform-session, operator entitlements, workspace_id scoping

### H. Shared code

- `src/lib/platform-session.ts`
- `src/lib/workspace-context.ts`
- `src/lib/operator-entitlements-server.ts`
- `src/components/testflighthub/SurveyOperationsShell.tsx`
- `src/components/testflighthub/AccessViewGuard.tsx`

### I. Implementation status

Nav/routing: **IMPLEMENTED**. Feature depth varies by view (demo/workspace hosts may hide items via `CUSTOMER_PLATFORM_HIDDEN_VIEWS` / ABHI rules).

---

## REUSABLE UNIT311 ASSETS

- Platform auth (`/api/auth`, `platform-session`)
- Workspace tenancy (`workspace_id`, `platform-workspaces/*`)
- RBAC (`operator-entitlements-server`, `AccessViewGuard`)
- Files (`/api/files`, `internal_files`)
- CRM/clients (`/api/clients`, `/api/crm`)
- Financials (`/api/financials`, GL migrations)
- Sales quotes PDF (`/api/financials/quotes`)
- QMS UI (`src/components/qms/*`)
- Engineering files/SOPs (`/api/engineering`)
- LMS (`/api/lms`)
- Support/WhatsApp (`/api/support`, `/api/whatsapp`)
- Executive Assistant (`/api/executive-assistant`)
- Procurement/logistics (`/api/procurement`)
- Integrations registry

## CORE MODULE BOUNDARIES

### HOME (`home`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** platform_usage_events, strategy_items, internal_operators
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### EXECUTIVE ASSISTANT (`executive-assistant`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** executive_assistant_conversations, executive_assistant_model_usage
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### INTELLIGENCE (`intelligence`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** competitors, strategy_items
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### BUSINESS CENTRAL (`business-central`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** internal_clients, client_onboarding_records, crm_leads, crm_connections, crm_contact_history, internal_work_packages
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### SALES MANAGEMENT (`sales-management`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** sales_teams, sales_team_members, sales_targets, sales_commissions, sales_quotes, sales_quote_line_items, crm_leads
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### FINANCES (`financials`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** accounts, journal_entries, journal_lines, invoices, wise_payment_matches, financial_expenses, treasury_settings
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### FUNDRAISING (`fundraising`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** NOT ESTABLISHED FROM CODEBASE (no dedicated fundraising tables in migration scan)
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### BOARD (`board`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** board_directors
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### CORPORATE INFORMATION (`corporate-information`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** company_details
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### OPERATIONS (`operations`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** procurement_suppliers, procurement_purchase_orders, procurement_requisitions, procurement_goods_receipts
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### MARKETING AND EVENTS (`marketing-events`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** marketing_contacts, marketing_newsletters, marketing_campaigns, marketing_external_events, marketing_managed_events, marketing_stories
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### TECH MGMT (`technology-management`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** system_architecture_diagrams
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### HUMAN RESOURCES (`human-resources`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** hr_employees
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### BUSINESS PROD (`business-productivity`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** NOT ESTABLISHED FROM CODEBASE — verify domain lib + migrations
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### SUPPORT DESK (`support-desk`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** support_tickets, whatsapp_support_sessions, support_lounge_messages
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### PROJECT MANAGEMENT (`project-management`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** internal_projects, internal_project_tasks
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### ENGINEERING (`engineering`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** engineering_technical_files, engineering_sops
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### TRAINING (`training`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** lms_courses, lms_enrolments, lms_certificates
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### QMS (`qms`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** qa_workspace_tasks
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### TOOLS (`tools`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** integrations, telemetry
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### EXTERNAL CLIENT ACCESS (`external-client-access`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** platform_users
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

### SETTINGS (`settings`)

- **Owns:** Catalogue nav leaves / view ids for this module.
- **Data:** platform_organisations, workspace_admin_metadata
- **Depends on:** Auth, workspace shell.
- **Depended on by:** NOT ESTABLISHED FROM CODEBASE

## Final summary

1. **Core modules found:** 22
2. **Features found:** 109
3. **Sub-features found:** 62
4. **Distinct catalogue view IDs:** 128
5. **API route handlers:** 366
6. **Tables (migration scan):** 162
7. **Shared:** platform-session, workspace-context, entitlements, SurveyOperationsShell, InternalOperationsDashboard
8. **Discrepancies:**
   - Catalogue module #3 is INTELLIGENCE (id: intelligence); user expected-22 list has no Intelligence slot.
   - User EXTERNAL MANAGEMENT → code EXTERNAL CLIENT ACCESS (id: external-client-access).
   - User ASSETS, INVENTORY & LOGISTICS is not a top-level catalogue module; sub-areas under OPERATIONS.
   - CANONICAL_MODULES adds optional funds and portfolio-companies beyond the 22-module Workspaces catalogue.
   - Catalogue labels: MARKETING AND EVENTS, TECH MGMT, BUSINESS PROD vs user long names.
   - INTELLIGENCE occupies catalogue slot #3; user list item #3 is BUSINESS CENTRAL in the expected list.
9. **Ambiguous:** Server Actions enumeration; exact per-feature API/table ownership; full dependency graph.

## Module → features → sub-features (counts)

| Core module | Features | Sub-features |
|-------------|----------|-------------|
| HOME | 1 | 0 |
| EXECUTIVE ASSISTANT | 1 | 0 |
| INTELLIGENCE | 3 | 0 |
| BUSINESS CENTRAL | 5 | 7 |
| SALES MANAGEMENT | 4 | 14 |
| FINANCES | 8 | 28 |
| FUNDRAISING | 7 | 0 |
| BOARD | 6 | 0 |
| CORPORATE INFORMATION | 6 | 0 |
| OPERATIONS | 5 | 0 |
| MARKETING AND EVENTS | 7 | 0 |
| TECH MGMT | 6 | 0 |
| HUMAN RESOURCES | 8 | 0 |
| BUSINESS PROD | 9 | 3 |
| SUPPORT DESK | 4 | 0 |
| PROJECT MANAGEMENT | 3 | 0 |
| ENGINEERING | 6 | 7 |
| TRAINING | 3 | 3 |
| QMS | 6 | 0 |
| TOOLS | 5 | 0 |
| EXTERNAL CLIENT ACCESS | 2 | 0 |
| SETTINGS | 4 | 0 |
