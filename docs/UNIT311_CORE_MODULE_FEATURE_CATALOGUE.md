# Unit311 Core Module Feature Catalogue

Read-only extraction of the **current central product navigation hierarchy** (Core modules 1–22). Generated `2026-09-26T16:03:45.448Z`.

**Primary source:** `buildCentralProductNavSections()` in `src/lib/platform-workspaces/central-product-nav.ts` (modules with `id` not prefixed `wolf-`).

**View routing:** `InternalOperationsDashboard.tsx` (`activeView` / `?view=`).

---

## Summary table

| # | Core Module | Code Name | Feature Count | Sub-feature Count |
|---|-------------|-----------|---------------|-------------------|
| 1 | HOME | `home` | 1 | 0 |
| 2 | EXECUTIVE ASSISTANT | `executive-assistant` | 1 | 0 |
| 3 | INTELLIGENCE | `intelligence` | 4 | 0 |
| 4 | BUSINESS CENTRAL | `business-central` | 4 | 6 |
| 5 | SALES MANAGEMENT | `sales-management` | 4 | 14 |
| 6 | FINANCES | `financials` | 8 | 28 |
| 7 | FUNDRAISING | `fundraising` | 7 | 0 |
| 8 | BOARD | `board` | 6 | 0 |
| 9 | CORPORATE INFORMATION | `corporate-information` | 6 | 0 |
| 10 | OPERATIONS | `operations` | 5 | 0 |
| 11 | MARKETING AND EVENTS | `marketing-events` | 7 | 0 |
| 12 | TECH MGMT | `technology-management` | 6 | 0 |
| 13 | HUMAN RESOURCES | `human-resources` | 8 | 0 |
| 14 | BUSINESS PROD | `business-productivity` | 9 | 3 |
| 15 | SUPPORT DESK | `support-desk` | 4 | 0 |
| 16 | PROJECT MANAGEMENT | `project-management` | 3 | 0 |
| 17 | ENGINEERING | `engineering` | 6 | 7 |
| 18 | TRAINING | `training` | 3 | 3 |
| 19 | QMS | `qms` | 6 | 0 |
| 20 | TOOLS | `tools` | 6 | 0 |
| 21 | EXTERNAL CLIENT ACCESS | `external-client-access` | 2 | 0 |
| 22 | SETTINGS | `settings` | 4 | 0 |

---

## 1. HOME

### MODULE

- **Display name (catalogue):** HOME
- **Sidebar section label:** HOME (pin — label on item)
- **Code / module id:** `home`
- **Section kind:** pin
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (pinSection)

### FEATURES

#### 1. HOME

- **Parent module:** HOME (`home`)
- **Feature order:** 1
- **View ID:** home
- **Route:** /dashboard?view=home
- **Navigation type:** page
- **Leaf / provisioning id:** `home`
- **Provisioning key:** `home:home`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 2. EXECUTIVE ASSISTANT

### MODULE

- **Display name (catalogue):** EXECUTIVE ASSISTANT
- **Sidebar section label:** EXECUTIVE ASSISTANT (pin — label on item)
- **Code / module id:** `executive-assistant`
- **Section kind:** pin
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (pinSection)
- **Conditional flag:** `EXECUTIVE_ASSISTANT_VISIBLE` = `true` (when false, pin omitted from `internalSurveyNavSections` but still in central catalogue)

### FEATURES

#### 1. EXECUTIVE ASSISTANT

- **Parent module:** EXECUTIVE ASSISTANT (`executive-assistant`)
- **Feature order:** 1
- **View ID:** executive-assistant
- **Route:** /dashboard?view=executive-assistant
- **Navigation type:** page
- **Leaf / provisioning id:** `executive-assistant`
- **Provisioning key:** `executive-assistant:executive-assistant`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 3. INTELLIGENCE

### MODULE

- **Display name (catalogue):** INTELLIGENCE
- **Sidebar section label:** Intelligence 
- **Code / module id:** `intelligence`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralIntelligenceNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** INTELLIGENCE (`intelligence`)
- **Feature order:** 1
- **View ID:** intelligence-dashboard
- **Route:** /dashboard?view=intelligence-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `intelligence-dashboard`
- **Provisioning key:** `intelligence:intelligence-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Company Intelligence

- **Parent module:** INTELLIGENCE (`intelligence`)
- **Feature order:** 2
- **View ID:** demo-company-intelligence
- **Route:** /dashboard?view=demo-company-intelligence
- **Navigation type:** page
- **Leaf / provisioning id:** `demo-company-intelligence`
- **Provisioning key:** `intelligence:demo-company-intelligence`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Client Intelligence

- **Parent module:** INTELLIGENCE (`intelligence`)
- **Feature order:** 3
- **View ID:** demo-client-intelligence
- **Route:** /dashboard?view=demo-client-intelligence
- **Navigation type:** page
- **Leaf / provisioning id:** `demo-client-intelligence`
- **Provisioning key:** `intelligence:demo-client-intelligence`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Market Intelligence

- **Parent module:** INTELLIGENCE (`intelligence`)
- **Feature order:** 4
- **View ID:** demo-market-intelligence
- **Route:** /dashboard?view=demo-market-intelligence
- **Navigation type:** page
- **Leaf / provisioning id:** `demo-market-intelligence`
- **Provisioning key:** `intelligence:demo-market-intelligence`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 4. BUSINESS CENTRAL

### MODULE

- **Display name (catalogue):** BUSINESS CENTRAL
- **Sidebar section label:** Business Central 
- **Code / module id:** `business-central`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralBusinessCentralNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** BUSINESS CENTRAL (`business-central`)
- **Feature order:** 1
- **View ID:** business-central-dashboard
- **Route:** /dashboard?view=business-central-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `business-central-dashboard`
- **Provisioning key:** `business-central:business-central-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Client Management

- **Parent module:** BUSINESS CENTRAL (`business-central`)
- **Feature order:** 2
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Client Management)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Client Dashboard | `clients-dashboard` | /dashboard?view=clients-dashboard | page | `clients-dashboard` |
| 2 | Client Directory | `clients` | /dashboard?view=clients | page | `clients` |

#### 3. Management

- **Parent module:** BUSINESS CENTRAL (`business-central`)
- **Feature order:** 3
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Management)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Management Dashboard | `management` | /dashboard?view=management | page | `management` |
| 2 | Meetings | `management` | /dashboard?view=management&section=meetings | section (query param `section`) | `management-section-meetings` |
| 3 | Function Packs | `management` | /dashboard?view=management&section=function-packs | section (query param `section`) | `management-section-function-packs` |
| 4 | Actions & Decisions | `management` | /dashboard?view=management&section=actions-decisions | section (query param `section`) | `management-section-actions-decisions` |

#### 4. Information Repository

- **Parent module:** BUSINESS CENTRAL (`business-central`)
- **Feature order:** 4
- **View ID:** information-repository
- **Route:** /dashboard?view=information-repository
- **Navigation type:** page
- **Leaf / provisioning id:** `information-repository`
- **Provisioning key:** `business-central:information-repository`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 5. SALES MANAGEMENT

### MODULE

- **Display name (catalogue):** SALES MANAGEMENT
- **Sidebar section label:** Sales Management 
- **Code / module id:** `sales-management`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** sales-management-nav.ts (buildSalesManagementNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** SALES MANAGEMENT (`sales-management`)
- **Feature order:** 1
- **View ID:** sales-management
- **Route:** /dashboard?view=sales-management&tab=dashboard
- **Navigation type:** tab (query param `tab`)
- **Leaf / provisioning id:** `sales-management-tab-dashboard`
- **Provisioning key:** `sales-management:sales-management-tab-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Overview

- **Parent module:** SALES MANAGEMENT (`sales-management`)
- **Feature order:** 2
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Overview)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | My Sales | `sales-management` | /dashboard?view=sales-management&tab=my-sales | tab (query param `tab`) | `sales-management-tab-my-sales` |
| 2 | Sales Team | `sales-management` | /dashboard?view=sales-management&tab=sales-team | tab (query param `tab`) | `sales-management-tab-sales-team` |

#### 3. Management

- **Parent module:** SALES MANAGEMENT (`sales-management`)
- **Feature order:** 3
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Management)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Targets & Forecast | `sales-management` | /dashboard?view=sales-management&tab=targets | tab (query param `tab`) | `sales-management-tab-targets` |
| 2 | Performance | `sales-management` | /dashboard?view=sales-management&tab=performance | tab (query param `tab`) | `sales-management-tab-performance` |
| 3 | Forecast | `sales-management` | /dashboard?view=sales-management&tab=forecast | tab (query param `tab`) | `sales-management-tab-forecast` |
| 4 | Commissions | `sales-management` | /dashboard?view=sales-management&tab=commissions | tab (query param `tab`) | `sales-management-tab-commissions` |
| 5 | Reports | `sales-management` | /dashboard?view=sales-management&tab=reports | tab (query param `tab`) | `sales-management-tab-reports` |

#### 4. Sales

- **Parent module:** SALES MANAGEMENT (`sales-management`)
- **Feature order:** 4
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Sales)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Prospects | `sales-management` | /dashboard?view=sales-management&tab=prospects | tab (query param `tab`) | `sales-management-tab-prospects` |
| 2 | Opportunities | `sales-management` | /dashboard?view=sales-management&tab=opportunities | tab (query param `tab`) | `sales-management-tab-opportunities` |
| 3 | Pipeline | `sales-management` | /dashboard?view=sales-management&tab=pipeline | tab (query param `tab`) | `sales-management-tab-pipeline` |
| 4 | Discovery | `sales-management` | /dashboard?view=sales-management&tab=discovery | tab (query param `tab`) | `sales-management-tab-discovery` |
| 5 | Activities | `sales-management` | /dashboard?view=sales-management&tab=activities | tab (query param `tab`) | `sales-management-tab-activities` |
| 6 | Sales Quotes | `sales-management` | /dashboard?view=sales-management&tab=sales-quotes | tab (query param `tab`) | `sales-management-tab-sales-quotes` |
| 7 | Partners | `sales-management` | /dashboard?view=sales-management&tab=partners | tab (query param `tab`) | `sales-management-tab-partners` |

---

## 6. FINANCES

### MODULE

- **Display name (catalogue):** FINANCES
- **Sidebar section label:** Finances 
- **Code / module id:** `financials`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** finances-nav.ts (buildFinancesNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 1
- **View ID:** financials
- **Route:** /dashboard?view=financials
- **Navigation type:** page
- **Leaf / provisioning id:** `financials`
- **Provisioning key:** `financials:financials`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. General Ledger

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 2
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (General Ledger)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Chart of Accounts | `general-ledger` | /dashboard?view=general-ledger&tab=accounts | tab (query param `tab`) | `general-ledger-tab-accounts` |
| 2 | Trial Balance | `general-ledger` | /dashboard?view=general-ledger&tab=trial | tab (query param `tab`) | `general-ledger-tab-trial` |
| 3 | Journals | `general-ledger` | /dashboard?view=general-ledger&tab=journal | tab (query param `tab`) | `general-ledger-tab-journal` |

#### 3. Accounts Receivable

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 3
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Accounts Receivable)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Invoices | `accounts-receivable` | /dashboard?view=accounts-receivable | page | `accounts-receivable` |
| 2 | Outstanding | `accounts-receivable` | /dashboard?view=accounts-receivable&filter=outstanding | filter (query param `filter`) | `accounts-receivable-filter-outstanding` |
| 3 | Overdue | `accounts-receivable` | /dashboard?view=accounts-receivable&filter=overdue | filter (query param `filter`) | `accounts-receivable-filter-overdue` |
| 4 | Collections | `finances-ar-collections` | /dashboard?view=finances-ar-collections | page | `finances-ar-collections` |
| 5 | AR Reporting | `finances-ar-reporting` | /dashboard?view=finances-ar-reporting | page | `finances-ar-reporting` |

#### 4. Accounts Payable

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 4
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Accounts Payable)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Supplier Invoices | `accounts-payable` | /dashboard?view=accounts-payable&section=invoices | section (query param `section`) | `accounts-payable-section-invoices` |
| 2 | Approvals | `accounts-payable` | /dashboard?view=accounts-payable&section=approvals | section (query param `section`) | `accounts-payable-section-approvals` |
| 3 | Outstanding | `accounts-payable` | /dashboard?view=accounts-payable&section=outstanding | section (query param `section`) | `accounts-payable-section-outstanding` |
| 4 | Due Dates | `accounts-payable` | /dashboard?view=accounts-payable&section=due-dates | section (query param `section`) | `accounts-payable-section-due-dates` |
| 5 | Payments | `finances-ap-payments` | /dashboard?view=finances-ap-payments | page | `finances-ap-payments` |

#### 5. Expenses

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 5
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Expenses)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | My Expenses | `expenses` | /dashboard?view=expenses | page | `expenses` |
| 2 | Add Expense | `expenses` | /dashboard?view=expenses&section=add | section (query param `section`) | `expenses-section-add` |
| 3 | All Expenses | `expenses` | /dashboard?view=expenses&section=all | section (query param `section`) | `expenses-section-all` |
| 4 | Approvals | `expenses` | /dashboard?view=expenses&section=approvals | section (query param `section`) | `expenses-section-approvals` |
| 5 | Expense Runs | `expenses` | /dashboard?view=expenses&section=runs | section (query param `section`) | `expenses-section-runs` |
| 6 | Configuration | `expenses` | /dashboard?view=expenses&section=config | section (query param `section`) | `expenses-section-config` |

#### 6. Banking & Cash

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 6
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Banking & Cash)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Bank | `wise` | /dashboard?view=wise | page | `wise` |
| 2 | Cash Position | `finances-banking-cash-position` | /dashboard?view=finances-banking-cash-position | page | `finances-banking-cash-position` |
| 3 | Reconciliation | `finances-banking-reconciliation` | /dashboard?view=finances-banking-reconciliation | page | `finances-banking-reconciliation` |

#### 7. Planning & Management

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 7
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Planning & Management)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Budget | `finances-planning-budget` | /dashboard?view=finances-planning-budget | page | `finances-planning-budget` |
| 2 | Actual vs Budget | `finances-planning-actual-vs-budget` | /dashboard?view=finances-planning-actual-vs-budget | page | `finances-planning-actual-vs-budget` |
| 3 | Cash Flow | `finances-planning-cash-flow` | /dashboard?view=finances-planning-cash-flow | page | `finances-planning-cash-flow` |
| 4 | Forecast | `finances-planning-forecast` | /dashboard?view=finances-planning-forecast | page | `finances-planning-forecast` |
| 5 | KPIs | `finances-planning-kpis` | /dashboard?view=finances-planning-kpis | page | `finances-planning-kpis` |
| 6 | Management Accounts | `finances-planning-management-accounts` | /dashboard?view=finances-planning-management-accounts | page | `finances-planning-management-accounts` |

#### 8. Financial Reports

- **Parent module:** FINANCES (`financials`)
- **Feature order:** 8
- **View ID:** financial-reports
- **Route:** /dashboard?view=financial-reports
- **Navigation type:** page
- **Leaf / provisioning id:** `financial-reports`
- **Provisioning key:** `financials:financial-reports`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 7. FUNDRAISING

### MODULE

- **Display name (catalogue):** FUNDRAISING
- **Sidebar section label:** Fundraising 
- **Code / module id:** `fundraising`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralFundraisingNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** FUNDRAISING (`fundraising`)
- **Feature order:** 1
- **View ID:** fundraising-dashboard
- **Route:** /dashboard?view=fundraising-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `fundraising-dashboard`
- **Provisioning key:** `fundraising:fundraising-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Investors

- **Parent module:** FUNDRAISING (`fundraising`)
- **Feature order:** 2
- **View ID:** fundraising-investors
- **Route:** /dashboard?view=fundraising-investors
- **Navigation type:** page
- **Leaf / provisioning id:** `fundraising-investors`
- **Provisioning key:** `fundraising:fundraising-investors`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Cap Table Management

- **Parent module:** FUNDRAISING (`fundraising`)
- **Feature order:** 3
- **View ID:** fundraising-cap-table
- **Route:** /dashboard?view=fundraising-cap-table
- **Navigation type:** page
- **Leaf / provisioning id:** `fundraising-cap-table`
- **Provisioning key:** `fundraising:fundraising-cap-table`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Pipeline

- **Parent module:** FUNDRAISING (`fundraising`)
- **Feature order:** 4
- **View ID:** fundraising-pipeline
- **Route:** /dashboard?view=fundraising-pipeline
- **Navigation type:** page
- **Leaf / provisioning id:** `fundraising-pipeline`
- **Provisioning key:** `fundraising:fundraising-pipeline`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Meetings

- **Parent module:** FUNDRAISING (`fundraising`)
- **Feature order:** 5
- **View ID:** fundraising-meetings
- **Route:** /dashboard?view=fundraising-meetings
- **Navigation type:** page
- **Leaf / provisioning id:** `fundraising-meetings`
- **Provisioning key:** `fundraising:fundraising-meetings`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Pitch Decks

- **Parent module:** FUNDRAISING (`fundraising`)
- **Feature order:** 6
- **View ID:** fundraising-pitch-decks
- **Route:** /dashboard?view=fundraising-pitch-decks
- **Navigation type:** page
- **Leaf / provisioning id:** `fundraising-pitch-decks`
- **Provisioning key:** `fundraising:fundraising-pitch-decks`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 7. Data Rooms

- **Parent module:** FUNDRAISING (`fundraising`)
- **Feature order:** 7
- **View ID:** fundraising-data-rooms
- **Route:** /dashboard?view=fundraising-data-rooms
- **Navigation type:** page
- **Leaf / provisioning id:** `fundraising-data-rooms`
- **Provisioning key:** `fundraising:fundraising-data-rooms`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 8. BOARD

### MODULE

- **Display name (catalogue):** BOARD
- **Sidebar section label:** Board 
- **Code / module id:** `board`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralBoardNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** BOARD (`board`)
- **Feature order:** 1
- **View ID:** board-dashboard
- **Route:** /dashboard?view=board-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `board-dashboard`
- **Provisioning key:** `board:board-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Meetings

- **Parent module:** BOARD (`board`)
- **Feature order:** 2
- **View ID:** board-meetings
- **Route:** /dashboard?view=board-meetings
- **Navigation type:** page
- **Leaf / provisioning id:** `board-meetings`
- **Provisioning key:** `board:board-meetings`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Minutes & Decisions

- **Parent module:** BOARD (`board`)
- **Feature order:** 3
- **View ID:** board-minutes
- **Route:** /dashboard?view=board-minutes
- **Navigation type:** page
- **Leaf / provisioning id:** `board-minutes`
- **Provisioning key:** `board:board-minutes`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Board Members

- **Parent module:** BOARD (`board`)
- **Feature order:** 4
- **View ID:** board-members
- **Route:** /dashboard?view=board-members
- **Navigation type:** page
- **Leaf / provisioning id:** `board-members`
- **Provisioning key:** `board:board-members`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Board deck

- **Parent module:** BOARD (`board`)
- **Feature order:** 5
- **View ID:** board-pack
- **Route:** /dashboard?view=board-pack
- **Navigation type:** page
- **Leaf / provisioning id:** `board-pack`
- **Provisioning key:** `board:board-pack`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Risk Register

- **Parent module:** BOARD (`board`)
- **Feature order:** 6
- **View ID:** corporate-risk-register
- **Route:** /dashboard?view=corporate-risk-register
- **Navigation type:** page
- **Leaf / provisioning id:** `corporate-risk-register`
- **Provisioning key:** `board:corporate-risk-register`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 9. CORPORATE INFORMATION

### MODULE

- **Display name (catalogue):** CORPORATE INFORMATION
- **Sidebar section label:** Corporate Information 
- **Code / module id:** `corporate-information`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralCorporateInformationNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** CORPORATE INFORMATION (`corporate-information`)
- **Feature order:** 1
- **View ID:** corporate-dashboard
- **Route:** /dashboard?view=corporate-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `corporate-dashboard`
- **Provisioning key:** `corporate-information:corporate-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Company Information

- **Parent module:** CORPORATE INFORMATION (`corporate-information`)
- **Feature order:** 2
- **View ID:** corporate-company-details
- **Route:** /dashboard?view=corporate-company-details
- **Navigation type:** page
- **Leaf / provisioning id:** `corporate-company-details`
- **Provisioning key:** `corporate-information:corporate-company-details`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Office Locations

- **Parent module:** CORPORATE INFORMATION (`corporate-information`)
- **Feature order:** 3
- **View ID:** office-locations
- **Route:** /dashboard?view=office-locations
- **Navigation type:** page
- **Leaf / provisioning id:** `office-locations`
- **Provisioning key:** `corporate-information:office-locations`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Bank Accounts

- **Parent module:** CORPORATE INFORMATION (`corporate-information`)
- **Feature order:** 4
- **View ID:** corporate-bank-accounts
- **Route:** /dashboard?view=corporate-bank-accounts
- **Navigation type:** page
- **Leaf / provisioning id:** `corporate-bank-accounts`
- **Provisioning key:** `corporate-information:corporate-bank-accounts`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Professional Advisors

- **Parent module:** CORPORATE INFORMATION (`corporate-information`)
- **Feature order:** 5
- **View ID:** corporate-advisers
- **Route:** /dashboard?view=corporate-advisers
- **Navigation type:** page
- **Leaf / provisioning id:** `corporate-advisers`
- **Provisioning key:** `corporate-information:corporate-advisers`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Contracts

- **Parent module:** CORPORATE INFORMATION (`corporate-information`)
- **Feature order:** 6
- **View ID:** corporate-contracts
- **Route:** /dashboard?view=corporate-contracts
- **Navigation type:** page
- **Leaf / provisioning id:** `corporate-contracts`
- **Provisioning key:** `corporate-information:corporate-contracts`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 10. OPERATIONS

### MODULE

- **Display name (catalogue):** OPERATIONS
- **Sidebar section label:** Operations 
- **Code / module id:** `operations`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('Operations')

### FEATURES

#### 1. Dashboard

- **Parent module:** OPERATIONS (`operations`)
- **Feature order:** 1
- **View ID:** operations-dashboard
- **Route:** /dashboard?view=operations-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `operations-dashboard`
- **Provisioning key:** `operations:operations-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Assets

- **Parent module:** OPERATIONS (`operations`)
- **Feature order:** 2
- **View ID:** assets
- **Route:** /dashboard?view=assets
- **Navigation type:** page
- **Leaf / provisioning id:** `assets`
- **Provisioning key:** `operations:assets`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Inventory

- **Parent module:** OPERATIONS (`operations`)
- **Feature order:** 3
- **View ID:** inventory-management
- **Route:** /dashboard?view=inventory-management
- **Navigation type:** page
- **Leaf / provisioning id:** `inventory-management`
- **Provisioning key:** `operations:inventory-management`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Procurement

- **Parent module:** OPERATIONS (`operations`)
- **Feature order:** 4
- **View ID:** procurement
- **Route:** /dashboard?view=procurement
- **Navigation type:** page
- **Leaf / provisioning id:** `procurement`
- **Provisioning key:** `operations:procurement`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Logistics

- **Parent module:** OPERATIONS (`operations`)
- **Feature order:** 5
- **View ID:** logistics
- **Route:** /dashboard?view=logistics
- **Navigation type:** page
- **Leaf / provisioning id:** `logistics`
- **Provisioning key:** `operations:logistics`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 11. MARKETING AND EVENTS

### MODULE

- **Display name (catalogue):** MARKETING AND EVENTS
- **Sidebar section label:** Marketing & Events 
- **Code / module id:** `marketing-events`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralMarketingEventsNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** MARKETING AND EVENTS (`marketing-events`)
- **Feature order:** 1
- **View ID:** oa-marketing-dashboard
- **Route:** /dashboard?view=oa-marketing-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `oa-marketing-dashboard`
- **Provisioning key:** `marketing-events:oa-marketing-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Digital Newsletter

- **Parent module:** MARKETING AND EVENTS (`marketing-events`)
- **Feature order:** 2
- **View ID:** marketing-newsletter
- **Route:** /dashboard?view=marketing-newsletter
- **Navigation type:** page
- **Leaf / provisioning id:** `marketing-newsletter`
- **Provisioning key:** `marketing-events:marketing-newsletter`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. External Events

- **Parent module:** MARKETING AND EVENTS (`marketing-events`)
- **Feature order:** 3
- **View ID:** marketing-events
- **Route:** /dashboard?view=marketing-events
- **Navigation type:** page
- **Leaf / provisioning id:** `marketing-events`
- **Provisioning key:** `marketing-events:marketing-events`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Event Management

- **Parent module:** MARKETING AND EVENTS (`marketing-events`)
- **Feature order:** 4
- **View ID:** marketing-event-management
- **Route:** /dashboard?view=marketing-event-management
- **Navigation type:** page
- **Leaf / provisioning id:** `marketing-event-management`
- **Provisioning key:** `marketing-events:marketing-event-management`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Mailing List

- **Parent module:** MARKETING AND EVENTS (`marketing-events`)
- **Feature order:** 5
- **View ID:** marketing-mailing-list
- **Route:** /dashboard?view=marketing-mailing-list
- **Navigation type:** page
- **Leaf / provisioning id:** `marketing-mailing-list`
- **Provisioning key:** `marketing-events:marketing-mailing-list`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Client Stories

- **Parent module:** MARKETING AND EVENTS (`marketing-events`)
- **Feature order:** 6
- **View ID:** portfolio-stories
- **Route:** /dashboard?view=portfolio-stories
- **Navigation type:** page
- **Leaf / provisioning id:** `portfolio-stories`
- **Provisioning key:** `marketing-events:portfolio-stories`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 7. Social

- **Parent module:** MARKETING AND EVENTS (`marketing-events`)
- **Feature order:** 7
- **View ID:** social
- **Route:** /dashboard?view=social
- **Navigation type:** page
- **Leaf / provisioning id:** `social`
- **Provisioning key:** `marketing-events:social`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 12. TECH MGMT

### MODULE

- **Display name (catalogue):** TECH MGMT
- **Sidebar section label:** Technology Management 
- **Code / module id:** `technology-management`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('Technology Management')

### FEATURES

#### 1. Dashboard

- **Parent module:** TECH MGMT (`technology-management`)
- **Feature order:** 1
- **View ID:** technology-dashboard
- **Route:** /dashboard?view=technology-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `technology-dashboard`
- **Provisioning key:** `technology-management:technology-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Architecture Diagrams

- **Parent module:** TECH MGMT (`technology-management`)
- **Feature order:** 2
- **View ID:** technology-architecture
- **Route:** /dashboard?view=technology-architecture
- **Navigation type:** page
- **Leaf / provisioning id:** `technology-architecture`
- **Provisioning key:** `technology-management:technology-architecture`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Technology Assets

- **Parent module:** TECH MGMT (`technology-management`)
- **Feature order:** 3
- **View ID:** technology-devices
- **Route:** /dashboard?view=technology-devices
- **Navigation type:** page
- **Leaf / provisioning id:** `technology-devices`
- **Provisioning key:** `technology-management:technology-devices`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Software & SaaS Dashboard

- **Parent module:** TECH MGMT (`technology-management`)
- **Feature order:** 4
- **View ID:** technology-software-dashboard
- **Route:** /dashboard?view=technology-software-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `technology-software-dashboard`
- **Provisioning key:** `technology-management:technology-software-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Software & SaaS

- **Parent module:** TECH MGMT (`technology-management`)
- **Feature order:** 5
- **View ID:** technology-software
- **Route:** /dashboard?view=technology-software
- **Navigation type:** page
- **Leaf / provisioning id:** `technology-software`
- **Provisioning key:** `technology-management:technology-software`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Telecommunications

- **Parent module:** TECH MGMT (`technology-management`)
- **Feature order:** 6
- **View ID:** technology-telecommunications
- **Route:** /dashboard?view=technology-telecommunications
- **Navigation type:** page
- **Leaf / provisioning id:** `technology-telecommunications`
- **Provisioning key:** `technology-management:technology-telecommunications`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 13. HUMAN RESOURCES

### MODULE

- **Display name (catalogue):** HUMAN RESOURCES
- **Sidebar section label:** Human Resources 
- **Code / module id:** `human-resources`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('Human Resources')

### FEATURES

#### 1. Dashboard

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 1
- **View ID:** hr-dashboard
- **Route:** /dashboard?view=hr-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `hr-dashboard`
- **Provisioning key:** `human-resources:hr-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Employees

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 2
- **View ID:** hr
- **Route:** /dashboard?view=hr
- **Navigation type:** page
- **Leaf / provisioning id:** `hr`
- **Provisioning key:** `human-resources:hr`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Org Chart

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 3
- **View ID:** hr-org-chart
- **Route:** /dashboard?view=hr-org-chart
- **Navigation type:** page
- **Leaf / provisioning id:** `hr-org-chart`
- **Provisioning key:** `human-resources:hr-org-chart`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Recruitment

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 4
- **View ID:** hr-recruitment
- **Route:** /dashboard?view=hr-recruitment
- **Navigation type:** page
- **Leaf / provisioning id:** `hr-recruitment`
- **Provisioning key:** `human-resources:hr-recruitment`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Time & Attendance

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 5
- **View ID:** hr-leave
- **Route:** /dashboard?view=hr-leave
- **Navigation type:** page
- **Leaf / provisioning id:** `hr-leave`
- **Provisioning key:** `human-resources:hr-leave`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Payroll

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 6
- **View ID:** hr-payroll
- **Route:** /dashboard?view=hr-payroll
- **Navigation type:** page
- **Leaf / provisioning id:** `hr-payroll`
- **Provisioning key:** `human-resources:hr-payroll`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 7. Performance

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 7
- **View ID:** hr-performance
- **Route:** /dashboard?view=hr-performance
- **Navigation type:** page
- **Leaf / provisioning id:** `hr-performance`
- **Provisioning key:** `human-resources:hr-performance`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 8. HR Reports

- **Parent module:** HUMAN RESOURCES (`human-resources`)
- **Feature order:** 8
- **View ID:** hr-reports
- **Route:** /dashboard?view=hr-reports
- **Navigation type:** page
- **Leaf / provisioning id:** `hr-reports`
- **Provisioning key:** `human-resources:hr-reports`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 14. BUSINESS PROD

### MODULE

- **Display name (catalogue):** BUSINESS PROD
- **Sidebar section label:** Business Productivity 
- **Code / module id:** `business-productivity`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralBusinessProductivityNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 1
- **View ID:** productivity-dashboard
- **Route:** /dashboard?view=productivity-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `productivity-dashboard`
- **Provisioning key:** `business-productivity:productivity-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Content Studio

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 2
- **View ID:** content-studio
- **Route:** /dashboard?view=content-studio
- **Navigation type:** page
- **Leaf / provisioning id:** `content-studio`
- **Provisioning key:** `business-productivity:content-studio`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Internal Work Packages

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 3
- **View ID:** internal-work-packages
- **Route:** /dashboard?view=internal-work-packages
- **Navigation type:** page
- **Leaf / provisioning id:** `internal-work-packages`
- **Provisioning key:** `business-productivity:internal-work-packages`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. File Explorer

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 4
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (File Explorer)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Internal Files | `files-internal` | /dashboard?view=files-internal | page | `files-internal` |
| 2 | External Files | `files-external` | /dashboard?view=files-external | page | `files-external` |
| 3 | Client Explorer | `files-client` | /dashboard?view=files-client | page | `files-client` |

#### 5. Email

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 5
- **View ID:** info-email
- **Route:** /dashboard?view=info-email
- **Navigation type:** page
- **Leaf / provisioning id:** `info-email`
- **Provisioning key:** `business-productivity:info-email`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Calendar

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 6
- **View ID:** calendar
- **Route:** /dashboard?view=calendar
- **Navigation type:** page
- **Leaf / provisioning id:** `calendar`
- **Provisioning key:** `business-productivity:calendar`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 7. Messaging

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 7
- **View ID:** messaging
- **Route:** /dashboard?view=messaging
- **Navigation type:** page
- **Leaf / provisioning id:** `messaging`
- **Provisioning key:** `business-productivity:messaging`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 8. Communications

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 8
- **View ID:** communications
- **Route:** /dashboard?view=communications
- **Navigation type:** page
- **Leaf / provisioning id:** `communications`
- **Provisioning key:** `business-productivity:communications`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 9. Whiteboard

- **Parent module:** BUSINESS PROD (`business-productivity`)
- **Feature order:** 9
- **View ID:** whiteboard
- **Route:** /dashboard?view=whiteboard
- **Navigation type:** page
- **Leaf / provisioning id:** `whiteboard`
- **Provisioning key:** `business-productivity:whiteboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 15. SUPPORT DESK

### MODULE

- **Display name (catalogue):** SUPPORT DESK
- **Sidebar section label:** Support Desk 
- **Code / module id:** `support-desk`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('Support Desk')

### FEATURES

#### 1. Ticket Overview

- **Parent module:** SUPPORT DESK (`support-desk`)
- **Feature order:** 1
- **View ID:** support-overview
- **Route:** /dashboard?view=support-overview
- **Navigation type:** page
- **Leaf / provisioning id:** `support-overview`
- **Provisioning key:** `support-desk:support-overview`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Tickets

- **Parent module:** SUPPORT DESK (`support-desk`)
- **Feature order:** 2
- **View ID:** support
- **Route:** /dashboard?view=support
- **Navigation type:** page
- **Leaf / provisioning id:** `support`
- **Provisioning key:** `support-desk:support`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. My support tickets

- **Parent module:** SUPPORT DESK (`support-desk`)
- **Feature order:** 3
- **View ID:** support-mine
- **Route:** /dashboard?view=support-mine
- **Navigation type:** page
- **Leaf / provisioning id:** `support-mine`
- **Provisioning key:** `support-desk:support-mine`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. WhatsApp Integration

- **Parent module:** SUPPORT DESK (`support-desk`)
- **Feature order:** 4
- **View ID:** whatsapp-integration
- **Route:** /dashboard?view=whatsapp-integration
- **Navigation type:** page
- **Leaf / provisioning id:** `whatsapp-integration`
- **Provisioning key:** `support-desk:whatsapp-integration`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 16. PROJECT MANAGEMENT

### MODULE

- **Display name (catalogue):** PROJECT MANAGEMENT
- **Sidebar section label:** Project Management 
- **Code / module id:** `project-management`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** project-management-nav.ts (buildProjectManagementNavSection)

### FEATURES

#### 1. Dashboard

- **Parent module:** PROJECT MANAGEMENT (`project-management`)
- **Feature order:** 1
- **View ID:** projects-dashboard
- **Route:** /dashboard?view=projects-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `projects-dashboard`
- **Provisioning key:** `project-management:projects-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Internal Projects

- **Parent module:** PROJECT MANAGEMENT (`project-management`)
- **Feature order:** 2
- **View ID:** projects-internal
- **Route:** /dashboard?view=projects-internal
- **Navigation type:** page
- **Leaf / provisioning id:** `projects-internal`
- **Provisioning key:** `project-management:projects-internal`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. External Projects

- **Parent module:** PROJECT MANAGEMENT (`project-management`)
- **Feature order:** 3
- **View ID:** projects-external
- **Route:** /dashboard?view=projects-external
- **Navigation type:** page
- **Leaf / provisioning id:** `projects-external`
- **Provisioning key:** `project-management:projects-external`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 17. ENGINEERING

### MODULE

- **Display name (catalogue):** ENGINEERING
- **Sidebar section label:** Engineering 
- **Code / module id:** `engineering`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** central-product-nav.ts (buildCentralEngineeringNavSection) + engineering-nav.ts (SOPs)

### FEATURES

#### 1. Dashboard

- **Parent module:** ENGINEERING (`engineering`)
- **Feature order:** 1
- **View ID:** engineering-dashboard
- **Route:** /dashboard?view=engineering-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `engineering-dashboard`
- **Provisioning key:** `engineering:engineering-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Programs & Milestones

- **Parent module:** ENGINEERING (`engineering`)
- **Feature order:** 2
- **View ID:** engineering-programs
- **Route:** /dashboard?view=engineering-programs
- **Navigation type:** page
- **Leaf / provisioning id:** `engineering-programs`
- **Provisioning key:** `engineering:engineering-programs`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Team & Capacity

- **Parent module:** ENGINEERING (`engineering`)
- **Feature order:** 3
- **View ID:** engineering-capacity
- **Route:** /dashboard?view=engineering-capacity
- **Navigation type:** page
- **Leaf / provisioning id:** `engineering-capacity`
- **Provisioning key:** `engineering:engineering-capacity`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Risks

- **Parent module:** ENGINEERING (`engineering`)
- **Feature order:** 4
- **View ID:** engineering-risks
- **Route:** /dashboard?view=engineering-risks
- **Navigation type:** page
- **Leaf / provisioning id:** `engineering-risks`
- **Provisioning key:** `engineering:engineering-risks`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Technical Files

- **Parent module:** ENGINEERING (`engineering`)
- **Feature order:** 5
- **View ID:** engineering-technical-files
- **Route:** /dashboard?view=engineering-technical-files
- **Navigation type:** page
- **Leaf / provisioning id:** `engineering-technical-files`
- **Provisioning key:** `engineering:engineering-technical-files`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. SOPs

- **Parent module:** ENGINEERING (`engineering`)
- **Feature order:** 6
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (SOPs)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Dashboard | `engineering-sops-dashboard` | /dashboard?view=engineering-sops-dashboard | page | `engineering-sops-dashboard` |
| 2 | SOP Library | `engineering-sops-library` | /dashboard?view=engineering-sops-library | page | `engineering-sops-library` |
| 3 | My Tasks | `engineering-sops-tasks` | /dashboard?view=engineering-sops-tasks | page | `engineering-sops-tasks` |
| 4 | Active Runs | `engineering-sops-runs` | /dashboard?view=engineering-sops-runs | page | `engineering-sops-runs` |
| 5 | Reviews & Approvals | `engineering-sops-reviews` | /dashboard?view=engineering-sops-reviews | page | `engineering-sops-reviews` |
| 6 | SOP Templates | `engineering-sops-templates` | /dashboard?view=engineering-sops-templates | page | `engineering-sops-templates` |
| 7 | Reports | `engineering-sops-reports` | /dashboard?view=engineering-sops-reports | page | `engineering-sops-reports` |

---

## 18. TRAINING

### MODULE

- **Display name (catalogue):** TRAINING
- **Sidebar section label:** Training 
- **Code / module id:** `training`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('Training')

### FEATURES

#### 1. Dashboard

- **Parent module:** TRAINING (`training`)
- **Feature order:** 1
- **View ID:** training-dashboard
- **Route:** /dashboard?view=training-dashboard
- **Navigation type:** page
- **Leaf / provisioning id:** `training-dashboard`
- **Provisioning key:** `training:training-dashboard`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Course Builder

- **Parent module:** TRAINING (`training`)
- **Feature order:** 2
- **View ID:** course-builder
- **Route:** /dashboard?view=course-builder
- **Navigation type:** page
- **Leaf / provisioning id:** `course-builder`
- **Provisioning key:** `training:course-builder`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Courses

- **Parent module:** TRAINING (`training`)
- **Feature order:** 3
- **View ID:** — (nav group)
- **Route:** —
- **Navigation type:** nav group
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

##### SUB-FEATURES (Courses)

| Order | Label | View ID | Route | Nav type | Provisioning id |
|------:|-------|---------|-------|----------|----------------|
| 1 | Staff Courses | `training` | /dashboard?view=training | page | `training` |
| 2 | External Courses | `training-external` | /dashboard?view=training-external | page | `training-external` |
| 3 | QMS Courses | `qms-training` | /dashboard?view=qms-training | page | `qms-training` |

---

## 19. QMS

### MODULE

- **Display name (catalogue):** QMS
- **Sidebar section label:** QMS 
- **Code / module id:** `qms`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('QMS')

### FEATURES

#### 1. Dashboard

- **Parent module:** QMS (`qms`)
- **Feature order:** 1
- **View ID:** quality-management
- **Route:** /dashboard?view=quality-management
- **Navigation type:** page
- **Leaf / provisioning id:** `quality-management`
- **Provisioning key:** `qms:quality-management`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Document Control

- **Parent module:** QMS (`qms`)
- **Feature order:** 2
- **View ID:** qms-document-control
- **Route:** /dashboard?view=qms-document-control
- **Navigation type:** page
- **Leaf / provisioning id:** `qms-document-control`
- **Provisioning key:** `qms:qms-document-control`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. CAPA

- **Parent module:** QMS (`qms`)
- **Feature order:** 3
- **View ID:** qms-capa
- **Route:** /dashboard?view=qms-capa
- **Navigation type:** page
- **Leaf / provisioning id:** `qms-capa`
- **Provisioning key:** `qms:qms-capa`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Internal Audits

- **Parent module:** QMS (`qms`)
- **Feature order:** 4
- **View ID:** qms-internal-audits
- **Route:** /dashboard?view=qms-internal-audits
- **Navigation type:** page
- **Leaf / provisioning id:** `qms-internal-audits`
- **Provisioning key:** `qms:qms-internal-audits`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Management Review

- **Parent module:** QMS (`qms`)
- **Feature order:** 5
- **View ID:** qms-management-review
- **Route:** /dashboard?view=qms-management-review
- **Navigation type:** page
- **Leaf / provisioning id:** `qms-management-review`
- **Provisioning key:** `qms:qms-management-review`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Reporting

- **Parent module:** QMS (`qms`)
- **Feature order:** 6
- **View ID:** qms-reports
- **Route:** /dashboard?view=qms-reports
- **Navigation type:** page
- **Leaf / provisioning id:** `qms-reports`
- **Provisioning key:** `qms:qms-reports`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 20. TOOLS

### MODULE

- **Display name (catalogue):** TOOLS
- **Sidebar section label:** Tools 
- **Code / module id:** `tools`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('Tools')

### FEATURES

#### 1. Website Management

- **Parent module:** TOOLS (`tools`)
- **Feature order:** 1
- **View ID:** website-management
- **Route:** /dashboard?view=website-management
- **Navigation type:** page
- **Leaf / provisioning id:** `website-management`
- **Provisioning key:** `tools:website-management`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. Integrations

- **Parent module:** TOOLS (`tools`)
- **Feature order:** 2
- **View ID:** integrations
- **Route:** /dashboard?view=integrations
- **Navigation type:** page
- **Leaf / provisioning id:** `integrations`
- **Provisioning key:** `tools:integrations`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Testing

- **Parent module:** TOOLS (`tools`)
- **Feature order:** 3
- **View ID:** testing
- **Route:** /dashboard?view=testing
- **Navigation type:** page
- **Leaf / provisioning id:** `testing`
- **Provisioning key:** `tools:testing`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Telemetry

- **Parent module:** TOOLS (`tools`)
- **Feature order:** 4
- **View ID:** telemetry
- **Route:** /dashboard?view=telemetry
- **Navigation type:** page
- **Leaf / provisioning id:** `telemetry`
- **Provisioning key:** `tools:telemetry`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 5. Users

- **Parent module:** TOOLS (`tools`)
- **Feature order:** 5
- **View ID:** users
- **Route:** /dashboard?view=users
- **Navigation type:** page
- **Leaf / provisioning id:** `users`
- **Provisioning key:** `tools:users`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 6. Unit311 Support

- **Parent module:** TOOLS (`tools`)
- **Feature order:** 6
- **View ID:** unit311-support
- **Route:** /dashboard?view=unit311-support
- **Navigation type:** page
- **Leaf / provisioning id:** `unit311-support`
- **Provisioning key:** `tools:unit311-support`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 21. EXTERNAL CLIENT ACCESS

### MODULE

- **Display name (catalogue):** EXTERNAL CLIENT ACCESS
- **Sidebar section label:** External Client Access 
- **Code / module id:** `external-client-access`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('External Client Access')

### FEATURES

#### 1. Dashboard

- **Parent module:** EXTERNAL CLIENT ACCESS (`external-client-access`)
- **Feature order:** 1
- **View ID:** external-client-access
- **Route:** /dashboard?view=external-client-access
- **Navigation type:** page
- **Leaf / provisioning id:** `external-client-access`
- **Provisioning key:** `external-client-access:external-client-access`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. External Users

- **Parent module:** EXTERNAL CLIENT ACCESS (`external-client-access`)
- **Feature order:** 2
- **View ID:** users-external
- **Route:** /dashboard?view=users-external
- **Navigation type:** page
- **Leaf / provisioning id:** `users-external`
- **Provisioning key:** `external-client-access:users-external`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## 22. SETTINGS

### MODULE

- **Display name (catalogue):** SETTINGS
- **Sidebar section label:** Settings 
- **Code / module id:** `settings`
- **Section kind:** workspace
- **Default route pattern:** `/dashboard?view=<viewId>` (+ query params for tabs/sections)
- **Nav definition source:** internal-operations-data.ts via requireSection('Settings')

### FEATURES

#### 1. Profile

- **Parent module:** SETTINGS (`settings`)
- **Feature order:** 1
- **View ID:** profile
- **Route:** /dashboard?view=profile
- **Navigation type:** page
- **Leaf / provisioning id:** `profile`
- **Provisioning key:** `settings:profile`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 2. General

- **Parent module:** SETTINGS (`settings`)
- **Feature order:** 2
- **View ID:** settings
- **Route:** /dashboard?view=settings
- **Navigation type:** page
- **Leaf / provisioning id:** `settings`
- **Provisioning key:** `settings:settings`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 3. Billing

- **Parent module:** SETTINGS (`settings`)
- **Feature order:** 3
- **View ID:** billing
- **Route:** /dashboard?view=billing
- **Navigation type:** page
- **Leaf / provisioning id:** `billing`
- **Provisioning key:** `settings:billing`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

#### 4. Appearance

- **Parent module:** SETTINGS (`settings`)
- **Feature order:** 4
- **View ID:** appearance
- **Route:** /dashboard?view=appearance
- **Navigation type:** page
- **Leaf / provisioning id:** `appearance`
- **Provisioning key:** `settings:appearance`
- **Visibility notes:**
  - Listed in central product nav catalogue (`buildCentralProductNavSections`, modules 1–22)
  - Runtime LHS visibility also depends on workspace module/sub-module enablement (`buildWorkspaceProductNavSections`)
- **Source file(s):** `src/lib/platform-workspaces/central-product-nav.ts` and related nav builders (see **Nav definition source** above)

---

## TOTALS

- **Core modules:** 22
- **Features (top-level `section.items` entries):** 110
- **Sub-features (nested nav leaves under a feature group):** 61
- **Distinct view IDs in hierarchy:** 128
- **Ambiguities:** Nested depth >2 is flattened into sub-feature tables; href-based nav items (if any) not present in central catalogue.

## SOURCE FILES

- `src/lib/platform-workspaces/central-product-nav.ts`
- `src/lib/platform-workspaces/module-catalogue.ts` (`WORKSPACE_MODULE_CATALOGUE`, provisioning keys)
- `src/lib/platform-workspaces/workspace-product-nav.ts` (runtime filtering by enablement)
- `src/lib/internal-operations-data.ts` (`internalSurveyNavSections`, shared section bodies)
- `src/lib/sales-management-nav.ts`, `src/lib/sales-management-tabs.ts`
- `src/lib/finances-nav.ts`
- `src/lib/project-management-nav.ts`
- `src/lib/central-capabilities/management-nav.ts`
- `src/lib/engineering-nav.ts`
- `src/lib/internal-role-views.ts` (`CUSTOMER_PLATFORM_HIDDEN_VIEWS`)
- `src/lib/product-surface-flags.ts` (`EXECUTIVE_ASSISTANT_VISIBLE`)
- `src/components/testflighthub/InternalOperationsDashboard.tsx`

## IMPORTANT DISCREPANCIES

### Catalogue vs previous `UNIT311_CORE_MODULE_INVENTORY`

- **Intelligence** central nav now includes **Dashboard** (`intelligence-dashboard`) — prior inventory counted 3 Intelligence features without this dashboard leaf.
- **Business Central** central nav uses **Client Management** with **Client Dashboard** / **Client Directory** (not "Clients" / "Member Intelligence"); **Grants** removed from central BC nav (Grants may still appear under Project Management in `internalSurveyNavSections` with `includeGrants: true`).
- **Corporate Information** central nav excludes cap table, board, risk, Unit311 Details (moved to Board module or filtered via `CORPORATE_PRODUCT_EXCLUDED_VIEWS`); **Company Details** label renamed to **Company Information** in central builder.
- **Business Productivity** central nav excludes **Social** (`BUSINESS_PRODUCTIVITY_EXCLUDED_VIEWS`); **Social** remains under central **Marketing & Events**.
- **Marketing & Events** catalogue module label is **MARKETING AND EVENTS** while sidebar section label is **Marketing & Events**.

### `internalSurveyNavSections` vs central catalogue (modules 1–22)

- Legacy host nav (`internalSurveyNavSections`) interleaves **Project Management** (with Grants) near Business Central and omits standalone **Intelligence**, **Fundraising**, and **Board** sections that exist in the 22-module catalogue.
- **Tools** in `internal-operations-data.ts` includes **Unit311 Support** (`unit311-support`); central catalogue **Tools** uses the same `requireSection('Tools')` body — verify runtime filters for customer hosts.

### Provisioning catalogue entries not in central nav tree

These appear in `WORKSPACE_MODULE_CATALOGUE` (via `augmentIntelligenceCatalogueSubModules` / `augmentFundraisingCatalogueSubModules`) but are **not** leaves in `buildCentralProductNavSections()` nav trees:

| Module | Label | View ID | Provisioning key |
|--------|-------|---------|------------------|
| `intelligence` | Member Intelligence | `member-intelligence` | `intelligence:member-intelligence` |
| `intelligence` | Dashboard | `regulatory-dashboard` | `intelligence:regulatory-dashboard` |
| `intelligence` | Regulatory Updates | `regulatory-updates` | `intelligence:regulatory-updates` |
| `intelligence` | Impact Assessments | `regulatory-impact` | `intelligence:regulatory-impact` |
| `intelligence` | Member Alerts | `regulatory-alerts` | `intelligence:regulatory-alerts` |
| `fundraising` | Grant Management | `grants` | `fundraising:grants` |

### Label vs code name

- Catalogue pin labels: **HOME**, **EXECUTIVE ASSISTANT** (all caps) vs sidebar workspace labels in Title Case (e.g. **Human Resources**).
- Module id **financials** vs display **FINANCES**.
- Module id **marketing-events** vs catalogue label **MARKETING AND EVENTS** vs section **Marketing & Events**.

### Conditional display

- `buildWorkspaceProductNavSections` filters items by `enabledModules` / `enabledSubModules`.
- Customer workspace slugs apply `CUSTOMER_PLATFORM_HIDDEN_VIEWS`, ABHI label renames, InterfaceWorx / GreenDesert / SAEC augmentations — **not** part of the static central catalogue tree above.
- Finances module bypasses sub-module filtering when module enabled (`filterSubsForModule` special case in `workspace-product-nav.ts`).
