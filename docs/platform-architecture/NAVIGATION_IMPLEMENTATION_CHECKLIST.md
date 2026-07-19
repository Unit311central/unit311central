# Navigation Implementation Checklist

| Field | Value |
| --- | --- |
| **Status** | **IMPLEMENTED** (2026-07-19) |
| **Blueprint** | [INTERNAL_NAVIGATION_BLUEPRINT.md](./INTERNAL_NAVIGATION_BLUEPRINT.md) (**APPROVED**) |
| **Amendments applied** | (1) No routes removed (2) Placeholders marked “Coming Soon” / “Uses current implementation” |

---

## Constraints (confirmed)

- Navigation refactor only — no business logic, DB, APIs, permissions, workflows, module redesign, or schema changes.
- Existing URLs remain reachable (`?view=…` and hard paths).
- Shared nav leaves open the existing module with a clear banner.

---

## Verification results

| Check | Result |
| --- | --- |
| Every sidebar leaf has a view/href | Pass (59 leaves, 0 duplicate views) |
| Client Onboarding under CRM only | Pass |
| Unit311 Details under Corporate only | Pass |
| Strategy / Insurance / WhatsApp not in sidebar | Pass |
| Legacy `?view=projects`, `?view=engineering`, `?view=corporate-insurance`, `?view=board-pack` still resolve | Pass (routes kept) |
| `/client-onboarding` hard path | Pass (unchanged) |
| Typecheck | Pass (`tsc --noEmit`) |

---

## Before / after (summary)

See [NAVIGATION_BEFORE_AFTER.md](./NAVIGATION_BEFORE_AFTER.md).

---

## Files changed

- `src/lib/internal-operations-data.ts` — nav tree, view ids, titles/subtitles, active-state helpers
- `src/components/testflighthub/InternalOperationsDashboard.tsx` — render aliases + implementation notices + Coming Soon copy
