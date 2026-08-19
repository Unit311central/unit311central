# Central EA Semantic Architecture — Implementation Plan

**Date:** 2026-08-19  
**Baseline:** Final Forensic Audit (19 Aug 2026)

## Problem

The EA has fragmented knowledge systems (6 read capabilities, ~24 actions, ~40 tools, application catalogue, workspace packs, intelligence packs, regex routing). GPT-Terra is reached before deterministic resolution for most business questions.

## Solution

Introduce `src/lib/central-application-model/` as the **single machine-readable source of truth** for:

- Canonical modules (L1) — extensible, not frozen at 22
- Domains (L2), functional areas (L3/viewIds)
- Entities, data sources, services
- EA capability bindings (read, write, composite, content)
- Workspace enablement (derived from nav, not hard-coded per slug)
- Semantic matching (tokens + aliases + normalisation — not per-question handlers)

Navigation maps **into** this model. The EA resolves against the model, not against nav leaves directly.

## Retained Systems

| System | Role after migration |
|--------|---------------------|
| `capabilities/definitions.ts` | Source definitions; bootstrapped into central model |
| `actions/registry.ts` | Write actions; indexed by central model |
| `tool-service.ts` | Tool execution; metadata registered in central model |
| `application-catalogue.ts` | Platform navigation Q&A; viewIds linked to model |
| `workspace-packs/*` | Workspace-specific **configuration** (tools, prompts, resolvers) — not duplicate architecture |
| `intelligence/workspace-packs/*` | Intelligence domain providers; registered in model |
| `EaResponseBlocks.tsx` | Response rendering unchanged |
| Existing PDF services | Used via capability bindings |

## Deprecated / Reduced

| Pattern | Replacement |
|---------|-------------|
| `kind: "none"` for business reads before semantic resolution | `resolveSemanticEaRequest()` first |
| Per-question regex resolvers | Semantic metadata on capabilities |
| Workspace slug branches for standard functionality | Workspace enablement from nav |
| Manual pack registration for standard workspaces | `genericWorkspacePack` fallback |

## New Route Kinds

- `multi_capability` — deterministic cross-module execution with combined formatter
- `evidence_gpt` — permissions checked, evidence gathered, GPT synthesises only authorised JSON

## Affected Files

### New
- `src/lib/central-application-model/*`
- `src/lib/ai-operating-assistant/actions/modules/finance/create-invoice.ts`
- `src/lib/ai-operating-assistant/workspace-packs/generic-pack.ts`
- `src/lib/central-application-model/__tests__/semantic-architecture.check.ts`

### Modified
- `src/lib/ai-operating-assistant/action-orchestration.ts`
- `src/lib/ai-operating-assistant/orchestration-route.ts`
- `src/lib/ai-operating-assistant/assistant-runtime.ts`
- `src/lib/ai-operating-assistant/capabilities/read-registry.ts`
- `src/lib/ai-operating-assistant/capabilities/definitions.ts`
- `src/lib/ai-operating-assistant/workspace-packs/client-bootstrap.ts`
- `src/lib/ai-operating-assistant/actions/modules/finance/register.ts`
- `package.json` (prove script)

## Migration Strategy

1. Bootstrap central model at module load (idempotent).
2. Existing 6 read capabilities register unchanged behaviour.
3. Orchestration calls semantic resolver before `kind: "none"`.
4. Composite capabilities added for cross-module reads.
5. Create invoice action via action framework.
6. Content Studio capabilities registered; tools bridge to placeholder store.
7. Generic workspace pack for unknown slugs.

## Regression Tests

- `prove:ea-capabilities` — bank balance, headcount, typos, permissions, cross-workspace
- `prove:ea-semantic` — new acceptance suite (A–N subset)
- `prove:ea-inheritance`, `prove:ea-provisioning`

## Security

- Permissions checked before capability match returns execute path
- Cross-workspace probes unchanged
- `evidence_gpt` receives only serialised tool results after permission checks
- Disabled modules return explicit unavailable response

## Known Limitations (post-implementation)

- Employee growth chart requires historical snapshots (partial until HR history service exists)
- Full nav→semantic auto-discovery for all 100+ leaves is incremental; core modules wired first
- Workspace-specific pack resolvers retained for specialist intelligence until migrated to model config
