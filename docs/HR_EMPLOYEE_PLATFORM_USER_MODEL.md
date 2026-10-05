# HR Employee ↔ Platform User (Stage 1)

## Canonical semantics

```
Workspace
  |
  +-- hr_employees (Employee)
  |       |
  |       +-- platform_user_id (optional UUID → platform_users.id)
  |
  +-- workspace_users (membership / role)
          |
          +-- platform_users (login identity)
```

- **Employee** — HR/business record; always `hr_employees.workspace_id`.
- **Platform user** — authentication identity (`platform_users`).
- **Workspace user** — access to a workspace (`workspace_users`); separate from employment.
- **`internal_operators`** — legacy/global Unit311 operator catalogue and messaging ids; **not** the canonical employee↔user link for tenant workspaces.

## Lifecycle (implemented in code)

| Case | Behaviour |
|------|-----------|
| A — Employee without login | `createHrEmployee` — no `platform_users` row; `platform_user_id` stays null. |
| B — Employee + login at once | Stage 2 UI; use `createHrEmployee` then `linkHrEmployeeToPlatformUser` after tenant user provisioning. |
| C — Login later | `linkHrEmployeeToPlatformUser(employeeId, platformUserId, { workspaceId })`. |
| D — Remove platform access from employee | `unlinkHrEmployeePlatformUser` — sets `platform_user_id` and legacy `operator_id` to null; **does not** delete `platform_users` or the employee. |
| E — User without employee | Supported; no HR row required. |

## Link validation

`validateEmployeePlatformUserLink` / `linkHrEmployeeToPlatformUser` require the platform user to belong to the **same workspace** as the employee via:

- `platform_users.workspace_id`, and/or
- a `workspace_users` row for that workspace.

Cross-workspace links (e.g. employee on `unit311`, user on `interfaceworx`) are rejected.

## Schema (migration `219_hr_employee_platform_user_link.sql`)

- `hr_employees.platform_user_id` → `uuid`, FK to `platform_users(id)` **ON DELETE SET NULL**.
- Unique partial index on `(workspace_id, platform_user_id)` when not null.
- Invalid/orphan text ids nulled before type conversion (documented in migration).

## Tenant user creation (unchanged in Stage 1)

`createWorkspaceTenantUser` still writes `platform_users`, `workspace_users`, and `internal_operators`. Stage 2 will decouple `internal_operators` from tenant provisioning.

Tenant listing remains: `listWorkspaceTenantUsers(workspaceId)` (`workspace_users` ∩ `platform_users`).
