# Technical debt & repository improvements

Snapshot prepared for long-term SaaS development of Unit311 Central (single repo).  
**No application behaviour was changed as part of this hygiene pass.**

## Completed in this hygiene pass

- Strengthened `.gitignore` (env dumps, PEMs, `wise-keys/`, deploy logs, `scripts/_*.mjs`, Cursor local state).
- Removed local obsolete artifacts: `scripts/_*.mjs` dump/inspect helpers, env secret tmp files, deploy log, empty App Router shells (`src/app/telemetry`, `src/app/testflighthub`, `src/app/api/auth/session`), stale `docs/folder-structure.txt`.
- Documented env vars in `.env.example`.
- Added root docs: `README.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`.
- Confirmed no `.env*` / `*.pem` files are git-tracked.

## Secrets hygiene (ongoing)

| Item | Status | Action |
| --- | --- | --- |
| Tracked `.env` / PEMs | Clean (none tracked) | Keep `.gitignore` strict |
| Local root `.env*` dumps | Often present on developer disks | Prefer Vercel as source of truth; delete local copies when unused |
| `wise-keys/*.pem` | Local only (ignored) | Never stage; rotate if ever exposed |
| Ops dump scripts | Removed locally + ignored | Do not reintroduce |

## Structural debt

| Item | Severity | Notes |
| --- | --- | --- |
| Folder name `src/components/testflighthub/` | Medium | Still the live Internal UI; rename later with a deliberate PR |
| Legacy path `/testflighthub` | Low | Redirect + middleware keep compatibility |
| Demo route `/test1` + Venturi client shells | Medium | Keep until replaced by real customer workspace product |
| Large binaries in `public/` / `docs/` (~130MB+ tracked media) | Medium | Prefer CDN / Git LFS for new large assets |
| `mobile/` still partly BCN-branded | Low | Update when Android product is prioritised |
| Dirty working tree (hundreds of local changes) | High (ops) | Split into intentional commits; avoid `git add .` |

## Product / tenancy debt

| Item | Severity | Notes |
| --- | --- | --- |
| Application not yet workspace-aware | High | Queries still rely on Phase 1 DB defaults → Internal |
| Customer workspace product UI | High | Host gateway + placeholders only |
| RLS not enabled | Medium | Correct — wait for app workspace context |
| `workspace_users` empty / no auth binding | Medium | Planned later phase |
| Wildcard DNS `*.unit311central.com` | Medium | App-ready; must be configured in Vercel/DNS |

## Engineering practice debt

| Item | Severity | Notes |
| --- | --- | --- |
| No automated test suite | High | Add critical path tests (auth, payments, tenancy) |
| Limited CI | Medium | Only Android APK workflow; add lint/build on PRs |
| `/api/internal/*` migration/debug routes | Medium | Secret-gated; tighten further for SaaS hardening |
| Messaging config API returns anon key to client | Medium | Review exposure model |
| Typo route `resetpassowrd` | Low | Keep redirect until all links updated |

## Recommended next improvements (priority order)

1. Commit documentation + hygiene with a clean PR (exclude secrets and huge unused videos).
2. Finish Vercel wildcard domain + DNS (see `DEPLOYMENT.md`).
3. Add GitHub Actions: `lint` + `build` on pull requests.
4. Plan Phase 2 application workspace context (see workspace architecture doc).
5. Introduce a staged rename `testflighthub` → product-aligned folder once calm.
6. Move large media off the git history over time (LFS or object storage).

## Explicit non-goals of the hygiene pass

- No multi-repo split
- No business logic / auth / CRM / billing changes
- No customer workspace product implementation
