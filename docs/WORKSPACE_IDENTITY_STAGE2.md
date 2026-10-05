# Workspace identity — Stage 2 backlog

Stage 1 established `hr_employees.platform_user_id` and link/unlink services only. Do not start until approved.

## UI

- Add Employee modal: employee-only vs create/link user.
- Employee record: platform access status, link existing user, create user, unlink.
- Users module: stop implying every user is an employee.

## Users / operators

- Remove `internal_operators` insert/update from `createWorkspaceTenantUser` / `updateWorkspaceTenantUser` for customer tenants.
- Restrict `listInternalOperators()` to Unit311 internal surfaces only.
- Messaging / scheduled calls / channels: workspace-scoped operator lists (Wolf/Green Desert pattern generalised).

## Admin layers

- Platform admin grant table separate from `workspace_users`.
- Fix `requireUsersModuleAdministratorSession` primary-`workspace_id` vs multi-membership.
- HR mutations: role-based admin gate.

## Data cleanup (explicit, reviewed)

- Reconcile production `platform_users.workspace_id` vs `workspace_users`.
- Fix mis-assigned HR rows (e.g. employee workspace ≠ user workspace).
- Audit log on user/employee/membership mutations.

## Call sites using global `listInternalOperators()`

See repository grep for `listInternalOperators` — includes `/api/users` (internal), `/api/messaging/operators`, support/CRM/AI helpers, `demo-users-service` (admin extras).
