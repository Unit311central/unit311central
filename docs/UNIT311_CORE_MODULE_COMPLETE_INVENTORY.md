# Unit311 Central — Complete Core Module Inventory

Extracted from the **current codebase**. User-facing structure follows `buildCentralProductNavSections()` modules **1–22** (Core catalogue). Rendering and deep links use `InternalOperationsDashboard.tsx` with shell route `/dashboard?view=`.

**CURRENT USER-FACING STRUCTURE EXTRACTED FROM CODE — NO DESIGN CHANGES APPLIED.**

---

## Source of Truth

| Role | Authoritative file(s) |
|------|------------------------|
| **Core module list (22) and LHS labels** | `buildCentralProductNavSections()` in `src/lib/platform-workspaces/central-product-nav.ts` (entries with `number` 1–22; exclude `wolf-*` ids) |
| **Runtime nav filtering (enabled modules/submodules)** | `buildWorkspaceProductNavSections()` in `src/lib/platform-workspaces/workspace-product-nav.ts` |
| **View → React workspace mount** | `src/components/testflighthub/InternalOperationsDashboard.tsx` (`activeView` / `InternalOperationsView`) |
| **Shell entry** | `src/app/(survey-operations)/internaldashboard/page.tsx` (production hosts rewrite here via `src/middleware.ts`) |
| **Provisioning keys (not identical to LHS)** | `WORKSPACE_MODULE_CATALOGUE` in `src/lib/platform-workspaces/module-catalogue.ts` |

**Scope note:** The tree below is what the **central Core catalogue** exposes when a workspace has the module and submodule enabled. Host-specific overlays (ABHI, OnwardAir, demo, SAEC, etc.) may hide, rename, or augment items — see **Discrepancies**.

---

## Core Module Tree (catalogue navigation — all 22)

### 01. HOME (`home`)

```
HOME
    View ID: `home`
    Route: `/dashboard?view=home`
    Component: ExecutiveHomeDashboard (WorkspacePane)
```

### 02. EXECUTIVE ASSISTANT (`executive-assistant`)

```
EXECUTIVE ASSISTANT
    View ID: `executive-assistant`
    Route: `/dashboard?view=executive-assistant`
    Component: ExecutiveAssistantWorkspace
```

### 03. INTELLIGENCE (`intelligence`)

```
Dashboard
    View ID: `intelligence-dashboard`
    Route: `/dashboard?view=intelligence-dashboard`
    Component: IntelligenceDashboardWorkspace | NorthstarIntelligenceDashboard (demo)
Company Intelligence
    View ID: `demo-company-intelligence`
    Route: `/dashboard?view=demo-company-intelligence`
    Component: IntelligenceCentralWorkspace | NorthstarIntelligenceRouter (via isIntelligenceOperationsView)
Client Intelligence
    View ID: `demo-client-intelligence`
    Route: `/dashboard?view=demo-client-intelligence`
    Component: IntelligenceCentralWorkspace | NorthstarIntelligenceRouter
Market Intelligence
    View ID: `demo-market-intelligence`
    Route: `/dashboard?view=demo-market-intelligence`
    Component: IntelligenceCentralWorkspace | NorthstarIntelligenceRouter
```

### 04. BUSINESS CENTRAL (`business-central`)

```
Dashboard
    View ID: `business-central-dashboard`
    Route: `/dashboard?view=business-central-dashboard`
    Component: WorkspaceBusinessCentralDashboard (default) | NorthstarBusinessCentralDashboard (demo) | OnwardAirBusinessCentralDashboard | SaecBusinessCentralDashboard
Client Management
  Client Dashboard
      View ID: `clients-dashboard`
      Route: `/dashboard?view=clients-dashboard`
      Component: ClientsDashboardWorkspace (WorkspacePane view=clients-dashboard)
  Client Directory
      View ID: `clients`
      Route: `/dashboard?view=clients`
      Component: ClientManagementWorkspace (WorkspacePane view=clients)
Management
  Management Dashboard
      View ID: `management`
      Route: `/dashboard?view=management`
      Component: ManagementWorkspace
  Meetings
      View ID: `management`
      Query: `{"section":"meetings"}`
      Route: `/dashboard?view=management&section=meetings`
      Component: ManagementWorkspace
  Function Packs
      View ID: `management`
      Query: `{"section":"function-packs"}`
      Route: `/dashboard?view=management&section=function-packs`
      Component: ManagementWorkspace
  Actions & Decisions
      View ID: `management`
      Query: `{"section":"actions-decisions"}`
      Route: `/dashboard?view=management&section=actions-decisions`
      Component: ManagementWorkspace
Information Repository
    View ID: `information-repository`
    Route: `/dashboard?view=information-repository`
    Component: InterfaceWorxInformationRepositoryWorkspace
```

### 05. SALES MANAGEMENT (`sales-management`)

```
Dashboard
    View ID: `sales-management`
    Query: `{"tab":"dashboard"}`
    Route: `/dashboard?view=sales-management&tab=dashboard`
    Component: SalesManagementWorkspace
Overview
  My Sales
      View ID: `sales-management`
      Query: `{"tab":"my-sales"}`
      Route: `/dashboard?view=sales-management&tab=my-sales`
      Component: SalesManagementWorkspace
  Sales Team
      View ID: `sales-management`
      Query: `{"tab":"sales-team"}`
      Route: `/dashboard?view=sales-management&tab=sales-team`
      Component: SalesManagementWorkspace
Management
  Targets & Forecast
      View ID: `sales-management`
      Query: `{"tab":"targets"}`
      Route: `/dashboard?view=sales-management&tab=targets`
      Component: SalesManagementWorkspace
  Performance
      View ID: `sales-management`
      Query: `{"tab":"performance"}`
      Route: `/dashboard?view=sales-management&tab=performance`
      Component: SalesManagementWorkspace
  Forecast
      View ID: `sales-management`
      Query: `{"tab":"forecast"}`
      Route: `/dashboard?view=sales-management&tab=forecast`
      Component: SalesManagementWorkspace
  Commissions
      View ID: `sales-management`
      Query: `{"tab":"commissions"}`
      Route: `/dashboard?view=sales-management&tab=commissions`
      Component: SalesManagementWorkspace
  Reports
      View ID: `sales-management`
      Query: `{"tab":"reports"}`
      Route: `/dashboard?view=sales-management&tab=reports`
      Component: SalesManagementWorkspace
Sales
  Prospects
      View ID: `sales-management`
      Query: `{"tab":"prospects"}`
      Route: `/dashboard?view=sales-management&tab=prospects`
      Component: SalesManagementWorkspace
  Opportunities
      View ID: `sales-management`
      Query: `{"tab":"opportunities"}`
      Route: `/dashboard?view=sales-management&tab=opportunities`
      Component: SalesManagementWorkspace
  Pipeline
      View ID: `sales-management`
      Query: `{"tab":"pipeline"}`
      Route: `/dashboard?view=sales-management&tab=pipeline`
      Component: SalesManagementWorkspace
  Discovery
      View ID: `sales-management`
      Query: `{"tab":"discovery"}`
      Route: `/dashboard?view=sales-management&tab=discovery`
      Component: SalesManagementWorkspace
  Activities
      View ID: `sales-management`
      Query: `{"tab":"activities"}`
      Route: `/dashboard?view=sales-management&tab=activities`
      Component: SalesManagementWorkspace
  Sales Quotes
      View ID: `sales-management`
      Query: `{"tab":"sales-quotes"}`
      Route: `/dashboard?view=sales-management&tab=sales-quotes`
      Component: SalesManagementWorkspace
  Partners
      View ID: `sales-management`
      Query: `{"tab":"partners"}`
      Route: `/dashboard?view=sales-management&tab=partners`
      Component: SalesManagementWorkspace
```

### 06. FINANCES (`financials`)

```
Dashboard
    View ID: `financials`
    Route: `/dashboard?view=financials`
    Component: FinancialsWorkspace (WorkspacePane)
General Ledger
  Chart of Accounts
      View ID: `general-ledger`
      Query: `{"tab":"accounts"}`
      Route: `/dashboard?view=general-ledger&tab=accounts`
      Component: GeneralLedgerWorkspace (+ in-page tabs via ?tab=)
  Trial Balance
      View ID: `general-ledger`
      Query: `{"tab":"trial"}`
      Route: `/dashboard?view=general-ledger&tab=trial`
      Component: GeneralLedgerWorkspace (+ in-page tabs via ?tab=)
  Journals
      View ID: `general-ledger`
      Query: `{"tab":"journal"}`
      Route: `/dashboard?view=general-ledger&tab=journal`
      Component: GeneralLedgerWorkspace (+ in-page tabs via ?tab=)
Accounts Receivable
  Invoices
      View ID: `accounts-receivable`
      Route: `/dashboard?view=accounts-receivable`
      Component: AccountsReceivableWorkspace
  Outstanding
      View ID: `accounts-receivable`
      Query: `{"filter":"outstanding"}`
      Route: `/dashboard?view=accounts-receivable&filter=outstanding`
      Component: AccountsReceivableWorkspace
  Overdue
      View ID: `accounts-receivable`
      Query: `{"filter":"overdue"}`
      Route: `/dashboard?view=accounts-receivable&filter=overdue`
      Component: AccountsReceivableWorkspace
  Collections
      View ID: `finances-ar-collections`
      Route: `/dashboard?view=finances-ar-collections`
      Component: AccountsReceivableWorkspace
  AR Reporting
      View ID: `finances-ar-reporting`
      Route: `/dashboard?view=finances-ar-reporting`
      Component: AccountsReceivableWorkspace
Accounts Payable
  Supplier Invoices
      View ID: `accounts-payable`
      Query: `{"section":"invoices"}`
      Route: `/dashboard?view=accounts-payable&section=invoices`
      Component: AccountsPayableWorkspace
  Approvals
      View ID: `accounts-payable`
      Query: `{"section":"approvals"}`
      Route: `/dashboard?view=accounts-payable&section=approvals`
      Component: AccountsPayableWorkspace
  Outstanding
      View ID: `accounts-payable`
      Query: `{"section":"outstanding"}`
      Route: `/dashboard?view=accounts-payable&section=outstanding`
      Component: AccountsPayableWorkspace
  Due Dates
      View ID: `accounts-payable`
      Query: `{"section":"due-dates"}`
      Route: `/dashboard?view=accounts-payable&section=due-dates`
      Component: AccountsPayableWorkspace
  Payments
      View ID: `finances-ap-payments`
      Route: `/dashboard?view=finances-ap-payments`
      Component: AccountsPayableWorkspace
Expenses
  My Expenses
      View ID: `expenses`
      Route: `/dashboard?view=expenses`
      Component: ExpensesHubWorkspace
  Add Expense
      View ID: `expenses`
      Query: `{"section":"add"}`
      Route: `/dashboard?view=expenses&section=add`
      Component: ExpensesHubWorkspace
  All Expenses
      View ID: `expenses`
      Query: `{"section":"all"}`
      Route: `/dashboard?view=expenses&section=all`
      Component: ExpensesHubWorkspace
  Approvals
      View ID: `expenses`
      Query: `{"section":"approvals"}`
      Route: `/dashboard?view=expenses&section=approvals`
      Component: ExpensesHubWorkspace
  Expense Runs
      View ID: `expenses`
      Query: `{"section":"runs"}`
      Route: `/dashboard?view=expenses&section=runs`
      Component: ExpensesHubWorkspace
  Configuration
      View ID: `expenses`
      Query: `{"section":"config"}`
      Route: `/dashboard?view=expenses&section=config`
      Component: ExpensesHubWorkspace
Banking & Cash
  Bank
      View ID: `wise`
      Route: `/dashboard?view=wise`
      Component: WiseWorkspace
  Cash Position
      View ID: `finances-banking-cash-position`
      Route: `/dashboard?view=finances-banking-cash-position`
      Component: FinancesBankingWorkspace
  Reconciliation
      View ID: `finances-banking-reconciliation`
      Route: `/dashboard?view=finances-banking-reconciliation`
      Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Planning & Management
  Budget
      View ID: `finances-planning-budget`
      Route: `/dashboard?view=finances-planning-budget`
      Component: FinancesPlanningWorkspace
  Actual vs Budget
      View ID: `finances-planning-actual-vs-budget`
      Route: `/dashboard?view=finances-planning-actual-vs-budget`
      Component: FinancesPlanningWorkspace
  Cash Flow
      View ID: `finances-planning-cash-flow`
      Route: `/dashboard?view=finances-planning-cash-flow`
      Component: FinancesPlanningWorkspace
  Forecast
      View ID: `finances-planning-forecast`
      Route: `/dashboard?view=finances-planning-forecast`
      Component: FinancesPlanningWorkspace
  KPIs
      View ID: `finances-planning-kpis`
      Route: `/dashboard?view=finances-planning-kpis`
      Component: FinancesPlanningWorkspace
  Management Accounts
      View ID: `finances-planning-management-accounts`
      Route: `/dashboard?view=finances-planning-management-accounts`
      Component: FinancesPlanningWorkspace
Financial Reports
    View ID: `financial-reports`
    Route: `/dashboard?view=financial-reports`
    Component: FinancialReportsWorkspace
```

### 07. FUNDRAISING (`fundraising`)

```
Dashboard
    View ID: `fundraising-dashboard`
    Route: `/dashboard?view=fundraising-dashboard`
    Component: FundraisingDashboardHost
Investors
    View ID: `fundraising-investors`
    Route: `/dashboard?view=fundraising-investors`
    Component: FundraisingInvestorsHost
Cap Table Management
    View ID: `fundraising-cap-table`
    Route: `/dashboard?view=fundraising-cap-table`
    Component: FundraisingCapTableHost
Pipeline
    View ID: `fundraising-pipeline`
    Route: `/dashboard?view=fundraising-pipeline`
    Component: FundraisingPipelineHost
Meetings
    View ID: `fundraising-meetings`
    Route: `/dashboard?view=fundraising-meetings`
    Component: FundraisingMeetingsHost
Pitch Decks
    View ID: `fundraising-pitch-decks`
    Route: `/dashboard?view=fundraising-pitch-decks`
    Component: FundraisingPitchDecksHost
Data Rooms
    View ID: `fundraising-data-rooms`
    Route: `/dashboard?view=fundraising-data-rooms`
    Component: FundraisingDataRoomsHost
```

### 08. BOARD (`board`)

```
Dashboard
    View ID: `board-dashboard`
    Route: `/dashboard?view=board-dashboard`
    Component: BoardGovernanceWorkspace
Meetings
    View ID: `board-meetings`
    Route: `/dashboard?view=board-meetings`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Minutes & Decisions
    View ID: `board-minutes`
    Route: `/dashboard?view=board-minutes`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Board Members
    View ID: `board-members`
    Route: `/dashboard?view=board-members`
    Component: BoardGovernanceWorkspace
Board deck
    View ID: `board-pack`
    Route: `/dashboard?view=board-pack`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Risk Register
    View ID: `corporate-risk-register`
    Route: `/dashboard?view=corporate-risk-register`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
```

### 09. CORPORATE INFORMATION (`corporate-information`)

```
Dashboard
    View ID: `corporate-dashboard`
    Route: `/dashboard?view=corporate-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Company Information
    View ID: `corporate-company-details`
    Route: `/dashboard?view=corporate-company-details`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Office Locations
    View ID: `office-locations`
    Route: `/dashboard?view=office-locations`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Bank Accounts
    View ID: `corporate-bank-accounts`
    Route: `/dashboard?view=corporate-bank-accounts`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Professional Advisors
    View ID: `corporate-advisers`
    Route: `/dashboard?view=corporate-advisers`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Contracts
    View ID: `corporate-contracts`
    Route: `/dashboard?view=corporate-contracts`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
```

### 10. OPERATIONS (`operations`)

```
Dashboard
    View ID: `operations-dashboard`
    Route: `/dashboard?view=operations-dashboard`
    Component: OperationsDashboardWorkspace
Assets
    View ID: `assets`
    Route: `/dashboard?view=assets`
    Component: div
Inventory
    View ID: `inventory-management`
    Route: `/dashboard?view=inventory-management`
    Component: WorkspaceErrorBoundary
Procurement
    View ID: `procurement`
    Route: `/dashboard?view=procurement`
    Component: WorkspaceErrorBoundary
Logistics
    View ID: `logistics`
    Route: `/dashboard?view=logistics`
    Component: LogisticsWorkspace
```

### 11. MARKETING AND EVENTS (`marketing-events`)

```
Dashboard
    View ID: `oa-marketing-dashboard`
    Route: `/dashboard?view=oa-marketing-dashboard`
    Component: MarketingViewHost (isMarketingModuleView)
Digital Newsletter
    View ID: `marketing-newsletter`
    Route: `/dashboard?view=marketing-newsletter`
    Component: MarketingViewHost
External Events
    View ID: `marketing-events`
    Route: `/dashboard?view=marketing-events`
    Component: MarketingViewHost
Event Management
    View ID: `marketing-event-management`
    Route: `/dashboard?view=marketing-event-management`
    Component: MarketingViewHost
Mailing List
    View ID: `marketing-mailing-list`
    Route: `/dashboard?view=marketing-mailing-list`
    Component: MarketingViewHost
Client Stories
    View ID: `portfolio-stories`
    Route: `/dashboard?view=portfolio-stories`
    Component: MarketingViewHost
Social
    View ID: `social`
    Route: `/dashboard?view=social`
    Component: MarketingViewHost
```

### 12. TECH MGMT (`technology-management`)

```
Dashboard
    View ID: `technology-dashboard`
    Route: `/dashboard?view=technology-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Architecture Diagrams
    View ID: `technology-architecture`
    Route: `/dashboard?view=technology-architecture`
    Component: TechnologyArchitectureWorkspace
Technology Assets
    View ID: `technology-devices`
    Route: `/dashboard?view=technology-devices`
    Component: div
Software & SaaS Dashboard
    View ID: `technology-software-dashboard`
    Route: `/dashboard?view=technology-software-dashboard`
    Component: SoftwareSaasDashboardWorkspace
Software & SaaS
    View ID: `technology-software`
    Route: `/dashboard?view=technology-software`
    Component: TechnologySoftwareWorkspace
Telecommunications
    View ID: `technology-telecommunications`
    Route: `/dashboard?view=technology-telecommunications`
    Component: TelecommunicationsWorkspace
```

### 13. HUMAN RESOURCES (`human-resources`)

```
Dashboard
    View ID: `hr-dashboard`
    Route: `/dashboard?view=hr-dashboard`
    Component: HrWorkspace
Employees
    View ID: `hr`
    Route: `/dashboard?view=hr`
    Component: HrWorkspace
Org Chart
    View ID: `hr-org-chart`
    Route: `/dashboard?view=hr-org-chart`
    Component: OrgChartWorkspace
Recruitment
    View ID: `hr-recruitment`
    Route: `/dashboard?view=hr-recruitment`
    Component: RecruitmentWorkspace
Time & Attendance
    View ID: `hr-leave`
    Route: `/dashboard?view=hr-leave`
    Component: LeaveManagementWorkspace
Payroll
    View ID: `hr-payroll`
    Route: `/dashboard?view=hr-payroll`
    Component: PayrollWorkspace
Performance
    View ID: `hr-performance`
    Route: `/dashboard?view=hr-performance`
    Component: PerformanceHubWorkspace
HR Reports
    View ID: `hr-reports`
    Route: `/dashboard?view=hr-reports`
    Component: HrReportsWorkspace
```

### 14. BUSINESS PROD (`business-productivity`)

```
Dashboard
    View ID: `productivity-dashboard`
    Route: `/dashboard?view=productivity-dashboard`
    Component: ProductivityDashboardWorkspace
Content Studio
    View ID: `content-studio`
    Route: `/dashboard?view=content-studio`
    Component: ContentStudioWorkspace
Internal Work Packages
    View ID: `internal-work-packages`
    Route: `/dashboard?view=internal-work-packages`
    Component: InternalWorkPackagesWorkspace
File Explorer
  Internal Files
      View ID: `files-internal`
      Route: `/dashboard?view=files-internal`
      Component: FilesInternalWorkspace
  External Files
      View ID: `files-external`
      Route: `/dashboard?view=files-external`
      Component: FileRepositoryWorkspace
  Client Explorer
      View ID: `files-client`
      Route: `/dashboard?view=files-client`
      Component: ClientFilesExplorerWorkspace
Email
    View ID: `info-email`
    Route: `/dashboard?view=info-email`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Calendar
    View ID: `calendar`
    Route: `/dashboard?view=calendar`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Messaging
    View ID: `messaging`
    Route: `/dashboard?view=messaging`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Communications
    View ID: `communications`
    Route: `/dashboard?view=communications`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Whiteboard
    View ID: `whiteboard`
    Route: `/dashboard?view=whiteboard`
    Component: WhiteboardWorkspace
```

### 15. SUPPORT DESK (`support-desk`)

```
Ticket Overview
    View ID: `support-overview`
    Route: `/dashboard?view=support-overview`
    Component: SupportWorkspace
Tickets
    View ID: `support`
    Route: `/dashboard?view=support`
    Component: SupportWorkspace
My support tickets
    View ID: `support-mine`
    Route: `/dashboard?view=support-mine`
    Component: SupportWorkspace
WhatsApp Integration
    View ID: `whatsapp-integration`
    Route: `/dashboard?view=whatsapp-integration`
    Component: WorkspaceErrorBoundary
```

### 16. PROJECT MANAGEMENT (`project-management`)

```
Dashboard
    View ID: `projects-dashboard`
    Route: `/dashboard?view=projects-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Internal Projects
    View ID: `projects-internal`
    Route: `/dashboard?view=projects-internal`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
External Projects
    View ID: `projects-external`
    Route: `/dashboard?view=projects-external`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
```

### 17. ENGINEERING (`engineering`)

```
Dashboard
    View ID: `engineering-dashboard`
    Route: `/dashboard?view=engineering-dashboard`
    Component: EngineeringDashboardHost (engineering || engineering-dashboard)
Programs & Milestones
    View ID: `engineering-programs`
    Route: `/dashboard?view=engineering-programs`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Team & Capacity
    View ID: `engineering-capacity`
    Route: `/dashboard?view=engineering-capacity`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Risks
    View ID: `engineering-risks`
    Route: `/dashboard?view=engineering-risks`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Technical Files
    View ID: `engineering-technical-files`
    Route: `/dashboard?view=engineering-technical-files`
    Component: WorkspaceErrorBoundary
SOPs
  Dashboard
      View ID: `engineering-sops-dashboard`
      Route: `/dashboard?view=engineering-sops-dashboard`
      Component: EngineeringSopRouter
  SOP Library
      View ID: `engineering-sops-library`
      Route: `/dashboard?view=engineering-sops-library`
      Component: EngineeringSopRouter
  My Tasks
      View ID: `engineering-sops-tasks`
      Route: `/dashboard?view=engineering-sops-tasks`
      Component: EngineeringSopRouter
  Active Runs
      View ID: `engineering-sops-runs`
      Route: `/dashboard?view=engineering-sops-runs`
      Component: EngineeringSopRouter
  Reviews & Approvals
      View ID: `engineering-sops-reviews`
      Route: `/dashboard?view=engineering-sops-reviews`
      Component: EngineeringSopRouter
  SOP Templates
      View ID: `engineering-sops-templates`
      Route: `/dashboard?view=engineering-sops-templates`
      Component: EngineeringSopRouter
  Reports
      View ID: `engineering-sops-reports`
      Route: `/dashboard?view=engineering-sops-reports`
      Component: EngineeringSopRouter
```

### 18. TRAINING (`training`)

```
Dashboard
    View ID: `training-dashboard`
    Route: `/dashboard?view=training-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Course Builder
    View ID: `course-builder`
    Route: `/dashboard?view=course-builder`
    Component: CourseBuilderWorkspace
Courses
  Staff Courses
      View ID: `training`
      Route: `/dashboard?view=training`
      Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
  External Courses
      View ID: `training-external`
      Route: `/dashboard?view=training-external`
      Component: ExternalTrainingWorkspace
  QMS Courses
      View ID: `qms-training`
      Route: `/dashboard?view=qms-training`
      Component: QmsTrainingWorkspace
```

### 19. QMS (`qms`)

```
Dashboard
    View ID: `quality-management`
    Route: `/dashboard?view=quality-management`
    Component: QualityManagementWorkspace
Document Control
    View ID: `qms-document-control`
    Route: `/dashboard?view=qms-document-control`
    Component: DocumentControlWorkspace
CAPA
    View ID: `qms-capa`
    Route: `/dashboard?view=qms-capa`
    Component: CapaWorkspace
Internal Audits
    View ID: `qms-internal-audits`
    Route: `/dashboard?view=qms-internal-audits`
    Component: InternalAuditsWorkspace
Management Review
    View ID: `qms-management-review`
    Route: `/dashboard?view=qms-management-review`
    Component: ManagementReviewWorkspace
Reporting
    View ID: `qms-reports`
    Route: `/dashboard?view=qms-reports`
    Component: TqmsReportsWorkspace
```

### 20. TOOLS (`tools`)

```
Website Management
    View ID: `website-management`
    Route: `/dashboard?view=website-management`
    Component: WebsiteManagementWorkspace
Integrations
    View ID: `integrations`
    Route: `/dashboard?view=integrations`
    Component: WorkspaceErrorBoundary
Testing
    View ID: `testing`
    Route: `/dashboard?view=testing`
    Component: div
Telemetry
    View ID: `telemetry`
    Route: `/dashboard?view=telemetry`
    Component: TelemetryDashboard
Users
    View ID: `users`
    Route: `/dashboard?view=users`
    Component: UserManagementWorkspace
Unit311 Support
    View ID: `unit311-support`
    Route: `/dashboard?view=unit311-support`
    Component: WorkspaceErrorBoundary
```

### 21. EXTERNAL CLIENT ACCESS (`external-client-access`)

```
Dashboard
    View ID: `external-client-access`
    Route: `/dashboard?view=external-client-access`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
External Users
    View ID: `users-external`
    Route: `/dashboard?view=users-external`
    Component: ExternalUsersWorkspace
```

### 22. SETTINGS (`settings`)

```
Profile
    View ID: `profile`
    Route: `/dashboard?view=profile`
    Component: ProfileWorkspace
General
    View ID: `settings`
    Route: `/dashboard?view=settings`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Billing
    View ID: `billing`
    Route: `/dashboard?view=billing`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Appearance
    View ID: `appearance`
    Route: `/dashboard?view=appearance`
    Component: AppearanceSettingsWorkspace
```

---

# 01. HOME

**Code id:** `home`  
**Catalogue display name:** HOME  
**Sidebar section label:** (pin — label on item)  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
HOME
    View ID: `home`
    Route: `/dashboard?view=home`
    Component: ExecutiveHomeDashboard (WorkspacePane)
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- `ExecutiveHomeDashboard` command-centre tiles and widgets — not separate catalogue leaves.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/internal/command-centre`
- `/api/strategy/items`
- `/api/strategy/items/[id]`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `strategy_items`
- `platform_usage_events`

## Source Files

- `src/lib/platform-workspaces/central-product-nav.ts`
- `src/components/home/ExecutiveHomeDashboard.tsx`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 02. EXECUTIVE ASSISTANT

**Code id:** `executive-assistant`  
**Catalogue display name:** EXECUTIVE ASSISTANT  
**Sidebar section label:** (pin — label on item)  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
EXECUTIVE ASSISTANT
    View ID: `executive-assistant`
    Route: `/dashboard?view=executive-assistant`
    Component: ExecutiveAssistantWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

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

**Database tables (migration/heuristic; presence ≠ user feature):**

- `executive_assistant_conversations`

## Source Files

- `src/lib/platform-workspaces/central-product-nav.ts`
- `src/components/executive-assistant/ExecutiveAssistantWorkspace.tsx`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 03. INTELLIGENCE

**Code id:** `intelligence`  
**Catalogue display name:** INTELLIGENCE  
**Sidebar section label:** Intelligence  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `intelligence-dashboard`
    Route: `/dashboard?view=intelligence-dashboard`
    Component: IntelligenceDashboardWorkspace | NorthstarIntelligenceDashboard (demo)
Company Intelligence
    View ID: `demo-company-intelligence`
    Route: `/dashboard?view=demo-company-intelligence`
    Component: IntelligenceCentralWorkspace | NorthstarIntelligenceRouter (via isIntelligenceOperationsView)
Client Intelligence
    View ID: `demo-client-intelligence`
    Route: `/dashboard?view=demo-client-intelligence`
    Component: IntelligenceCentralWorkspace | NorthstarIntelligenceRouter
Market Intelligence
    View ID: `demo-market-intelligence`
    Route: `/dashboard?view=demo-market-intelligence`
    Component: IntelligenceCentralWorkspace | NorthstarIntelligenceRouter
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/competitors`
- `/api/competitors/[id]`
- `/api/intelligence/briefing`
- `/api/intelligence/domains`
- `/api/intelligence/records/[recordId]`
- `/api/intelligence/search`
- `/api/intelligence/sources`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `competitors`

## Source Files

- `src/lib/platform-workspaces/central-product-nav.ts`
- `src/lib/intelligence/views.ts`
- `src/components/intelligence/*`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 04. BUSINESS CENTRAL

**Code id:** `business-central`  
**Catalogue display name:** BUSINESS CENTRAL  
**Sidebar section label:** Business Central  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `business-central-dashboard`
    Route: `/dashboard?view=business-central-dashboard`
    Component: WorkspaceBusinessCentralDashboard (default) | NorthstarBusinessCentralDashboard (demo) | OnwardAirBusinessCentralDashboard | SaecBusinessCentralDashboard
Client Management
  Client Dashboard
      View ID: `clients-dashboard`
      Route: `/dashboard?view=clients-dashboard`
      Component: ClientsDashboardWorkspace (WorkspacePane view=clients-dashboard)
  Client Directory
      View ID: `clients`
      Route: `/dashboard?view=clients`
      Component: ClientManagementWorkspace (WorkspacePane view=clients)
Management
  Management Dashboard
      View ID: `management`
      Route: `/dashboard?view=management`
      Component: ManagementWorkspace
  Meetings
      View ID: `management`
      Query: `{"section":"meetings"}`
      Route: `/dashboard?view=management&section=meetings`
      Component: ManagementWorkspace
  Function Packs
      View ID: `management`
      Query: `{"section":"function-packs"}`
      Route: `/dashboard?view=management&section=function-packs`
      Component: ManagementWorkspace
  Actions & Decisions
      View ID: `management`
      Query: `{"section":"actions-decisions"}`
      Route: `/dashboard?view=management&section=actions-decisions`
      Component: ManagementWorkspace
Information Repository
    View ID: `information-repository`
    Route: `/dashboard?view=information-repository`
    Component: InterfaceWorxInformationRepositoryWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/clients`
- `/api/clients/[id]`
- `/api/clients/[id]/files-root`
- `/api/clients/[id]/reset-workspace-onboarding`
- `/api/clients/[id]/support-lounge`
- `/api/clients/support-lounge/ensure-all`
- `/api/information-repository`
- `/api/information-repository/architecture-diagrams`
- `/api/information-repository/attachments`
- `/api/information-repository/attachments/complete`
- `/api/information-repository/attachments/prepare`
- `/api/information-repository/mission-2-model-testing-arch`
- `/api/information-repository/model-testing-arch`
- `/api/information-repository/sections`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `internal_clients`

## Source Files

- `src/lib/platform-workspaces/central-product-nav.ts`
- `src/lib/central-capabilities/management-nav.ts`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 05. SALES MANAGEMENT

**Code id:** `sales-management`  
**Catalogue display name:** SALES MANAGEMENT  
**Sidebar section label:** Sales Management  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `sales-management`
    Query: `{"tab":"dashboard"}`
    Route: `/dashboard?view=sales-management&tab=dashboard`
    Component: SalesManagementWorkspace
Overview
  My Sales
      View ID: `sales-management`
      Query: `{"tab":"my-sales"}`
      Route: `/dashboard?view=sales-management&tab=my-sales`
      Component: SalesManagementWorkspace
  Sales Team
      View ID: `sales-management`
      Query: `{"tab":"sales-team"}`
      Route: `/dashboard?view=sales-management&tab=sales-team`
      Component: SalesManagementWorkspace
Management
  Targets & Forecast
      View ID: `sales-management`
      Query: `{"tab":"targets"}`
      Route: `/dashboard?view=sales-management&tab=targets`
      Component: SalesManagementWorkspace
  Performance
      View ID: `sales-management`
      Query: `{"tab":"performance"}`
      Route: `/dashboard?view=sales-management&tab=performance`
      Component: SalesManagementWorkspace
  Forecast
      View ID: `sales-management`
      Query: `{"tab":"forecast"}`
      Route: `/dashboard?view=sales-management&tab=forecast`
      Component: SalesManagementWorkspace
  Commissions
      View ID: `sales-management`
      Query: `{"tab":"commissions"}`
      Route: `/dashboard?view=sales-management&tab=commissions`
      Component: SalesManagementWorkspace
  Reports
      View ID: `sales-management`
      Query: `{"tab":"reports"}`
      Route: `/dashboard?view=sales-management&tab=reports`
      Component: SalesManagementWorkspace
Sales
  Prospects
      View ID: `sales-management`
      Query: `{"tab":"prospects"}`
      Route: `/dashboard?view=sales-management&tab=prospects`
      Component: SalesManagementWorkspace
  Opportunities
      View ID: `sales-management`
      Query: `{"tab":"opportunities"}`
      Route: `/dashboard?view=sales-management&tab=opportunities`
      Component: SalesManagementWorkspace
  Pipeline
      View ID: `sales-management`
      Query: `{"tab":"pipeline"}`
      Route: `/dashboard?view=sales-management&tab=pipeline`
      Component: SalesManagementWorkspace
  Discovery
      View ID: `sales-management`
      Query: `{"tab":"discovery"}`
      Route: `/dashboard?view=sales-management&tab=discovery`
      Component: SalesManagementWorkspace
  Activities
      View ID: `sales-management`
      Query: `{"tab":"activities"}`
      Route: `/dashboard?view=sales-management&tab=activities`
      Component: SalesManagementWorkspace
  Sales Quotes
      View ID: `sales-management`
      Query: `{"tab":"sales-quotes"}`
      Route: `/dashboard?view=sales-management&tab=sales-quotes`
      Component: SalesManagementWorkspace
  Partners
      View ID: `sales-management`
      Query: `{"tab":"partners"}`
      Route: `/dashboard?view=sales-management&tab=partners`
      Component: SalesManagementWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- Tab bodies inside `SalesManagementWorkspace` for each `?tab=` leaf (Prospects, Opportunities, etc.) — tab **labels** match LHS; inner controls [UNVERIFIED] without per-component audit.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/financials/sales-quotes`
- `/api/financials/sales-quotes/compose-context`
- `/api/sales-management/activities`
- `/api/sales-management/commission-rules`
- `/api/sales-management/dashboard`
- `/api/sales-management/targets`
- `/api/sales-management/workspace`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `sales_quotes`
- `sales_teams`

## Source Files

- `src/lib/sales-management-nav.ts`
- `src/lib/sales-management-tabs.ts`
- `src/components/testflighthub/sales-management/SalesManagementWorkspace.tsx`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 06. FINANCES

**Code id:** `financials`  
**Catalogue display name:** FINANCES  
**Sidebar section label:** Finances  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `financials`
    Route: `/dashboard?view=financials`
    Component: FinancialsWorkspace (WorkspacePane)
General Ledger
  Chart of Accounts
      View ID: `general-ledger`
      Query: `{"tab":"accounts"}`
      Route: `/dashboard?view=general-ledger&tab=accounts`
      Component: GeneralLedgerWorkspace (+ in-page tabs via ?tab=)
  Trial Balance
      View ID: `general-ledger`
      Query: `{"tab":"trial"}`
      Route: `/dashboard?view=general-ledger&tab=trial`
      Component: GeneralLedgerWorkspace (+ in-page tabs via ?tab=)
  Journals
      View ID: `general-ledger`
      Query: `{"tab":"journal"}`
      Route: `/dashboard?view=general-ledger&tab=journal`
      Component: GeneralLedgerWorkspace (+ in-page tabs via ?tab=)
Accounts Receivable
  Invoices
      View ID: `accounts-receivable`
      Route: `/dashboard?view=accounts-receivable`
      Component: AccountsReceivableWorkspace
  Outstanding
      View ID: `accounts-receivable`
      Query: `{"filter":"outstanding"}`
      Route: `/dashboard?view=accounts-receivable&filter=outstanding`
      Component: AccountsReceivableWorkspace
  Overdue
      View ID: `accounts-receivable`
      Query: `{"filter":"overdue"}`
      Route: `/dashboard?view=accounts-receivable&filter=overdue`
      Component: AccountsReceivableWorkspace
  Collections
      View ID: `finances-ar-collections`
      Route: `/dashboard?view=finances-ar-collections`
      Component: AccountsReceivableWorkspace
  AR Reporting
      View ID: `finances-ar-reporting`
      Route: `/dashboard?view=finances-ar-reporting`
      Component: AccountsReceivableWorkspace
Accounts Payable
  Supplier Invoices
      View ID: `accounts-payable`
      Query: `{"section":"invoices"}`
      Route: `/dashboard?view=accounts-payable&section=invoices`
      Component: AccountsPayableWorkspace
  Approvals
      View ID: `accounts-payable`
      Query: `{"section":"approvals"}`
      Route: `/dashboard?view=accounts-payable&section=approvals`
      Component: AccountsPayableWorkspace
  Outstanding
      View ID: `accounts-payable`
      Query: `{"section":"outstanding"}`
      Route: `/dashboard?view=accounts-payable&section=outstanding`
      Component: AccountsPayableWorkspace
  Due Dates
      View ID: `accounts-payable`
      Query: `{"section":"due-dates"}`
      Route: `/dashboard?view=accounts-payable&section=due-dates`
      Component: AccountsPayableWorkspace
  Payments
      View ID: `finances-ap-payments`
      Route: `/dashboard?view=finances-ap-payments`
      Component: AccountsPayableWorkspace
Expenses
  My Expenses
      View ID: `expenses`
      Route: `/dashboard?view=expenses`
      Component: ExpensesHubWorkspace
  Add Expense
      View ID: `expenses`
      Query: `{"section":"add"}`
      Route: `/dashboard?view=expenses&section=add`
      Component: ExpensesHubWorkspace
  All Expenses
      View ID: `expenses`
      Query: `{"section":"all"}`
      Route: `/dashboard?view=expenses&section=all`
      Component: ExpensesHubWorkspace
  Approvals
      View ID: `expenses`
      Query: `{"section":"approvals"}`
      Route: `/dashboard?view=expenses&section=approvals`
      Component: ExpensesHubWorkspace
  Expense Runs
      View ID: `expenses`
      Query: `{"section":"runs"}`
      Route: `/dashboard?view=expenses&section=runs`
      Component: ExpensesHubWorkspace
  Configuration
      View ID: `expenses`
      Query: `{"section":"config"}`
      Route: `/dashboard?view=expenses&section=config`
      Component: ExpensesHubWorkspace
Banking & Cash
  Bank
      View ID: `wise`
      Route: `/dashboard?view=wise`
      Component: WiseWorkspace
  Cash Position
      View ID: `finances-banking-cash-position`
      Route: `/dashboard?view=finances-banking-cash-position`
      Component: FinancesBankingWorkspace
  Reconciliation
      View ID: `finances-banking-reconciliation`
      Route: `/dashboard?view=finances-banking-reconciliation`
      Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Planning & Management
  Budget
      View ID: `finances-planning-budget`
      Route: `/dashboard?view=finances-planning-budget`
      Component: FinancesPlanningWorkspace
  Actual vs Budget
      View ID: `finances-planning-actual-vs-budget`
      Route: `/dashboard?view=finances-planning-actual-vs-budget`
      Component: FinancesPlanningWorkspace
  Cash Flow
      View ID: `finances-planning-cash-flow`
      Route: `/dashboard?view=finances-planning-cash-flow`
      Component: FinancesPlanningWorkspace
  Forecast
      View ID: `finances-planning-forecast`
      Route: `/dashboard?view=finances-planning-forecast`
      Component: FinancesPlanningWorkspace
  KPIs
      View ID: `finances-planning-kpis`
      Route: `/dashboard?view=finances-planning-kpis`
      Component: FinancesPlanningWorkspace
  Management Accounts
      View ID: `finances-planning-management-accounts`
      Route: `/dashboard?view=finances-planning-management-accounts`
      Component: FinancesPlanningWorkspace
Financial Reports
    View ID: `financial-reports`
    Route: `/dashboard?view=financial-reports`
    Component: FinancialReportsWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- `GeneralLedgerWorkspace` in-page tabs (`accounts`, `trial`, `journal`) mirror LHS under General Ledger.
- `AccountsReceivableWorkspace` / `AccountsPayableWorkspace` / `ExpensesHubWorkspace` section filters via `filter` / `section` query params (also on LHS).
- `FinancialsWorkspace` dashboard tiles (`FINANCES_DASHBOARD_AREAS` in `finances-nav.ts`) — drill-down links, not separate LHS items.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

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
- `/api/financials/quotes/[id]/terms-pdf`
- `/api/financials/quotes/from-lead`
- `/api/financials/sales-quotes`
- `/api/financials/sales-quotes/compose-context`
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

**Database tables (migration/heuristic; presence ≠ user feature):**

- `accounts`
- `journal_entries`
- `invoices`

## Source Files

- `src/lib/finances-nav.ts`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 07. FUNDRAISING

**Code id:** `fundraising`  
**Catalogue display name:** FUNDRAISING  
**Sidebar section label:** Fundraising  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `fundraising-dashboard`
    Route: `/dashboard?view=fundraising-dashboard`
    Component: FundraisingDashboardHost
Investors
    View ID: `fundraising-investors`
    Route: `/dashboard?view=fundraising-investors`
    Component: FundraisingInvestorsHost
Cap Table Management
    View ID: `fundraising-cap-table`
    Route: `/dashboard?view=fundraising-cap-table`
    Component: FundraisingCapTableHost
Pipeline
    View ID: `fundraising-pipeline`
    Route: `/dashboard?view=fundraising-pipeline`
    Component: FundraisingPipelineHost
Meetings
    View ID: `fundraising-meetings`
    Route: `/dashboard?view=fundraising-meetings`
    Component: FundraisingMeetingsHost
Pitch Decks
    View ID: `fundraising-pitch-decks`
    Route: `/dashboard?view=fundraising-pitch-decks`
    Component: FundraisingPitchDecksHost
Data Rooms
    View ID: `fundraising-data-rooms`
    Route: `/dashboard?view=fundraising-data-rooms`
    Component: FundraisingDataRoomsHost
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- /api/fundraising

**Database tables (migration/heuristic; presence ≠ user feature):**

- `NOT ESTABLISHED — no dedicated fundraising tables in migration scan`

## Source Files

- `src/lib/platform-workspaces/central-product-nav.ts`
- `src/components/fundraising/*Host.tsx`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 08. BOARD

**Code id:** `board`  
**Catalogue display name:** BOARD  
**Sidebar section label:** Board  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `board-dashboard`
    Route: `/dashboard?view=board-dashboard`
    Component: BoardGovernanceWorkspace
Meetings
    View ID: `board-meetings`
    Route: `/dashboard?view=board-meetings`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Minutes & Decisions
    View ID: `board-minutes`
    Route: `/dashboard?view=board-minutes`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Board Members
    View ID: `board-members`
    Route: `/dashboard?view=board-members`
    Component: BoardGovernanceWorkspace
Board deck
    View ID: `board-pack`
    Route: `/dashboard?view=board-pack`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Risk Register
    View ID: `corporate-risk-register`
    Route: `/dashboard?view=corporate-risk-register`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- /api/board

**Database tables (migration/heuristic; presence ≠ user feature):**

- `board_directors`

## Source Files

- `central-product-nav buildCentralBoardNavSection`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 09. CORPORATE INFORMATION

**Code id:** `corporate-information`  
**Catalogue display name:** CORPORATE INFORMATION  
**Sidebar section label:** Corporate Information  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `corporate-dashboard`
    Route: `/dashboard?view=corporate-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Company Information
    View ID: `corporate-company-details`
    Route: `/dashboard?view=corporate-company-details`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Office Locations
    View ID: `office-locations`
    Route: `/dashboard?view=office-locations`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Bank Accounts
    View ID: `corporate-bank-accounts`
    Route: `/dashboard?view=corporate-bank-accounts`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Professional Advisors
    View ID: `corporate-advisers`
    Route: `/dashboard?view=corporate-advisers`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Contracts
    View ID: `corporate-contracts`
    Route: `/dashboard?view=corporate-contracts`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/company-details`
- `/api/company-details/[id]`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `company_details`

## Source Files

- `buildCentralCorporateInformationNavSection`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 10. OPERATIONS

**Code id:** `operations`  
**Catalogue display name:** OPERATIONS  
**Sidebar section label:** Operations  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `operations-dashboard`
    Route: `/dashboard?view=operations-dashboard`
    Component: OperationsDashboardWorkspace
Assets
    View ID: `assets`
    Route: `/dashboard?view=assets`
    Component: div
Inventory
    View ID: `inventory-management`
    Route: `/dashboard?view=inventory-management`
    Component: WorkspaceErrorBoundary
Procurement
    View ID: `procurement`
    Route: `/dashboard?view=procurement`
    Component: WorkspaceErrorBoundary
Logistics
    View ID: `logistics`
    Route: `/dashboard?view=logistics`
    Component: LogisticsWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/procurement/dashboard`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `procurement_purchase_orders`

## Source Files

- `internal-operations-data Operations section`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 11. MARKETING AND EVENTS

**Code id:** `marketing-events`  
**Catalogue display name:** MARKETING AND EVENTS  
**Sidebar section label:** Marketing & Events  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `oa-marketing-dashboard`
    Route: `/dashboard?view=oa-marketing-dashboard`
    Component: MarketingViewHost (isMarketingModuleView)
Digital Newsletter
    View ID: `marketing-newsletter`
    Route: `/dashboard?view=marketing-newsletter`
    Component: MarketingViewHost
External Events
    View ID: `marketing-events`
    Route: `/dashboard?view=marketing-events`
    Component: MarketingViewHost
Event Management
    View ID: `marketing-event-management`
    Route: `/dashboard?view=marketing-event-management`
    Component: MarketingViewHost
Mailing List
    View ID: `marketing-mailing-list`
    Route: `/dashboard?view=marketing-mailing-list`
    Component: MarketingViewHost
Client Stories
    View ID: `portfolio-stories`
    Route: `/dashboard?view=portfolio-stories`
    Component: MarketingViewHost
Social
    View ID: `social`
    Route: `/dashboard?view=social`
    Component: MarketingViewHost
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/marketing/bundle`
- `/api/marketing/dashboard`
- `/api/marketing/resources/[resource]`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `marketing_campaigns`

## Source Files

- `buildCentralMarketingEventsNavSection`
- `src/lib/marketing/views.ts`
- `src/components/marketing/MarketingViewHost`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 12. TECHNOLOGY MANAGEMENT

**Code id:** `technology-management`  
**Catalogue display name:** TECH MGMT  
**Sidebar section label:** Technology Management  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `technology-dashboard`
    Route: `/dashboard?view=technology-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Architecture Diagrams
    View ID: `technology-architecture`
    Route: `/dashboard?view=technology-architecture`
    Component: TechnologyArchitectureWorkspace
Technology Assets
    View ID: `technology-devices`
    Route: `/dashboard?view=technology-devices`
    Component: div
Software & SaaS Dashboard
    View ID: `technology-software-dashboard`
    Route: `/dashboard?view=technology-software-dashboard`
    Component: SoftwareSaasDashboardWorkspace
Software & SaaS
    View ID: `technology-software`
    Route: `/dashboard?view=technology-software`
    Component: TechnologySoftwareWorkspace
Telecommunications
    View ID: `technology-telecommunications`
    Route: `/dashboard?view=technology-telecommunications`
    Component: TelecommunicationsWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/software-assets`
- `/api/software-assets/[id]`
- `/api/software-assets/[id]/files`
- `/api/software-assets/[id]/reveal-password`
- `/api/technology/telecom`
- `/api/technology/telecom/[id]`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `software_asset_register`

## Source Files

- `internal-operations-data Technology Management`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 13. HUMAN RESOURCES

**Code id:** `human-resources`  
**Catalogue display name:** HUMAN RESOURCES  
**Sidebar section label:** Human Resources  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `hr-dashboard`
    Route: `/dashboard?view=hr-dashboard`
    Component: HrWorkspace
Employees
    View ID: `hr`
    Route: `/dashboard?view=hr`
    Component: HrWorkspace
Org Chart
    View ID: `hr-org-chart`
    Route: `/dashboard?view=hr-org-chart`
    Component: OrgChartWorkspace
Recruitment
    View ID: `hr-recruitment`
    Route: `/dashboard?view=hr-recruitment`
    Component: RecruitmentWorkspace
Time & Attendance
    View ID: `hr-leave`
    Route: `/dashboard?view=hr-leave`
    Component: LeaveManagementWorkspace
Payroll
    View ID: `hr-payroll`
    Route: `/dashboard?view=hr-payroll`
    Component: PayrollWorkspace
Performance
    View ID: `hr-performance`
    Route: `/dashboard?view=hr-performance`
    Component: PerformanceHubWorkspace
HR Reports
    View ID: `hr-reports`
    Route: `/dashboard?view=hr-reports`
    Component: HrReportsWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

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

**Database tables (migration/heuristic; presence ≠ user feature):**

- `hr_employees`

## Source Files

- `internal-operations-data Human Resources`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 14. BUSINESS PRODUCTIVITY

**Code id:** `business-productivity`  
**Catalogue display name:** BUSINESS PROD  
**Sidebar section label:** Business Productivity  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `productivity-dashboard`
    Route: `/dashboard?view=productivity-dashboard`
    Component: ProductivityDashboardWorkspace
Content Studio
    View ID: `content-studio`
    Route: `/dashboard?view=content-studio`
    Component: ContentStudioWorkspace
Internal Work Packages
    View ID: `internal-work-packages`
    Route: `/dashboard?view=internal-work-packages`
    Component: InternalWorkPackagesWorkspace
File Explorer
  Internal Files
      View ID: `files-internal`
      Route: `/dashboard?view=files-internal`
      Component: FilesInternalWorkspace
  External Files
      View ID: `files-external`
      Route: `/dashboard?view=files-external`
      Component: FileRepositoryWorkspace
  Client Explorer
      View ID: `files-client`
      Route: `/dashboard?view=files-client`
      Component: ClientFilesExplorerWorkspace
Email
    View ID: `info-email`
    Route: `/dashboard?view=info-email`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Calendar
    View ID: `calendar`
    Route: `/dashboard?view=calendar`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Messaging
    View ID: `messaging`
    Route: `/dashboard?view=messaging`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Communications
    View ID: `communications`
    Route: `/dashboard?view=communications`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Whiteboard
    View ID: `whiteboard`
    Route: `/dashboard?view=whiteboard`
    Component: WhiteboardWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/calendar/events`
- `/api/calendar/events/[id]`
- `/api/calendar/meetings/[eventId]`
- `/api/calendar/meetings/[eventId]/transcript`
- `/api/calendar/meetings/[eventId]/webrtc`
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

**Database tables (migration/heuristic; presence ≠ user feature):**

- `internal_files`
- `internal_messaging`

## Source Files

- `buildCentralBusinessProductivityNavSection`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 15. SUPPORT DESK

**Code id:** `support-desk`  
**Catalogue display name:** SUPPORT DESK  
**Sidebar section label:** Support Desk  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Ticket Overview
    View ID: `support-overview`
    Route: `/dashboard?view=support-overview`
    Component: SupportWorkspace
Tickets
    View ID: `support`
    Route: `/dashboard?view=support`
    Component: SupportWorkspace
My support tickets
    View ID: `support-mine`
    Route: `/dashboard?view=support-mine`
    Component: SupportWorkspace
WhatsApp Integration
    View ID: `whatsapp-integration`
    Route: `/dashboard?view=whatsapp-integration`
    Component: WorkspaceErrorBoundary
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/support/tickets`
- `/api/support/tickets/[id]`
- `/api/support/tickets/[id]/assign`
- `/api/support/tickets/[id]/client-update`
- `/api/support/tickets/[id]/close`
- `/api/support/tickets/[id]/lounge-messages`
- `/api/whatsapp/inbound`
- `/api/whatsapp/support-flow/assign`
- `/api/whatsapp/support/reset`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `support_tickets`

## Source Files

- `internal-operations-data Support Desk`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 16. PROJECT MANAGEMENT

**Code id:** `project-management`  
**Catalogue display name:** PROJECT MANAGEMENT  
**Sidebar section label:** Project Management  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `projects-dashboard`
    Route: `/dashboard?view=projects-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Internal Projects
    View ID: `projects-internal`
    Route: `/dashboard?view=projects-internal`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
External Projects
    View ID: `projects-external`
    Route: `/dashboard?view=projects-external`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/projects`
- `/api/projects/[id]`
- `/api/projects/[id]/tasks`
- `/api/projects/[id]/tasks/[taskId]`
- `/api/projects/bulk-delete`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `internal_projects`

## Source Files

- `src/lib/project-management-nav.ts`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 17. ENGINEERING

**Code id:** `engineering`  
**Catalogue display name:** ENGINEERING  
**Sidebar section label:** Engineering  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `engineering-dashboard`
    Route: `/dashboard?view=engineering-dashboard`
    Component: EngineeringDashboardHost (engineering || engineering-dashboard)
Programs & Milestones
    View ID: `engineering-programs`
    Route: `/dashboard?view=engineering-programs`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Team & Capacity
    View ID: `engineering-capacity`
    Route: `/dashboard?view=engineering-capacity`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Risks
    View ID: `engineering-risks`
    Route: `/dashboard?view=engineering-risks`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Technical Files
    View ID: `engineering-technical-files`
    Route: `/dashboard?view=engineering-technical-files`
    Component: WorkspaceErrorBoundary
SOPs
  Dashboard
      View ID: `engineering-sops-dashboard`
      Route: `/dashboard?view=engineering-sops-dashboard`
      Component: EngineeringSopRouter
  SOP Library
      View ID: `engineering-sops-library`
      Route: `/dashboard?view=engineering-sops-library`
      Component: EngineeringSopRouter
  My Tasks
      View ID: `engineering-sops-tasks`
      Route: `/dashboard?view=engineering-sops-tasks`
      Component: EngineeringSopRouter
  Active Runs
      View ID: `engineering-sops-runs`
      Route: `/dashboard?view=engineering-sops-runs`
      Component: EngineeringSopRouter
  Reviews & Approvals
      View ID: `engineering-sops-reviews`
      Route: `/dashboard?view=engineering-sops-reviews`
      Component: EngineeringSopRouter
  SOP Templates
      View ID: `engineering-sops-templates`
      Route: `/dashboard?view=engineering-sops-templates`
      Component: EngineeringSopRouter
  Reports
      View ID: `engineering-sops-reports`
      Route: `/dashboard?view=engineering-sops-reports`
      Component: EngineeringSopRouter
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

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

**Database tables (migration/heuristic; presence ≠ user feature):**

- `engineering_technical_files`
- `engineering_sops`

## Source Files

- `buildCentralEngineeringNavSection`
- `src/lib/engineering-nav.ts`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 18. TRAINING

**Code id:** `training`  
**Catalogue display name:** TRAINING  
**Sidebar section label:** Training  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `training-dashboard`
    Route: `/dashboard?view=training-dashboard`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Course Builder
    View ID: `course-builder`
    Route: `/dashboard?view=course-builder`
    Component: CourseBuilderWorkspace
Courses
  Staff Courses
      View ID: `training`
      Route: `/dashboard?view=training`
      Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
  External Courses
      View ID: `training-external`
      Route: `/dashboard?view=training-external`
      Component: ExternalTrainingWorkspace
  QMS Courses
      View ID: `qms-training`
      Route: `/dashboard?view=qms-training`
      Component: QmsTrainingWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

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

**Database tables (migration/heuristic; presence ≠ user feature):**

- `lms_courses`
- `lms_enrolments`

## Source Files

- `internal-operations-data Training`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 19. QMS

**Code id:** `qms`  
**Catalogue display name:** QMS  
**Sidebar section label:** QMS  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `quality-management`
    Route: `/dashboard?view=quality-management`
    Component: QualityManagementWorkspace
Document Control
    View ID: `qms-document-control`
    Route: `/dashboard?view=qms-document-control`
    Component: DocumentControlWorkspace
CAPA
    View ID: `qms-capa`
    Route: `/dashboard?view=qms-capa`
    Component: CapaWorkspace
Internal Audits
    View ID: `qms-internal-audits`
    Route: `/dashboard?view=qms-internal-audits`
    Component: InternalAuditsWorkspace
Management Review
    View ID: `qms-management-review`
    Route: `/dashboard?view=qms-management-review`
    Component: ManagementReviewWorkspace
Reporting
    View ID: `qms-reports`
    Route: `/dashboard?view=qms-reports`
    Component: TqmsReportsWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- /api/qms

**Database tables (migration/heuristic; presence ≠ user feature):**

- `qa_workspace_tasks`

## Source Files

- `internal-operations-data QMS`
- `src/components/qms/*`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 20. TOOLS

**Code id:** `tools`  
**Catalogue display name:** TOOLS  
**Sidebar section label:** Tools  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Website Management
    View ID: `website-management`
    Route: `/dashboard?view=website-management`
    Component: WebsiteManagementWorkspace
Integrations
    View ID: `integrations`
    Route: `/dashboard?view=integrations`
    Component: WorkspaceErrorBoundary
Testing
    View ID: `testing`
    Route: `/dashboard?view=testing`
    Component: div
Telemetry
    View ID: `telemetry`
    Route: `/dashboard?view=telemetry`
    Component: TelemetryDashboard
Users
    View ID: `users`
    Route: `/dashboard?view=users`
    Component: UserManagementWorkspace
Unit311 Support
    View ID: `unit311-support`
    Route: `/dashboard?view=unit311-support`
    Component: WorkspaceErrorBoundary
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/integrations/catalog`
- `/api/integrations/connections`
- `/api/integrations/connections/[providerCode]`
- `/api/integrations/connections/[providerCode]/test`
- `/api/integrations/providers`
- `/api/telemetry`
- `/api/telemetry/records`
- `/api/users`
- `/api/users/[id]`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `integrations`
- `telemetry`

## Source Files

- `internal-operations-data Tools`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 21. EXTERNAL CLIENT ACCESS

**Code id:** `external-client-access`  
**Catalogue display name:** EXTERNAL CLIENT ACCESS  
**Sidebar section label:** External Client Access  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Dashboard
    View ID: `external-client-access`
    Route: `/dashboard?view=external-client-access`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
External Users
    View ID: `users-external`
    Route: `/dashboard?view=users-external`
    Component: ExternalUsersWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

- `/api/external-users`
- `/api/external-users/[id]`

**Database tables (migration/heuristic; presence ≠ user feature):**

- `platform_users`

## Source Files

- `internal-operations-data External Client Access`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# 22. SETTINGS

**Code id:** `settings`  
**Catalogue display name:** SETTINGS  
**Sidebar section label:** Settings  

## Current User-Facing Structure

Navigation (A) and URL-addressable leaves (B) from central catalogue:

```
Profile
    View ID: `profile`
    Route: `/dashboard?view=profile`
    Component: ProfileWorkspace
General
    View ID: `settings`
    Route: `/dashboard?view=settings`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Billing
    View ID: `billing`
    Route: `/dashboard?view=billing`
    Component: [UNVERIFIED — no direct activeView === match in InternalOperationsDashboard.tsx]
Appearance
    View ID: `appearance`
    Route: `/dashboard?view=appearance`
    Component: AppearanceSettingsWorkspace
```

## Internal Features

Functionality inside a mounted workspace that is **not** its own LHS catalogue leaf (category C). [UNVERIFIED] where not extracted from code in this pass:

- [UNVERIFIED] — module-specific in-page controls not enumerated in this extraction pass.

## Technical Functionality — NOT NECESSARILY USER-FACING

**API handlers (prefix association only; presence ≠ exposed nav item):**

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

**Database tables (migration/heuristic; presence ≠ user feature):**

- `platform_organisations`

## Source Files

- `internal-operations-data Settings`
- `src/components/testflighthub/InternalOperationsDashboard.tsx`
- `src/components/testflighthub/SurveyOperationsShell.tsx`

---

# Legacy / Deprecated / Unused

## Alternate navigation source (legacy host layout)

- `internalSurveyNavSections` in `src/lib/internal-operations-data.ts` — used for some internal hosts; **differs** from the 22-module central catalogue (e.g. embeds Project Management + Grants near Business Central; omits standalone Intelligence/Fundraising/Board blocks).

## Views with renderers in InternalOperationsDashboard but NOT in Core catalogue nav (22)

[TECHNICAL — NOT CURRENT CORE USER-FACING NAV] — may appear on specialist hosts, deep links, or legacy:

- `design-mockups` → `InternalDesignMockups`
- `client-onboarding` → `ClientOnboardingWorkspace`
- `fleet` → `FleetWorkspace`
- `qa-tasks` → `QaTasksWorkspace`
- `projects` → `GrantsWorkspace`
- `recent-missions` → `RecentMissionsPanel`
- `webodm` → `WebODMWorkspace`
- `sales-quotes` → `SalesQuotesWorkspace`
- `crm-questions-test` → `CrmQuestionsTestWorkspace`
- `connections` → `ConnectionsWorkspace`
- `representatives` → `RepresentativesWorkspace`
- `strategy` → `StrategyWorkspace`
- `potential-clients` → `PotentialClientsWorkspace`
- `competitors` → `WorkspaceErrorBoundary`
- `sector` → `SectorWorkspace`
- `corporate-information` → `CorporateInformationWorkspace`
- `learning-library` → `WorkspaceErrorBoundary`
- `training-certifications` → `WorkspaceErrorBoundary`
- `company-progress` → `WorkspaceErrorBoundary`
- `unit311-details` → `Unit311DetailsWorkspace`
- `module-go-live` → `ModuleGoLiveWorkspace`
- `website-uk-pavilion` → `WorkspaceErrorBoundary`
- `engineering-resources` → `EngineeringResourcesWorkspace`
- `technology` → `TechnologyDashboardWorkspace`
- `technology-infrastructure` → `TechnologyPlaceholderWorkspace`
- `technology-reports` → `TechnologyPlaceholderWorkspace`
- `technology-settings` → `TechnologyPlaceholderWorkspace`
- `saec-installations-dashboard` → `SaecInstallationsDashboardWorkspace`
- `saec-installations-elevators` → `SaecInstallationsElevatorsWorkspace`
- `saec-installations-escalators` → `SaecInstallationsEscalatorsWorkspace`
- `wolf-estate` → `WolfEstateDashboard`
- `wolf-safari-parks` → `WolfSafariParksWorkspace`
- `wolf-animals` → `WolfAnimalsSummaryWorkspace`
- `wolf-containment` → `WolfContainmentSummaryWorkspace`
- `wolf-environment` → `WolfEnvironmentSummaryWorkspace`
- `wolf-drone-operations` → `WolfDroneSummaryWorkspace`
- `wolf-fleet` → `WolfFleetSummaryWorkspace`
- `wolf-ai-wildlife-vision` → `WolfAiWildlifeVisionDemo`
- `oa-supply-dependencies` → `ProcurementWorkspace`
- `oa-assurance-certification` → `EngineeringAssuranceWorkspace`
- `oa-engineering-integrations` → `EngineeringIntegrationsWorkspace`
- `oa-test-plans` → `OnwardAirPlaceholderWorkspace`
- `oa-test-runs` → `OnwardAirPlaceholderWorkspace`
- `oa-defects` → `OnwardAirPlaceholderWorkspace`
- `oa-uat-tracking` → `OnwardAirPlaceholderWorkspace`
- `oa-platform-health` → `OnwardAirPlaceholderWorkspace`
- `oa-monitoring` → `OnwardAirPlaceholderWorkspace`
- `oa-incident-management` → `OnwardAirPlaceholderWorkspace`
- `oa-change-management` → `OnwardAirPlaceholderWorkspace`
- `oa-release-tracking` → `OnwardAirPlaceholderWorkspace`
- `oa-ip-overview` → `WorkspaceErrorBoundary`
- `oa-ip-dashboard` → `WorkspaceErrorBoundary`
- `oa-ip-register` → `WorkspaceErrorBoundary`
- `oa-ip-portfolio` → `WorkspaceErrorBoundary`
- `oa-ip-documents` → `WorkspaceErrorBoundary`
- `oa-ip-search` → `WorkspaceErrorBoundary`
- `annual-impact-report` → `WorkspaceErrorBoundary`
- `quarterly-portfolio-update` → `WorkspaceErrorBoundary`
- `funds-dashboard` → `WorkspaceErrorBoundary`
- `portfolio-course-management` → `WorkspaceErrorBoundary`

## Provisioning-only catalogue leaves (not in central nav tree)

From `augmentIntelligenceCatalogueSubModules` / `augmentFundraisingCatalogueSubModules` in `module-catalogue.ts`: Member Intelligence, regulatory views, Grant Management (`grants`) — [TECHNICAL — NOT IN CENTRAL LHS TREE].

# Discrepancies / Ambiguities

1. **Catalogue module label vs sidebar:** e.g. catalogue **MARKETING AND EVENTS** vs section **Marketing & Events**; **TECH MGMT** vs **Technology Management**; **BUSINESS PROD** vs **Business Productivity**.
2. **Intelligence view ids** use `demo-*` prefix while module is production catalogue — routing branches on `isDemoSurface` / `IntelligenceCentralWorkspace` vs `NorthstarIntelligenceRouter`.
3. **Information Repository** mounts `InterfaceWorxInformationRepositoryWorkspace` — naming suggests Interface Worx variant; still the central BC leaf.
4. **business-central-dashboard** mounts `WorkspaceBusinessCentralDashboard` (default), `NorthstarBusinessCentralDashboard` (demo), `OnwardAirBusinessCentralDashboard`, or `SaecBusinessCentralDashboard` by host.
5. **Runtime visibility** requires workspace `enabledModules` / `enabledSubModules`; `AccessViewGuard` redirects disallowed views to `home`.
6. **Customer generic host** (`/ws/[slug]`) placeholder is not this 22-module shell — specialist slugs rewrite to `/internaldashboard`.
7. **MARKETING_MODULE_VIEWS** includes views (e.g. `marketing-abhi-events`) **not** in central 7-item marketing nav — [TECHNICAL — NOT CORE CATALOGUE NAV].
8. **PLATFORM_MODULE_REGISTER.md** (2026-07-21) conflicts with current nav/code — [LEGACY / DOCUMENTATION ONLY] for readiness status.

# Summary

- **Core modules:** 22
- **Top-level navigation items (features per module, summed):** 110
- **Nested navigation groups (parent labels with children):** 14
- **Navigation leaves (selectable destinations, including repeated view ids with different query):** 157
- **Distinct view IDs in Core catalogue leaves:** 128
- **API route handlers (repository total):** 417 under `/api` — **not** module-attributed exhaustively in this document
- **Database tables:** total public tables from migrations not re-counted here; per-module lists are heuristic partial sets only

---

**CURRENT USER-FACING STRUCTURE EXTRACTED FROM CODE — NO DESIGN CHANGES APPLIED.**
