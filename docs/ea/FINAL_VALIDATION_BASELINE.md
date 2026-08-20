# EA Final Validation Baseline (pre-fix, commit 1480a26)

Recorded before final-fix phase implementation.

## Failed / partial (validation 2026-08-20)

| ID | Issue | Classification |
|----|-------|----------------|
| fv-driving | "What is driving the change in our financial position?" → `financials.cashPosition.read` only | Architectural — investigation planner missed analytical phrasing |
| fv-compare | "Compare sales vs financial performance…" → cash KPI only | Architectural — domain signals missed "financial performance" |
| fv-mgmt | "Management should know this month" → `queryBusiness` stub | Architectural — no management briefing investigation |
| perm-sales-compare | sales_rep cross-module compare → CRM only, no refusal | Permission — silent partial answer |
| perm-employee-bankrupt | Employee + cash/AR ask → no explicit financial restriction notice | Permission — weak limitation messaging |
| workspace-slug | onwardair/talanton slug on demo API returned demo £1,786,600 cash | Workspace — `getCashPosition` ignored workspace scope |
| live-chat | `/api/executive-assistant/chat` 401 without session; runtime used GPT not deterministic synthesis | Runtime parity — unproven equivalence |
| prove:onwardair-ea | server-only import failure in local suite | Test harness |

## Passing at baseline

- Demo standard 33/33, blind 10/10
- Bankruptcy / warning signs / board PDF investigation paths
- Composite multi-metric charts (when triggered)
