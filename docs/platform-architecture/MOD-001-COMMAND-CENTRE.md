# MOD-001 — Executive Dashboard (Command Centre v2)

| Field | Value |
| --- | --- |
| **Wave ID** | MOD-001 |
| **Module** | MOD-001 Dashboard |
| **Domain** | DOM-01 Home |
| **Status** | **READY** |
| **Completion date** | 2026-07-21 |
| **Purpose** | Configurable executive command centre — primary Unit311 Central home workspace |

---

## Delivered

- Responsive dashboard grid (4 / 3 / 2 / 1 columns)
- Per-user customisable layout: add, remove, hide, reorder, resize, collapse, reset
- **Customize Dashboard** edit mode + tile picker
- Full catalog of operational tiles (Action Required, Schedule, Snapshot, Activity, My Work, Quick Actions, finance/HR/CRM/files/system tiles, etc.)
- Independent async data loading via `CommandCentreDataProvider` (shell paints immediately; tiles hydrate as slices arrive)
- Live data where APIs exist; honest empty states otherwise (no fake charts / lorem)

## Key files

- `src/components/testflighthub/InternalDashboardHome.tsx`
- `src/components/testflighthub/CommandCentreDataProvider.tsx`
- `src/components/testflighthub/command-centre/CommandCentreTileBody.tsx`
- `src/lib/command-centre-layout.ts`
- `src/lib/home-executive-dashboard.ts`

## Persistence

`localStorage` key `unit311-command-centre-v2:{username}` — layout, sizes, collapsed state, hidden types.
