# MOD-600 / MOD-610 / MOD-620 — Engineering, Website Management, External Client Access

Program labels map to catalogue IDs:

| Program | Catalogue | Workspace |
| --- | --- | --- |
| MOD-600 Engineering Dashboard | MOD-140 | `engineering-dashboard` |
| MOD-601 Engineering Resource Planning | MOD-141 | `engineering-resources` (+ `engineering-capacity`) |
| MOD-610 Website Management | MOD-150 | `website-management` |
| MOD-620 External Client Access | MOD-160 | `external-client-access` |

## Architecture

- Mock stores mirror future API shapes (`engineering-*`, `website-management-*`, `external-client-access-*`).
- Shared UI chrome: `domain-workspace-ui.tsx` (does not replace `workspace-chrome.tsx`).
- Website connect wizard upserts Integration Framework providers `cms.wordpress` / `cms.other` (migration `099_website_cms_integration_providers.sql`).
- External Client Access configures portals only; identities remain in External Users (MOD-161).

## Go-Live

Defaults set Ready for MOD-140, MOD-141, MOD-150, MOD-160.
