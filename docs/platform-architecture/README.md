# Platform Architecture — Reference Models

This folder holds **approved Platform Reference Models (PRM)** and the **module implementation tracker** for Unit311 Central.

## Baseline (frozen)

| Artifact | Status |
| --- | --- |
| [PRM-001 – Client](./PRM-001-CLIENT.md) | **LOCKED** |
| [PRM-002 – Workspace](./PRM-002-WORKSPACE.md) | **LOCKED** |
| [Internal Navigation Blueprint](./INTERNAL_NAVIGATION_BLUEPRINT.md) | **APPROVED / IMPLEMENTED** |
| Navigation implementation | **COMPLETE / FROZEN** |
| [Platform Module Register](./PLATFORM_MODULE_REGISTER.md) | **ACTIVE** — master tracker |

**Navigation is frozen.** Do not make further structural sidebar changes unless explicitly approved in a future architecture review. All subsequent work is **module-centric** (FDR → approve → implement → verify → close).

## Rules

1. Every module Functional Design Review must conform to locked PRMs.
2. If a later module conflicts with a locked PRM, the conflict must be **identified explicitly** — never silently accepted.
3. Do not implement changes that violate a locked PRM.
4. Client Directory / **PRM-001** is the reference architecture for customer identity.
5. Workspace / **PRM-002** is the reference architecture for operational runtime; modules must distinguish Client Identity from Workspace Runtime (§9).
6. Do **not** redesign navigation while reviewing modules.

## Index

| ID | Title | Status | Approved |
| --- | --- | --- | --- |
| [PRM-001](./PRM-001-CLIENT.md) | Platform Reference Model 001 – Client | **LOCKED** | 2026-07-19 |
| [PRM-002](./PRM-002-WORKSPACE.md) | Platform Reference Model 002 – Workspace | **LOCKED** | 2026-07-19 |
| [INTERNAL_NAVIGATION_BLUEPRINT.md](./INTERNAL_NAVIGATION_BLUEPRINT.md) | Internal Operations Navigation Blueprint | **APPROVED / FROZEN** | 2026-07-19 |
| [NAVIGATION_IMPLEMENTATION_CHECKLIST.md](./NAVIGATION_IMPLEMENTATION_CHECKLIST.md) | Nav-only implementation checklist | **IMPLEMENTED** | 2026-07-19 |
| [NAVIGATION_BEFORE_AFTER.md](./NAVIGATION_BEFORE_AFTER.md) | Before/after navigation comparison | — | 2026-07-19 |
| [PLATFORM_MODULE_REGISTER.md](./PLATFORM_MODULE_REGISTER.md) | Platform Module Register | **ACTIVE** | 2026-07-19 |
| [INTERNAL_OPERATIONS_IA.md](./INTERNAL_OPERATIONS_IA.md) | Internal Operations IA (earlier draft) | **SUPERSEDED** | — |

## Review sequence

1. ~~Lock business objects as PRMs~~ — done (PRM-001, PRM-002).
2. ~~Approve and implement internal navigation~~ — done; **frozen**.
3. Module-by-module: FDR → PRM check → approve → implement → verify → close (see Module Register).
4. Only after module architecture is approved for that module: implement that module alone.

**Note:** PRM-002 separates architecture (Workspace → Client required) from current operating policy (one primary Workspace per Client). Multi-workspace requires a future explicit PRM.
