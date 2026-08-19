# EA Live Acceptance Report (engine stabilisation pass)

**Date:** 2026-08-19  
**Production baseline:** `02a1564` (unchanged — fixes below are **local only**, not deployed)  
**Scope:** Engine fixes 1–7 per stabilisation order. **No** 200-capability expansion.

## Summary

| Area | Status |
|------|--------|
| HR headcount (demo) | **Fixed** — 25 employees via Northstar fixtures (`listHrEmployeesForAssistant`) |
| `headcount` routing | **Fixed** — `matchesHeadcountCapability` + legacy scorer precedence |
| Cash synonyms (`What's in the bank?`) | **Fixed** — extended `isLiveFinancialBalanceQuestion` |
| Charts (revenue, rev vs expenses, AR, cash, sales) | **Fixed** — `getFinancialChartData` + 5 chart capabilities + demo financial fallback |
| PDFs (`revenue and expenses`, financial position, AR, executive summary) | **Fixed** — `revenue`/`expenses` metrics, composite NL mappings, report-without-`pdf` detection |
| Cross-module evidence | **Improved** — `planCrossModuleEvidence` (sales↔revenue); composite multi-tool preserved |
| Clarification | **Fixed** — `How are we doing?`, `What is the situation?`; bank/headcount/chart excluded |
| Permission-negative acceptance | **Added** — executive/manager/employee/sales_rep profiles + commission gate |
| Action mutation acceptance | **Scaffold only** — route check for create-client; no DB verify yet |
| 577-question bank triage | **Not started** (item 8) |

## Local acceptance (demo workspace, `EA_ACCEPTANCE_LIVE=1`)

**41 / 45 PASS** (routing + live tool execution in Node CLI with header mocks)

### Remaining failures (4)

All four are **live tool execution errors** in the local CLI harness (no authenticated Supabase session / empty workspace tables), not routing regressions:

| Case | Failure |
|------|---------|
| `semantic-demo-finance.invoices.overdue.read` | No substantive overdue-invoice data returned |
| `semantic-demo-crm.pipeline.summary.read` | `searchCRM` tool status `error` |
| `semantic-demo-crm.clients.count.read` | `searchClients` tool status `error` |
| `semantic-demo-project-management.projects.count.read` | `searchProjects` tool status `error` |

These require production API re-run or local Supabase seeding to confirm PASS.

### Previously failing items now passing (demo local)

- Headcount: `How many employees do we have?` → 25  
- `headcount` → `hr.employees.count.read`  
- Charts: revenue 12m, revenue vs expenses, cash over last year  
- PDFs: revenue+expenses, financial position, AR report, executive financial summary  
- Cross-module: overdue invoices + open tickets (composite multi-tool)  
- Cross-module: sales affecting revenue → `evidence_gpt`  
- Clarification: performance / how are we doing / situation  
- Bank balance does **not** clarify  
- Permission: sales rep commissions denied; employee cash denied; cross-workspace Talanton denied  

## Production verification

**Not run** — per task rule, no push/deploy until review. After deploy, re-run:

- `EA_ACCEPTANCE_LIVE=1 npm run prove:ea-acceptance` (all workspaces)
- Production `demo` / `abhi` EA test APIs
- Confirm headcount ≠ 0 on demo production host

## Next (after deploy + production pass)

1. Re-run full 101 structured + phase probes on production APIs  
2. Triage 577-question bank (A–E classification) — do not weaken assertions  
3. Complete action mutation tests with safe fixtures + DB re-read  
4. Only then: systematic 200-capability fill from coverage matrix  
