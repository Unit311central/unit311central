# Workspace identity — Stage 2 (implemented)

Stage 2 stops tenant user mirroring into `internal_operators` and scopes person/user directories by **workspace membership**.

## Code changes (summary)

- `createWorkspaceTenantUser` / update / remove / password: `platform_users` + `workspace_users` only.
- `GET /api/users`: `listWorkspaceTenantUsers(current workspace)` (Demo/ABHI fixtures unchanged).
- Messaging operators/channels/scheduled calls: `listActiveMessagingOperatorsForWorkspace`.
- Support, CRM enquiries, CRM report chat, AI account manager: workspace-scoped person directory.
- `requireUsersModuleAdministratorSession`: membership via `session.sub` + `workspace_users`; platform admin bypass.
- Demo user list: fixtures only (no global operator merge).

## Read-only production audit

```bash
node --require ./scripts/test-server-only-hook.cjs --import tsx scripts/audit-workspace-identity-stage2-readonly.ts
```

Output: `/opt/cursor/artifacts/workspace-isolation-stage2/readonly-audit.json`

## Data cleanup (explicit, reviewed — not executed in Stage 2)

- Reconcile production `platform_users.workspace_id` vs `workspace_users`.
- Classify remaining `internal_operators` rows (genuine Unit311 vs legacy tenant mirrors).
- Fix mis-assigned HR rows (employee workspace ≠ platform user membership).
- Do **not** delete operator rows or move users until remediation is approved.

## Stage 3+ (future)

- UI: Add Employee / Users module clarity (employee ≠ platform user).
- HR mutations: role-based admin gate.
- Optional platform admin grant table separate from workspace membership.
